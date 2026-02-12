import { spawn, type ChildProcess } from 'node:child_process';
import { detectBackend, type Backend } from './detect.js';
import { getAudioUrl } from './rss.js';

let proc: ChildProcess | null = null;
let currentBackend: Backend | null = null;

export function getDetectedBackend(): Backend | null {
	if (currentBackend === null) {
		currentBackend = detectBackend();
	}
	return currentBackend;
}

export async function play(slug: string): Promise<boolean> {
	const backend = getDetectedBackend();
	if (!backend) return false;

	const url = await getAudioUrl(slug);
	if (!url) return false;

	stop();

	switch (backend) {
		case 'mpv':
			proc = spawn('mpv', ['--no-video', '--really-quiet', url], {
				stdio: 'ignore',
				detached: false,
			});
			break;
		case 'ffplay':
			proc = spawn('ffplay', ['-nodisp', '-autoexit', '-loglevel', 'quiet', url], {
				stdio: 'ignore',
				detached: false,
			});
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
	if (proc) {
		proc.kill();
		proc = null;
	}
}

export function isActive(): boolean {
	return proc !== null && proc.exitCode === null;
}
