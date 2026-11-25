import { spawn, type ChildProcess } from 'node:child_process';
import { connect, type Socket } from 'node:net';
import { posix, win32 } from 'node:path';
import { unlinkSync, readFileSync, chmodSync } from 'node:fs';
import { createRequire } from 'node:module';
import { privateTempPath } from '../../utils/temp-dir.js';

let socketPath: string | null = null;
function getSocketPath(): string {
	socketPath ??= privateTempPath('audio.sock');
	return socketPath;
}

/**
 * Path of the klets-audio binary inside its platform package, given the
 * resolved path of that package's package.json.
 */
export function binaryPathFromPackageJson(
	pkgJsonPath: string,
	platform: NodeJS.Platform,
): string {
	const path = platform === 'win32' ? win32 : posix;
	const ext = platform === 'win32' ? '.exe' : '';
	return path.join(path.dirname(pkgJsonPath), 'bin', `klets-audio${ext}`);
}

let proc: ChildProcess | null = null;
let socket: Socket | null = null;
let requestId = 0;
let positionSeconds = 0;
let durationSeconds = 0;
let active = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Resolve the klets-audio binary path from the platform-specific npm package.
 */
function resolveBinary(): string | null {
	const platform = process.platform;
	const arch = process.arch;

	let pkgName: string;
	if (platform === 'darwin' && arch === 'arm64') {
		pkgName = '@klets/audio-darwin-arm64';
	} else if (platform === 'darwin' && arch === 'x64') {
		pkgName = '@klets/audio-darwin-x64';
	} else if (platform === 'linux' && arch === 'x64') {
		pkgName = '@klets/audio-linux-x64-gnu';
	} else if (platform === 'linux' && arch === 'arm64') {
		pkgName = '@klets/audio-linux-arm64-gnu';
	} else if (platform === 'win32' && arch === 'x64') {
		pkgName = '@klets/audio-win32-x64';
	} else if (platform === 'win32' && arch === 'arm64') {
		pkgName = '@klets/audio-win32-arm64';
	} else {
		return null;
	}

	try {
		const require = createRequire(import.meta.url);
		const pkgJson = require.resolve(`${pkgName}/package.json`);
		const binPath = binaryPathFromPackageJson(pkgJson, platform);
		// Ensure the binary is executable (npm may not preserve permissions)
		if (platform !== 'win32') {
			try { chmodSync(binPath, 0o755); } catch { /* ignore */ }
		}
		return binPath;
	} catch {
		return null;
	}
}

let cachedBinary: string | null | undefined = undefined;

export function isAvailable(): boolean {
	if (cachedBinary === undefined) {
		cachedBinary = resolveBinary();
	}
	return cachedBinary !== null;
}

export function play(url: string, startSeconds = 0): boolean {
	stop();

	const binary = cachedBinary ?? resolveBinary();
	if (!binary) return false;
	cachedBinary = binary;

	const path = getSocketPath();
	try {
		unlinkSync(path);
	} catch {
		// ignore
	}

	proc = spawn(binary, ['--socket', path], {
		stdio: 'ignore',
		detached: false,
	});

	proc.on('error', () => {
		cleanup();
	});
	proc.on('exit', () => {
		cleanup();
	});

	active = true;

	// Give the binary a moment to create the socket, then connect and play
	setTimeout(() => {
		connectSocket(() => {
			sendCommand({ id: ++requestId, cmd: 'play', url, start_seconds: startSeconds });
		});
	}, 300);

	return true;
}

function connectSocket(onConnect?: () => void) {
	if (!proc || proc.exitCode !== null) return;

	if (process.platform === 'win32') {
		// On Windows, klets-audio writes a TCP port to the socket file
		try {
			const port = parseInt(readFileSync(getSocketPath(), 'utf-8').trim(), 10);
			socket = connect({ port, host: '127.0.0.1' });
		} catch {
			// Port file not ready yet — retry
			if (proc && proc.exitCode === null) {
				setTimeout(() => connectSocket(onConnect), 200);
			}
			return;
		}
	} else {
		socket = connect(getSocketPath());
	}

	socket.on('connect', () => {
		onConnect?.();

		// Poll state frequently for responsive UI updates
		pollTimer = setInterval(() => {
			sendCommand({ id: ++requestId, cmd: 'get_state' });
		}, 300);
	});

	socket.on('error', () => {
		// Socket not ready yet — retry once
		socket = null;
		if (proc && proc.exitCode === null) {
			setTimeout(() => connectSocket(onConnect), 200);
		}
	});

	socket.on('data', (data) => {
		const lines = data.toString().split('\n').filter(Boolean);
		for (const line of lines) {
			try {
				const msg = JSON.parse(line);
				if (msg.state) {
					positionSeconds = msg.state.position ?? 0;
					durationSeconds = msg.state.duration ?? 0;
					active = msg.state.active ?? false;
				}
			} catch {
				// ignore parse errors
			}
		}
	});
}

interface IpcCommand {
	id: number;
	cmd: string;
	[key: string]: unknown;
}

function sendCommand(cmd: IpcCommand) {
	if (!socket || socket.destroyed) return;
	socket.write(JSON.stringify(cmd) + '\n');
}

export function stop(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	if (socket && !socket.destroyed) {
		sendCommand({ id: ++requestId, cmd: 'stop' });
		sendCommand({ id: ++requestId, cmd: 'quit' });
		socket.destroy();
		socket = null;
	}
	if (proc) {
		proc.kill();
		proc = null;
	}
	active = false;
	positionSeconds = 0;
	durationSeconds = 0;
	if (socketPath) {
		try {
			unlinkSync(socketPath);
		} catch {
			// ignore
		}
	}
}

export function isActive(): boolean {
	return active && proc !== null && proc.exitCode === null;
}

export function seekTo(seconds: number): void {
	sendCommand({
		id: ++requestId,
		cmd: 'seek',
		seconds,
		relative: false,
	});
}

export function seek(seconds: number): void {
	sendCommand({
		id: ++requestId,
		cmd: 'seek',
		seconds,
		relative: true,
	});
}

export function getPosition(): number {
	return positionSeconds;
}

export function getDuration(): number {
	return Math.floor(durationSeconds);
}

export function setSpeed(speed: number): void {
	sendCommand({
		id: ++requestId,
		cmd: 'set_speed',
		speed,
	});
}

function cleanup() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	if (socket && !socket.destroyed) {
		socket.destroy();
	}
	socket = null;
	proc = null;
	active = false;
	positionSeconds = 0;
	durationSeconds = 0;
}
