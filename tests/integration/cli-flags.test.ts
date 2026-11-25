import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const CLI_PATH = resolve(import.meta.dirname, '../../dist/cli.js');

describe('CLI flags', () => {
	it('--version prints version', () => {
		const output = execSync(`node ${CLI_PATH} --version`, {
			encoding: 'utf8',
		}).trim();
		expect(output).toMatch(/^klets \d+\.\d+\.\d+$/);
	});

	it('-v prints version', () => {
		const output = execSync(`node ${CLI_PATH} -v`, {
			encoding: 'utf8',
		}).trim();
		expect(output).toMatch(/^klets \d+\.\d+\.\d+$/);
	});

	it('--help prints usage', () => {
		const output = execSync(`node ${CLI_PATH} --help`, {
			encoding: 'utf8',
		}).trim();
		expect(output).toContain('klets');
		expect(output).toContain('Gebruik:');
		expect(output).toContain('Toetsen:');
	});

	it('-h prints usage', () => {
		const output = execSync(`node ${CLI_PATH} -h`, {
			encoding: 'utf8',
		}).trim();
		expect(output).toContain('Gebruik:');
	});
});

function runCli(args: string[], env: Record<string, string> = {}) {
	return spawnSync('node', [CLI_PATH, ...args], {
		encoding: 'utf8',
		// Unreachable API: these tests never touch the network
		env: { ...process.env, CODEKLETS_API_URL: 'http://127.0.0.1:1', ...env },
		timeout: 30_000,
	});
}

describe('CLI usage errors (exit 2)', () => {
	const cases: [string[], string][] = [
		[['bogus'], 'Onbekend commando: bogus'],
		[['--bogus'], 'Onbekende optie: --bogus'],
		[['play'], 'Gebruik: klets play'],
		[['search'], 'Gebruik: klets search'],
		[['search', 'x'], 'minimaal 2 tekens'],
		[['transcript'], 'Gebruik: klets transcript'],
		[['transcript', 'latest', '--vtt', '--json'], 'niet allebei'],
	];

	it.each(cases)('klets %j', (args, expected) => {
		const result = runCli(args);
		expect(result.status).toBe(2);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain(expected);
		expect(result.stderr).toContain('Gebruik:');
		expect(result.stderr).not.toMatch(/at .*\.js:\d+/);
	});
});

describe('CLI runtime errors (exit 1, no network)', () => {
	it.each([
		[['search', 'react']],
		[['search', 'react', '--json']],
		[['transcript', 'latest']],
		[['play', 'some-slug']],
	])('klets %j with an unreachable API', (args) => {
		const result = runCli(args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('niet bereiken');
		expect(result.stderr).not.toMatch(/at .*\.js:\d+/);
	}, 30_000);
});

describe('help text', () => {
	it('documents the subcommands', () => {
		const out = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
		expect(out).toContain('klets play <slug|latest>');
		expect(out).toContain('klets search <zoekterm> [--json]');
		expect(out).toContain('klets transcript <slug|latest>');
		expect(out).toContain('--vtt');
	});
});

describe('startup path of print commands', () => {
	// Walk the static imports from dist/cli.js; ink, react, the player and the
	// jingle must only be reachable through dynamic import().
	function staticGraph(entry: string): { files: Set<string>; packages: Set<string> } {
		const files = new Set<string>();
		const packages = new Set<string>();
		const queue = [entry];
		while (queue.length > 0) {
			const file = queue.pop()!;
			if (files.has(file)) continue;
			files.add(file);
			const src = readFileSync(file, 'utf8');
			for (const m of src.matchAll(/^\s*import\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/gm)) {
				const spec = m[1]!;
				if (spec.startsWith('.')) queue.push(join(dirname(file), spec));
				else packages.add(spec);
			}
		}
		return { files, packages };
	}

	it('dist/cli.js does not statically load ink, react, the player or the jingle', () => {
		const { files, packages } = staticGraph(CLI_PATH);
		for (const pkg of packages) {
			expect(pkg).not.toMatch(/^(ink|react|ink-gradient|ink-spinner|mpg123-decoder|zustand|got)(\/|$)/);
		}
		const code = [...files].map((f) => readFileSync(f, 'utf8')).join('\n');
		expect(code).not.toContain('src/audio/jingle.ts');
		expect(code).not.toContain('src/player/index.ts');
		expect(code).not.toContain('src/app.tsx');
	});
});
