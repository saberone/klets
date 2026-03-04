import { spawn, type ChildProcess } from 'node:child_process';
import {
	createAudioStream,
	timeToByteOffset,
	type AudioStreamInfo,
} from '../stream.js';
import { resetDecoder, freeDecoder } from '../decode.js';
import { commandExists } from '../detect.js';

let proc: ChildProcess | null = null;
let playing = false;
let sampleRate = 44100;
let channels = 2;
let startTime = 0;
let seekOffset = 0;
let estimatedDuration = 0;
let streamInfo: AudioStreamInfo = { estimatedDuration: 0, totalBytes: 0 };
let currentUrl = '';
let abortCtrl: AbortController | null = null;
let generation = 0;

export function detectPcmPlayer(): 'ffplay' | 'aplay' | null {
	if (commandExists('ffplay')) return 'ffplay';
	if (process.platform === 'linux' && commandExists('aplay')) return 'aplay';
	return null;
}

export async function play(
	url: string,
	startSeconds = 0,
): Promise<boolean> {
	const player = detectPcmPlayer();
	if (!player) return false;

	stopSync();
	await resetDecoder();

	currentUrl = url;
	playing = true;
	seekOffset = startSeconds;
	generation++;
	streamInfo = { estimatedDuration: 0, totalBytes: 0 };

	abortCtrl = new AbortController();
	const stream = createAudioStream(url, streamInfo, {
		signal: abortCtrl.signal,
	});

	const first = await stream.next();
	if (first.done || !first.value) {
		playing = false;
		return false;
	}

	sampleRate = first.value.sampleRate;
	channels = first.value.channels;
	estimatedDuration = streamInfo.estimatedDuration;

	// If a start position was requested, restart from the right byte offset
	let activeStream: AsyncGenerator<{ buffer: Buffer; samplesDecoded: number; sampleRate: number; channels: number }> = stream;
	let firstBuf = first.value.buffer;

	if (startSeconds > 0 && streamInfo.totalBytes > 0) {
		abortCtrl.abort();
		await resetDecoder();

		const byteOffset = timeToByteOffset(
			startSeconds,
			streamInfo.totalBytes,
			estimatedDuration,
		);

		abortCtrl = new AbortController();
		activeStream = createAudioStream(url, streamInfo, {
			byteOffset,
			signal: abortCtrl.signal,
		});

		const resumed = await activeStream.next();
		if (resumed.done || !resumed.value) {
			playing = false;
			return false;
		}
		firstBuf = resumed.value.buffer;
	}

	spawnPlayer(player);
	startTime = Date.now();

	pumpAudio(activeStream, firstBuf, generation);

	return true;
}

function spawnPlayer(player: 'ffplay' | 'aplay'): void {
	const args =
		player === 'ffplay'
			? [
					'-f',
					's16le',
					'-ar',
					String(sampleRate),
					'-ac',
					String(channels),
					'-nodisp',
					'-autoexit',
					'-loglevel',
					'quiet',
					'-i',
					'pipe:0',
				]
			: [
					'-f',
					'S16_LE',
					'-r',
					String(sampleRate),
					'-c',
					String(channels),
					'-t',
					'raw',
					'-',
				];

	proc = spawn(player, args, {
		stdio: ['pipe', 'ignore', 'ignore'],
		detached: false,
	});

	proc.on('error', () => {
		proc = null;
		playing = false;
	});
	proc.on('exit', () => {
		proc = null;
		playing = false;
	});
}

async function pumpAudio(
	stream: AsyncGenerator<{ buffer: Buffer; samplesDecoded: number; sampleRate: number; channels: number }>,
	firstChunk: Buffer,
	gen: number,
): Promise<void> {
	try {
		if (gen !== generation || !proc?.stdin) return;
		proc.stdin.write(firstChunk);

		for await (const pcm of stream) {
			if (gen !== generation || !proc?.stdin) break;
			proc.stdin.write(pcm.buffer);
		}

		if (gen === generation) proc?.stdin?.end();
	} catch {
		// Stream error — stop gracefully
	}
}

export async function seekTo(seconds: number): Promise<void> {
	if (!playing || !currentUrl) return;

	const player = detectPcmPlayer();
	if (!player) return;

	seekOffset = seconds;
	startTime = Date.now();

	// Bump generation — old pump loop will exit
	generation++;
	const gen = generation;

	// Abort old HTTP stream so it stops delivering data immediately
	if (abortCtrl) {
		abortCtrl.abort();
		abortCtrl = null;
	}

	// Kill current player process
	if (proc) {
		try {
			proc.stdin?.end();
		} catch {
			// ignore
		}
		proc.kill();
		proc = null;
	}

	await resetDecoder();

	const byteOffset = timeToByteOffset(
		seconds,
		streamInfo.totalBytes,
		estimatedDuration,
	);

	abortCtrl = new AbortController();
	const stream = createAudioStream(currentUrl, streamInfo, {
		byteOffset,
		signal: abortCtrl.signal,
	});

	const first = await stream.next();
	if (first.done || !first.value || gen !== generation) return;

	spawnPlayer(player);
	startTime = Date.now();

	pumpAudio(stream, first.value.buffer, gen);
}

export function stopSync(): void {
	playing = false;
	generation++;

	// Abort HTTP stream so it stops immediately
	if (abortCtrl) {
		abortCtrl.abort();
		abortCtrl = null;
	}

	if (proc) {
		try {
			proc.stdin?.end();
		} catch {
			// ignore
		}
		proc.kill();
		proc = null;
	}

	freeDecoder();
	startTime = 0;
	seekOffset = 0;
	estimatedDuration = 0;
	currentUrl = '';
	streamInfo = { estimatedDuration: 0, totalBytes: 0 };
}

export async function stop(): Promise<void> {
	stopSync();
}

export function isActive(): boolean {
	return playing && proc !== null && proc.exitCode === null;
}

export function getPosition(): number {
	if (!playing || startTime === 0) return 0;
	return seekOffset + (Date.now() - startTime) / 1000;
}

export function getDuration(): number {
	return estimatedDuration;
}
