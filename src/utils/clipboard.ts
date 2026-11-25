import { spawn as nodeSpawn } from 'node:child_process';

export interface ClipboardCommand {
	cmd: string;
	args: string[];
}

/** Native clipboard commands to try, in order, for a platform. */
export function clipboardCommands(
	platform: NodeJS.Platform,
): ClipboardCommand[] {
	switch (platform) {
		case 'darwin':
			return [{ cmd: 'pbcopy', args: [] }];
		case 'win32':
			return [{ cmd: 'clip', args: [] }];
		case 'linux':
			return [
				{ cmd: 'wl-copy', args: [] },
				{ cmd: 'xclip', args: ['-selection', 'clipboard'] },
				{ cmd: 'xsel', args: ['--clipboard', '--input'] },
			];
		default:
			return [];
	}
}

/** OSC 52 "set clipboard" escape sequence (supported by many terminals, also over SSH). */
export function osc52Sequence(text: string): string {
	return `\x1b]52;c;${Buffer.from(text, 'utf8').toString('base64')}\x07`;
}

export interface ClipboardDeps {
	platform?: NodeJS.Platform;
	spawn?: typeof nodeSpawn;
	/** Writes the OSC 52 sequence; returns false when there is no terminal to write to. */
	writeOsc52?: (sequence: string) => boolean;
	timeoutMs?: number;
}

function defaultWriteOsc52(sequence: string): boolean {
	if (!process.stdout.isTTY) return false;
	try {
		process.stdout.write(sequence);
		return true;
	} catch {
		return false;
	}
}

function runCopyCommand(
	command: ClipboardCommand,
	text: string,
	spawn: typeof nodeSpawn,
	timeoutMs: number,
): Promise<boolean> {
	return new Promise((resolve) => {
		let child: ReturnType<typeof nodeSpawn>;
		try {
			child = spawn(command.cmd, command.args, {
				stdio: ['pipe', 'ignore', 'ignore'],
			});
		} catch {
			resolve(false);
			return;
		}
		let settled = false;
		const timer = setTimeout(() => {
			child.kill();
			done(false);
		}, timeoutMs);
		function done(ok: boolean) {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(ok);
		}
		// ENOENT (command not installed) arrives asynchronously as 'error'
		child.on('error', () => done(false));
		child.on('close', (code) => done(code === 0));
		child.stdin?.on('error', () => done(false));
		child.stdin?.end(text);
	});
}

/**
 * - 'copied': a native tool (pbcopy / clip / wl-copy / xclip / xsel) confirmed the copy
 * - 'sent': no native tool worked, an OSC 52 escape was sent to the terminal;
 *   many terminals (also over SSH) copy it, but this cannot be confirmed
 * - 'failed': nothing could be done (no tool and no terminal)
 */
export type CopyOutcome = 'copied' | 'sent' | 'failed';

/**
 * Copies text to the system clipboard. Tries the native tool for the platform
 * and falls back to an OSC 52 escape.
 */
export async function copyToClipboard(
	text: string,
	deps: ClipboardDeps = {},
): Promise<CopyOutcome> {
	const platform = deps.platform ?? process.platform;
	const spawn = deps.spawn ?? nodeSpawn;
	const timeoutMs = deps.timeoutMs ?? 2000;

	for (const command of clipboardCommands(platform)) {
		if (await runCopyCommand(command, text, spawn, timeoutMs)) return 'copied';
	}

	return (deps.writeOsc52 ?? defaultWriteOsc52)(osc52Sequence(text))
		? 'sent'
		: 'failed';
}
