import { detectBackendAsync, type Backend } from './detect.js';
import {
	startMpv,
	stopMpv,
	isMpvActive,
	seekMpv,
	seekAbsoluteMpv,
	getPositionMpv,
	getDurationMpv,
	setSpeedMpv,
} from './mpv-ipc.js';
import * as kletsAudioBackend from './backends/klets-audio.js';
import * as pcmPipeBackend from './backends/pcm-pipe.js';
import * as commandBackend from './backends/command.js';

let detectedBackend: Backend | null | undefined = undefined;
let activeBackend: Backend | null = null;

export async function initBackend(): Promise<void> {
	detectedBackend = await detectBackendAsync();
}

export function getDetectedBackend(): Backend | null {
	if (detectedBackend === undefined) return null;
	return detectedBackend;
}

export async function play(
	audioUrl: string,
	startSeconds = 0,
): Promise<boolean> {
	if (detectedBackend === undefined) await initBackend();
	const backend = detectedBackend;
	if (!backend) return false;

	stop();
	activeBackend = backend;
	const url = audioUrl;

	switch (backend) {
		case 'klets-audio':
			return kletsAudioBackend.play(url, startSeconds);

		case 'mpv':
			return startMpv(url);

		case 'pcm-pipe':
			return pcmPipeBackend.play(url, startSeconds);

		case 'ffplay':
			return commandBackend.play(url, 'ffplay', 0);

		case 'afplay':
			return commandBackend.play(url, 'afplay', 0);
	}
}

export function stop(): void {
	switch (activeBackend) {
		case 'klets-audio':
			kletsAudioBackend.stop();
			break;
		case 'mpv':
			stopMpv();
			break;
		case 'pcm-pipe':
			pcmPipeBackend.stopSync();
			break;
		case 'ffplay':
		case 'afplay':
			commandBackend.stop();
			break;
	}
	activeBackend = null;
}

export function isActive(): boolean {
	switch (activeBackend) {
		case 'klets-audio':
			return kletsAudioBackend.isActive();
		case 'mpv':
			return isMpvActive();
		case 'pcm-pipe':
			return pcmPipeBackend.isActive();
		case 'ffplay':
		case 'afplay':
			return commandBackend.isActive();
		default:
			return false;
	}
}

export function seek(seconds: number): void {
	switch (activeBackend) {
		case 'klets-audio':
			kletsAudioBackend.seek(seconds);
			break;
		case 'mpv':
			seekMpv(seconds);
			break;
		case 'pcm-pipe':
			pcmPipeBackend.seekTo(getPosition() + seconds);
			break;
	}
}

export function seekAbsolute(seconds: number): void {
	switch (activeBackend) {
		case 'klets-audio':
			kletsAudioBackend.seekTo(seconds);
			break;
		case 'mpv':
			seekAbsoluteMpv(seconds);
			break;
		case 'pcm-pipe':
			pcmPipeBackend.seekTo(seconds);
			break;
	}
}

export function getPosition(): number {
	switch (activeBackend) {
		case 'klets-audio':
			return kletsAudioBackend.getPosition();
		case 'mpv':
			return getPositionMpv();
		case 'pcm-pipe':
			return pcmPipeBackend.getPosition();
		case 'ffplay':
		case 'afplay':
			return commandBackend.getPosition();
		default:
			return 0;
	}
}

export function getDuration(): number {
	switch (activeBackend) {
		case 'klets-audio':
			return kletsAudioBackend.getDuration();
		case 'mpv':
			return getDurationMpv();
		case 'pcm-pipe':
			return pcmPipeBackend.getDuration();
		case 'ffplay':
		case 'afplay':
			return commandBackend.getDuration();
		default:
			return 0;
	}
}

export function setSpeed(speed: number): void {
	switch (activeBackend) {
		case 'klets-audio':
			kletsAudioBackend.setSpeed(speed);
			break;
		case 'mpv':
			setSpeedMpv(speed);
			break;
	}
	// Other backends don't support speed control
}

export { type Backend } from './detect.js';
