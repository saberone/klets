export type TranscriptFormat = 'text' | 'vtt' | 'json';

export type ParsedCommand =
	| { kind: 'tui' }
	| { kind: 'help' }
	| { kind: 'version' }
	| { kind: 'play'; target: string }
	| { kind: 'search'; query: string; json: boolean }
	| { kind: 'transcript'; target: string; format: TranscriptFormat }
	| { kind: 'usage-error'; message: string; usage: string };

export const USAGE = {
	general:
		'Gebruik: klets [play <slug|latest> | search <zoekterm> [--json] | transcript <slug|latest> [--vtt | --json]]',
	play: 'Gebruik: klets play <slug|latest>',
	search: 'Gebruik: klets search <zoekterm> [--json]',
	transcript: 'Gebruik: klets transcript <slug|latest> [--vtt | --json]',
} as const;

function usageError(message: string, usage: string): ParsedCommand {
	return { kind: 'usage-error', message, usage };
}

function split(args: string[]): { positionals: string[]; flags: string[] } {
	const positionals: string[] = [];
	const flags: string[] = [];
	let onlyPositionals = false;
	for (const arg of args) {
		if (onlyPositionals) positionals.push(arg);
		else if (arg === '--') onlyPositionals = true;
		else if (arg.startsWith('-') && arg.length > 1) flags.push(arg);
		else positionals.push(arg);
	}
	return { positionals, flags };
}

/** Parses process.argv.slice(2). Never throws; usage problems become 'usage-error'. */
export function parseArgs(argv: string[]): ParsedCommand {
	if (argv.includes('--version') || argv.includes('-v'))
		return { kind: 'version' };
	if (argv.includes('--help') || argv.includes('-h')) return { kind: 'help' };
	if (argv.length === 0) return { kind: 'tui' };

	const [command, ...rest] = argv as [string, ...string[]];

	if (command.startsWith('-')) {
		return usageError(`Onbekende optie: ${command}`, USAGE.general);
	}

	const { positionals, flags } = split(rest);

	switch (command) {
		case 'play': {
			if (flags.length > 0) {
				return usageError(`Onbekende optie voor play: ${flags[0]}`, USAGE.play);
			}
			if (positionals.length === 0) {
				return usageError(
					'Geef een aflevering op (slug of "latest").',
					USAGE.play,
				);
			}
			if (positionals.length > 1) {
				return usageError('Geef precies één aflevering op.', USAGE.play);
			}
			return { kind: 'play', target: positionals[0]! };
		}

		case 'search': {
			const unknown = flags.find((f) => f !== '--json');
			if (unknown) {
				return usageError(
					`Onbekende optie voor search: ${unknown}`,
					USAGE.search,
				);
			}
			const query = positionals.join(' ').trim();
			if (!query) return usageError('Geef een zoekterm op.', USAGE.search);
			if (query.length < 2) {
				return usageError(
					'De zoekterm moet minimaal 2 tekens zijn.',
					USAGE.search,
				);
			}
			return { kind: 'search', query, json: flags.includes('--json') };
		}

		case 'transcript': {
			const unknown = flags.find((f) => f !== '--json' && f !== '--vtt');
			if (unknown) {
				return usageError(
					`Onbekende optie voor transcript: ${unknown}`,
					USAGE.transcript,
				);
			}
			if (flags.includes('--json') && flags.includes('--vtt')) {
				return usageError(
					'Kies --vtt of --json, niet allebei.',
					USAGE.transcript,
				);
			}
			if (positionals.length === 0) {
				return usageError(
					'Geef een aflevering op (slug of "latest").',
					USAGE.transcript,
				);
			}
			if (positionals.length > 1) {
				return usageError('Geef precies één aflevering op.', USAGE.transcript);
			}
			const format: TranscriptFormat = flags.includes('--vtt')
				? 'vtt'
				: flags.includes('--json')
					? 'json'
					: 'text';
			return { kind: 'transcript', target: positionals[0]!, format };
		}

		default:
			return usageError(`Onbekend commando: ${command}`, USAGE.general);
	}
}
