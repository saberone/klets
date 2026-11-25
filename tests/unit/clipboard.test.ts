import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import {
	copyToClipboard,
	clipboardCommands,
	osc52Sequence,
} from '../../src/utils/clipboard.js';
import { shareMessage } from '../../src/hooks/use-share-link.js';

type Outcome = 'ok' | 'fail' | 'enoent' | 'hang';

/** Fake child_process.spawn: never touches the real clipboard. */
function fakeSpawn(outcomes: Record<string, Outcome>) {
	const calls: { cmd: string; args: string[]; input: string }[] = [];
	const spawn = vi.fn((cmd: string, args: string[]) => {
		const child = new EventEmitter() as EventEmitter & {
			stdin: EventEmitter & { end: (s: string) => void };
			kill: () => void;
		};
		const call = { cmd, args, input: '' };
		calls.push(call);
		child.kill = vi.fn();
		const stdin = new EventEmitter() as EventEmitter & {
			end: (s: string) => void;
		};
		stdin.end = (s: string) => {
			call.input = s;
		};
		child.stdin = stdin;
		const outcome = outcomes[cmd] ?? 'enoent';
		setTimeout(() => {
			if (outcome === 'enoent')
				child.emit(
					'error',
					Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }),
				);
			else if (outcome === 'ok') child.emit('close', 0);
			else if (outcome === 'fail') child.emit('close', 1);
		}, 1);
		return child;
	});
	return { spawn: spawn as never, calls };
}

describe('clipboardCommands', () => {
	it('picks the native tool per platform', () => {
		expect(clipboardCommands('darwin').map((c) => c.cmd)).toEqual(['pbcopy']);
		expect(clipboardCommands('win32').map((c) => c.cmd)).toEqual(['clip']);
		expect(clipboardCommands('linux').map((c) => c.cmd)).toEqual([
			'wl-copy',
			'xclip',
			'xsel',
		]);
		expect(clipboardCommands('aix')).toEqual([]);
	});
});

describe('copyToClipboard', () => {
	it('uses pbcopy on darwin and writes the text to stdin', async () => {
		const { spawn, calls } = fakeSpawn({ pbcopy: 'ok' });
		const writeOsc52 = vi.fn(() => true);
		await expect(
			copyToClipboard('https://x', { platform: 'darwin', spawn, writeOsc52 }),
		).resolves.toBe('copied');
		expect(calls).toEqual([{ cmd: 'pbcopy', args: [], input: 'https://x' }]);
		expect(writeOsc52).not.toHaveBeenCalled();
	});

	it('uses clip on win32', async () => {
		const { spawn, calls } = fakeSpawn({ clip: 'ok' });
		await expect(
			copyToClipboard('t', {
				platform: 'win32',
				spawn,
				writeOsc52: () => true,
			}),
		).resolves.toBe('copied');
		expect(calls[0]!.cmd).toBe('clip');
	});

	it('on linux tries wl-copy, then xclip, then xsel', async () => {
		const { spawn, calls } = fakeSpawn({
			'wl-copy': 'enoent',
			xclip: 'fail',
			xsel: 'ok',
		});
		await expect(
			copyToClipboard('t', {
				platform: 'linux',
				spawn,
				writeOsc52: () => true,
			}),
		).resolves.toBe('copied');
		expect(calls.map((c) => c.cmd)).toEqual(['wl-copy', 'xclip', 'xsel']);
		expect(calls[1]!.args).toEqual(['-selection', 'clipboard']);
		expect(calls[2]!.args).toEqual(['--clipboard', '--input']);
	});

	it('falls back to OSC 52 and reports "sent" (unconfirmed) when no tool works', async () => {
		const { spawn } = fakeSpawn({});
		const writeOsc52 = vi.fn(() => true);
		await expect(
			copyToClipboard('hallo', { platform: 'linux', spawn, writeOsc52 }),
		).resolves.toBe('sent');
		expect(writeOsc52).toHaveBeenCalledWith(osc52Sequence('hallo'));
	});

	it('gives up on a hanging tool after the timeout', async () => {
		const { spawn } = fakeSpawn({ pbcopy: 'hang' });
		await expect(
			copyToClipboard('t', {
				platform: 'darwin',
				spawn,
				writeOsc52: () => false,
				timeoutMs: 20,
			}),
		).resolves.toBe('failed');
	});

	it('reports "failed" when there is no tool and no terminal for OSC 52', async () => {
		const { spawn } = fakeSpawn({});
		await expect(
			copyToClipboard('t', {
				platform: 'linux',
				spawn,
				writeOsc52: () => false,
			}),
		).resolves.toBe('failed');
	});
});

describe('osc52Sequence', () => {
	it('base64-encodes the text in an OSC 52 escape', () => {
		expect(osc52Sequence('hi')).toBe('\x1b]52;c;aGk=\x07');
	});
});

describe('shareMessage', () => {
	const url = 'https://codeklets.nl/afleveringen/ep?t=4';
	it('confirms a native copy without the URL', () => {
		expect(shareMessage('copied', url)).toMatchObject({
			text: 'Link gekopieerd',
			tone: 'success',
		});
	});
	it('shows the URL for an unconfirmed OSC 52 copy without claiming failure', () => {
		const m = shareMessage('sent', url);
		expect(m.text).toContain(url);
		expect(m.text).not.toMatch(/niet gelukt|mislukt/);
		expect(m.tone).toBe('info');
	});
	it('says copying failed and shows the URL when nothing worked', () => {
		const m = shareMessage('failed', url);
		expect(m.text).toContain('niet gelukt');
		expect(m.text).toContain(url);
	});
});
