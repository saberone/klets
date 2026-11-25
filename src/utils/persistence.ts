import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

/** ~/.config/klets (resolved on each call). */
export function getConfigDir(): string {
	return join(homedir(), '.config', 'klets');
}

/** Sets the mode on POSIX systems; errors are ignored, no-op on Windows. */
async function setMode(path: string, mode: number): Promise<void> {
	if (process.platform === 'win32') return;
	try {
		await chmod(path, mode);
	} catch {
		// ignore
	}
}

/** Creates the config directory (owner-only) and tightens an existing one. */
export async function ensureConfigDir(): Promise<void> {
	const dir = getConfigDir();
	await mkdir(dir, { recursive: true, mode: DIR_MODE });
	await setMode(dir, DIR_MODE);
}

export async function loadJson<T>(filename: string): Promise<T | null> {
	try {
		const raw = await readFile(join(getConfigDir(), filename), 'utf-8');
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export async function saveJson(filename: string, data: unknown): Promise<void> {
	try {
		await ensureConfigDir();
		const path = join(getConfigDir(), filename);
		await writeFile(path, JSON.stringify(data, null, '\t'), {
			encoding: 'utf-8',
			mode: FILE_MODE,
		});
		// mode only applies to new files; also tighten an existing file
		await setMode(path, FILE_MODE);
	} catch {
		// No write permission — ignore
	}
}
