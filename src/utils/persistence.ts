import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.config', 'klets');

export async function ensureConfigDir(): Promise<void> {
	await mkdir(CONFIG_DIR, { recursive: true });
}

export async function loadJson<T>(filename: string): Promise<T | null> {
	try {
		const raw = await readFile(join(CONFIG_DIR, filename), 'utf-8');
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export async function saveJson(filename: string, data: unknown): Promise<void> {
	try {
		await ensureConfigDir();
		await writeFile(
			join(CONFIG_DIR, filename),
			JSON.stringify(data, null, '\t'),
			'utf-8',
		);
	} catch {
		// No write permission — ignore
	}
}
