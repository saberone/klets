import { execSync } from 'node:child_process';
import { isAvailable as isKletsAudioAvailable } from './backends/klets-audio.js';

export type Backend = 'klets-audio' | 'mpv' | 'pcm-pipe' | 'ffplay' | 'afplay';

export function commandExists(cmd: string): boolean {
	try {
		execSync(`which ${cmd}`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

export async function detectBackendAsync(): Promise<Backend | null> {
	if (isKletsAudioAvailable()) return 'klets-audio';
	if (commandExists('mpv')) return 'mpv';
	// pcm-pipe needs ffplay or aplay + WASM decoder
	if (commandExists('ffplay')) return 'pcm-pipe';
	if (process.platform === 'linux' && commandExists('aplay')) return 'pcm-pipe';
	if (process.platform === 'darwin' && commandExists('afplay')) return 'afplay';
	return null;
}

/**
 * Synchronous detection (legacy, excludes klets-audio).
 * Used by jingle playback which doesn't need the full pipeline.
 */
export function detectBackend(): Backend | null {
	if (isKletsAudioAvailable()) return 'klets-audio';
	if (commandExists('mpv')) return 'mpv';
	if (commandExists('ffplay')) return 'ffplay';
	if (process.platform === 'darwin' && commandExists('afplay')) return 'afplay';
	return null;
}
