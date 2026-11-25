export interface Io {
	out: (text: string) => void;
	err: (text: string) => void;
	color: boolean;
}

/** Colour only on a TTY and only when NO_COLOR is not set (https://no-color.org). */
export function shouldUseColor(
	isTTY: boolean | undefined,
	env: Record<string, string | undefined>,
): boolean {
	return Boolean(isTTY) && env['NO_COLOR'] === undefined;
}

const codes = {
	bold: [1, 22],
	dim: [2, 22],
	cyan: [36, 39],
	coral: [95, 39],
	red: [31, 39],
} as const;

export type Style = Record<keyof typeof codes, (text: string) => string>;

export function createStyle(color: boolean): Style {
	const entries = Object.entries(codes).map(([name, [open, close]]) => [
		name,
		(text: string) => (color ? `\x1b[${open}m${text}\x1b[${close}m` : text),
	]);
	return Object.fromEntries(entries) as Style;
}

const guarded = new WeakSet<object>();

/**
 * Exit quietly when the reader of stdout goes away (`klets transcript latest | head -3`)
 * instead of crashing with an EPIPE stack trace.
 */
export function installPipeGuard(
	stream: NodeJS.WriteStream = process.stdout,
): void {
	if (guarded.has(stream)) return;
	guarded.add(stream);
	stream.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code === 'EPIPE') {
			process.exit(0);
			return;
		}
		throw err;
	});
}

/** Io bound to the real process streams. */
export function createProcessIo(): Io {
	installPipeGuard();
	return {
		out: (text) => {
			process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
		},
		err: (text) => {
			process.stderr.write(text.endsWith('\n') ? text : `${text}\n`);
		},
		color: shouldUseColor(process.stdout.isTTY, process.env),
	};
}
