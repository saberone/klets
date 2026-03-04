import { spawn, type ChildProcess } from 'node:child_process';

let proc: ChildProcess | null = null;
let playing = false;
let startTime = 0;
let storedDuration = 0;

export function play(
	url: string,
	backend: 'ffplay' | 'afplay',
	duration: number,
): boolean {
	stop();

	storedDuration = duration;
	playing = true;
	startTime = Date.now();

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
		playing = false;
	});
	proc.on('exit', () => {
		proc = null;
		playing = false;
	});

	return true;
}

export function stop(): void {
	playing = false;
	if (proc) {
		proc.kill();
		proc = null;
	}
	startTime = 0;
	storedDuration = 0;
}

export function isActive(): boolean {
	return playing && proc !== null && proc.exitCode === null;
}

export function getPosition(): number {
	if (!playing || startTime === 0) return 0;
	return (Date.now() - startTime) / 1000;
}

export function getDuration(): number {
	return storedDuration;
}
