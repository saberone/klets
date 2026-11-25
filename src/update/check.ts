import got from 'got';
import { VERSION } from '../version.js';
import { loadJson, saveJson } from '../utils/persistence.js';

const CACHE_FILE = 'update-check.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
	latestVersion: string;
	checkedAt: number;
}

const SEMVER =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** Only a version that matches the semver pattern is shown or stored. */
export function isValidVersion(value: unknown): value is string {
	return typeof value === 'string' && value.length <= 256 && SEMVER.test(value);
}

export function isNewerVersion(current: string, latest: string): boolean {
	const [cMajor, cMinor, cPatch] = current.split('.').map(Number);
	const [lMajor, lMinor, lPatch] = latest.split('.').map(Number);

	if (lMajor! !== cMajor!) return lMajor! > cMajor!;
	if (lMinor! !== cMinor!) return lMinor! > cMinor!;
	return lPatch! > cPatch!;
}

async function readCache(): Promise<CacheData | null> {
	const data = await loadJson<Partial<CacheData>>(CACHE_FILE);
	if (
		data &&
		isValidVersion(data.latestVersion) &&
		typeof data.checkedAt === 'number' &&
		Date.now() - data.checkedAt < CACHE_TTL_MS
	) {
		return { latestVersion: data.latestVersion, checkedAt: data.checkedAt };
	}
	return null;
}

async function writeCache(latestVersion: string): Promise<void> {
	const data: CacheData = { latestVersion, checkedAt: Date.now() };
	await saveJson(CACHE_FILE, data);
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
	}).json<{ version?: unknown }>();

	const latestVersion = response?.version;
	if (!isValidVersion(latestVersion)) {
		throw new Error('Ongeldige versie ontvangen van npm');
	}
	await writeCache(latestVersion);

	return {
		updateAvailable: isNewerVersion(currentVersion, latestVersion),
		currentVersion,
		latestVersion,
	};
}
