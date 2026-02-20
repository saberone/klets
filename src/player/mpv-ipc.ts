import { spawn, type ChildProcess } from 'node:child_process';
import { connect, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';

const SOCKET_PATH = join(tmpdir(), `klets-mpv-${process.pid}.sock`);

let proc: ChildProcess | null = null;
let socket: Socket | null = null;
let requestId = 0;
let positionSeconds = 0;
let durationSeconds = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function startMpv(url: string): boolean {
	stopMpv();

	try {
		unlinkSync(SOCKET_PATH);
	} catch {
		// ignore
	}

	proc = spawn(
		'mpv',
		[
			'--no-video',
			'--really-quiet',
			`--input-ipc-server=${SOCKET_PATH}`,
			url,
		],
		{ stdio: 'ignore', detached: false },
	);

	proc.on('error', () => {
		cleanup();
	});
	proc.on('exit', () => {
		cleanup();
	});

	// Give mpv a moment to create the socket, then connect
	setTimeout(connectSocket, 500);

	return true;
}

function connectSocket() {
	if (!proc || proc.exitCode !== null) return;

	socket = connect(SOCKET_PATH);

	socket.on('error', () => {
		socket = null;
	});

	socket.on('data', (data) => {
		const lines = data.toString().split('\n').filter(Boolean);
		for (const line of lines) {
			try {
				const msg = JSON.parse(line);
				if (msg.data !== undefined && msg.request_id) {
					if (msg.request_id === -1) {
						positionSeconds = msg.data ?? 0;
					} else if (msg.request_id === -2) {
						durationSeconds = msg.data ?? 0;
					}
				}
			} catch {
				// ignore parse errors
			}
		}
	});

	// Poll position frequently for responsive transcript tracking
	pollTimer = setInterval(() => {
		sendCommand('get_property', 'time-pos', -1);
		sendCommand('get_property', 'duration', -2);
	}, 300);
}

function sendCommand(cmd: string, ...args: (string | number)[]) {
	if (!socket || socket.destroyed) return;
	const id = args.length > 0 && typeof args[args.length - 1] === 'number'
		? args.pop()!
		: ++requestId;
	const payload = { command: [cmd, ...args], request_id: id };
	socket.write(JSON.stringify(payload) + '\n');
}

export function seekMpv(seconds: number): void {
	sendCommand('seek', seconds as unknown as string, 'relative' as string);
}

export function seekAbsoluteMpv(seconds: number): void {
	sendCommand('seek', seconds as unknown as string, 'absolute' as string);
}

export function setSpeedMpv(speed: number): void {
	sendCommand('set_property', 'speed' as string, speed as unknown as string);
}

export function getPositionMpv(): number {
	return positionSeconds;
}

export function getDurationMpv(): number {
	return Math.floor(durationSeconds);
}

export function isMpvActive(): boolean {
	return proc !== null && proc.exitCode === null;
}

export function stopMpv(): void {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
	if (socket && !socket.destroyed) {
		sendCommand('quit');
		socket.destroy();
		socket = null;
	}
	if (proc) {
		proc.kill();
		proc = null;
	}
	positionSeconds = 0;
	durationSeconds = 0;
	try {
		unlinkSync(SOCKET_PATH);
	} catch {
		// ignore
	}
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
	positionSeconds = 0;
	durationSeconds = 0;
}
