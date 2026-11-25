import { spawn } from 'node:child_process';
import { toWebUrl } from './web-url.js';

export const LINK_REFUSED_MESSAGE =
	'Deze link kan niet worden geopend (alleen webadressen).';

/** The command that opens a web link in the default browser on a platform. */
export function openCommand(
	platform: NodeJS.Platform,
	href: string,
): { cmd: string; args: string[] } {
	if (platform === 'darwin') return { cmd: 'open', args: [href] };
	if (platform === 'win32') {
		return { cmd: 'rundll32', args: ['url.dll,FileProtocolHandler', href] };
	}
	return { cmd: 'xdg-open', args: [href] };
}

/**
 * Opens a link in the default browser. Only web links (http/https) are
 * opened; returns whether the link was opened.
 */
export function openUrl(url: string): boolean {
	const href = toWebUrl(url);
	if (!href) return false;

	const { cmd, args } = openCommand(process.platform, href);
	try {
		const child = spawn(cmd, args, {
			stdio: 'ignore',
			detached: true,
		});
		child.on('error', () => {
			// No browser opener available — ignore
		});
		child.unref();
	} catch {
		return false;
	}
	return true;
}
