import { execFile } from 'node:child_process';
import { resolve } from 'node:path';

export function isGloballyInstalled(): boolean {
	try {
		const argv1 = process.argv[1];
		if (!argv1) return false;
		const resolved = resolve(argv1);
		return !resolved.includes('node_modules');
	} catch {
		return false;
	}
}

interface UpdateResult {
	success: boolean;
	message: string;
}

export function performUpdate(): Promise<UpdateResult> {
	return new Promise((resolve) => {
		execFile(
			'npm',
			['install', '-g', 'klets@latest'],
			{ timeout: 60_000 },
			(error, stdout, stderr) => {
				if (error) {
					resolve({
						success: false,
						message: stderr || error.message,
					});
				} else {
					resolve({
						success: true,
						message: stdout || 'klets is bijgewerkt!',
					});
				}
			},
		);
	});
}
