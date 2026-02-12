import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

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
