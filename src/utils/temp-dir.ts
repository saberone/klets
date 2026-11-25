import { mkdtempSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir: string | null = null;

/**
 * A private directory (mode 0700) for this process's temporary files and
 * sockets. Created on first use and removed when the process exits.
 */
export function getPrivateTempDir(): string {
	if (dir) return dir;
	const created = mkdtempSync(join(tmpdir(), 'klets-'));
	if (process.platform !== 'win32') {
		try {
			chmodSync(created, 0o700);
		} catch {
			// ignore
		}
	}
	dir = created;
	process.once('exit', removePrivateTempDir);
	return created;
}

/** Path for a file inside the private temp directory. */
export function privateTempPath(name: string): string {
	return join(getPrivateTempDir(), name);
}

/** Removes the private temp directory (also runs automatically on exit). */
export function removePrivateTempDir(): void {
	if (!dir) return;
	try {
		rmSync(dir, { recursive: true, force: true });
	} catch {
		// ignore
	}
	dir = null;
	process.removeListener('exit', removePrivateTempDir);
}
