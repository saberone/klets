import { exec } from 'node:child_process';

export function openUrl(url: string): void {
	const platform = process.platform;
	const cmd =
		platform === 'darwin'
			? 'open'
			: platform === 'win32'
				? 'start'
				: 'xdg-open';

	exec(`${cmd} ${JSON.stringify(url)}`);
}
