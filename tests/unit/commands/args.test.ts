import { describe, it, expect } from 'vitest';
import { parseArgs, USAGE } from '../../../src/commands/args.js';

describe('parseArgs', () => {
	it('bare klets starts the TUI', () => {
		expect(parseArgs([])).toEqual({ kind: 'tui' });
	});

	it('handles --help/-h and --version/-v', () => {
		expect(parseArgs(['--help']).kind).toBe('help');
		expect(parseArgs(['-h']).kind).toBe('help');
		expect(parseArgs(['--version']).kind).toBe('version');
		expect(parseArgs(['-v']).kind).toBe('version');
		expect(parseArgs(['search', '--help']).kind).toBe('help');
	});

	it('parses play', () => {
		expect(parseArgs(['play', 'latest'])).toEqual({
			kind: 'play',
			target: 'latest',
		});
		expect(parseArgs(['play', 'my-slug'])).toEqual({
			kind: 'play',
			target: 'my-slug',
		});
	});

	it('parses search with a multi-word query and --json anywhere', () => {
		expect(parseArgs(['search', 'react', 'hooks'])).toEqual({
			kind: 'search',
			query: 'react hooks',
			json: false,
		});
		expect(parseArgs(['search', '--json', 'react'])).toEqual({
			kind: 'search',
			query: 'react',
			json: true,
		});
		expect(parseArgs(['search', 'react', '--json'])).toEqual({
			kind: 'search',
			query: 'react',
			json: true,
		});
	});

	it('parses transcript formats', () => {
		expect(parseArgs(['transcript', 'latest'])).toEqual({
			kind: 'transcript',
			target: 'latest',
			format: 'text',
		});
		expect(parseArgs(['transcript', 'x', '--vtt'])).toEqual({
			kind: 'transcript',
			target: 'x',
			format: 'vtt',
		});
		expect(parseArgs(['transcript', '--json', 'x'])).toEqual({
			kind: 'transcript',
			target: 'x',
			format: 'json',
		});
	});

	it('-- ends option parsing', () => {
		expect(parseArgs(['search', '--', '-weird'])).toEqual({
			kind: 'search',
			query: '-weird',
			json: false,
		});
	});

	const usageCases: [string[], string, string][] = [
		[['bogus'], 'Onbekend commando: bogus', USAGE.general],
		[['--bogus'], 'Onbekende optie: --bogus', USAGE.general],
		[['play'], 'Geef een aflevering op', USAGE.play],
		[['play', 'a', 'b'], 'precies één', USAGE.play],
		[['play', 'a', '--json'], 'Onbekende optie voor play', USAGE.play],
		[['search'], 'Geef een zoekterm op', USAGE.search],
		[['search', 'x'], 'minimaal 2 tekens', USAGE.search],
		[
			['search', 'react', '--vtt'],
			'Onbekende optie voor search: --vtt',
			USAGE.search,
		],
		[['transcript'], 'Geef een aflevering op', USAGE.transcript],
		[['transcript', 'a', '--vtt', '--json'], 'niet allebei', USAGE.transcript],
		[
			['transcript', 'a', '--srt'],
			'Onbekende optie voor transcript: --srt',
			USAGE.transcript,
		],
	];

	it.each(usageCases)('%j is a usage error', (argv, message, usage) => {
		const result = parseArgs(argv);
		expect(result.kind).toBe('usage-error');
		if (result.kind === 'usage-error') {
			expect(result.message).toContain(message);
			expect(result.usage).toBe(usage);
		}
	});
});
