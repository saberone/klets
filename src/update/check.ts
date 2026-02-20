import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import got from 'got';
import { VERSION } from '../version.js';

const CACHE_DIR = join(homedir(), '.config', 'klets');
const CACHE_FILE = join(CACHE_DIR, 'update-check.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
	latestVersion: string;
	checkedAt: number;
}

export function isNewerVersion(current: string, latest: string): boolean {
	const [cMajor, cMinor, cPatch] = current.split('.').map(Number);
	const [lMajor, lMinor, lPatch] = latest.split('.').map(Number);

	if (lMajor! !== cMajor!) return lMajor! > cMajor!;
	if (lMinor! !== cMinor!) return lMinor! > cMinor!;
	return lPatch! > cPatch!;
}

async function readCache(): Promise<CacheData | null> {
	try {
		const raw = await readFile(CACHE_FILE, 'utf-8');
		const data = JSON.parse(raw) as CacheData;
		if (Date.now() - data.checkedAt < CACHE_TTL_MS) {
			return data;
		}
	} catch {
		// Cache missing or corrupt — ignore
	}
	return null;
}

async function writeCache(latestVersion: string): Promise<void> {
	try {
		await mkdir(CACHE_DIR, { recursive: true });
		const data: CacheData = { latestVersion, checkedAt: Date.now() };
		await writeFile(CACHE_FILE, JSON.stringify(data), 'utf-8');
	} catch {
		// No write permission — ignore
	}
}

interface UpdateCheckResult {
	updateAvailable: boolean;
	currentVersion: string;
	latestVersion: string;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
	const currentVersion = VERSION;

	// Use cache only if it already found a newer version — otherwise re-check
	const cached = await readCache();
	if (cached && isNewerVersion(currentVersion, cached.latestVersion)) {
		return {
			updateAvailable: true,
			currentVersion,
			latestVersion: cached.latestVersion,
		};
	}

	// Fetch from npm registry
	const response = await got('https://registry.npmjs.org/klets/latest', {
		timeout: { request: 5_000 },
		retry: { limit: 0 },
	}).json<{ version: string }>();

	const latestVersion = response.version;
	await writeCache(latestVersion);

	return {
		updateAvailable: isNewerVersion(currentVersion, latestVersion),
		currentVersion,
		latestVersion,
	};
}
