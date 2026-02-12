import { execSync } from 'node:child_process';

export type Backend = 'mpv' | 'ffplay' | 'afplay';

function commandExists(cmd: string): boolean {
	try {
		execSync(`which ${cmd}`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

export function detectBackend(): Backend | null {
	if (commandExists('mpv')) return 'mpv';
	if (commandExists('ffplay')) return 'ffplay';
	if (process.platform === 'darwin' && commandExists('afplay')) return 'afplay';
	return null;
}
