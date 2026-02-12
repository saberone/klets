import { spawn, type ChildProcess } from 'node:child_process';
import { detectBackend, type Backend } from './detect.js';
import { getAudioUrl } from './rss.js';
import {
	startMpv,
	stopMpv,
	isMpvActive,
	seekMpv,
	seekAbsoluteMpv,
	getPositionMpv,
	getDurationMpv,
} from './mpv-ipc.js';

let proc: ChildProcess | null = null;
let detectedBackend: Backend | null | undefined = undefined;
let activeBackend: Backend | null = null;

export function getDetectedBackend(): Backend | null {
	if (detectedBackend === undefined) {
		detectedBackend = detectBackend();
	}
	return detectedBackend;
}

export async function play(slug: string): Promise<boolean> {
	const backend = getDetectedBackend();
	if (!backend) return false;

	const url = await getAudioUrl(slug);
	if (!url) return false;

	stop();
	activeBackend = backend;

	if (backend === 'mpv') {
		return startMpv(url);
	}

	switch (backend) {
		case 'ffplay':
			proc = spawn(
				'ffplay',
				['-nodisp', '-autoexit', '-loglevel', 'quiet', url],
				{ stdio: 'ignore', detached: false },
			);
			break;
		case 'afplay':
			proc = spawn('afplay', [url], {
				stdio: 'ignore',
				detached: false,
			});
			break;
	}

	proc.on('error', () => {
		proc = null;
	});
	proc.on('exit', () => {
		proc = null;
	});

	return true;
}

export function stop(): void {
	if (activeBackend === 'mpv') {
		stopMpv();
	}
	if (proc) {
		proc.kill();
		proc = null;
	}
	activeBackend = null;
}

export function isActive(): boolean {
	if (activeBackend === 'mpv') return isMpvActive();
	return proc !== null && proc.exitCode === null;
}

export function seek(seconds: number): void {
	if (activeBackend === 'mpv') {
		seekMpv(seconds);
	}
	// ffplay/afplay don't support seeking
}

export function seekAbsolute(seconds: number): void {
	if (activeBackend === 'mpv') {
		seekAbsoluteMpv(seconds);
	}
}

export function getPosition(): number {
	if (activeBackend === 'mpv') return getPositionMpv();
	return 0;
}

export function getDuration(): number {
	if (activeBackend === 'mpv') return getDurationMpv();
	return 0;
}

export { type Backend } from './detect.js';
