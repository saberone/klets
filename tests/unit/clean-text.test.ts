import { describe, it, expect } from 'vitest';
import {
	cleanText,
	cleanTextReviver,
	parseCleanJson,
} from '../../src/utils/clean-text.js';

const ESC = '\u001b';
const BEL = '\u0007';

describe('cleanText', () => {
	it('leaves ordinary text, tabs, newlines and accents alone', () => {
		const text = 'Café\tmet\nnieuwe regel — “quotes” 🎙️';
		expect(cleanText(text)).toBe(text);
	});

	it('removes ESC, BEL and CR', () => {
		expect(cleanText(`a${ESC}[31mrood${ESC}[0m${BEL}b\r`)).toBe('a[31mrood[0mb');
	});

	it('removes every C0 control except tab and newline', () => {
		for (let code = 0; code <= 0x1f; code++) {
			const ch = String.fromCharCode(code);
			const expected = code === 0x09 || code === 0x0a ? ch : '';
			expect(cleanText(`x${ch}y`)).toBe(`x${expected}y`);
		}
	});

	it('removes DEL and the C1 range U+0080 to U+009F', () => {
		for (let code = 0x7f; code <= 0x9f; code++) {
			expect(cleanText(`x${String.fromCharCode(code)}y`)).toBe('xy');
		}
		// Just outside the range is kept
		expect(cleanText('\u00a0\u00e9')).toBe('\u00a0\u00e9');
	});

	it('reduces an OSC 52 clipboard sequence to plain text', () => {
		const osc52 = `${ESC}]52;c;aGFsbG8=${BEL}`;
		expect(cleanText(`Titel${osc52}`)).toBe('Titel]52;c;aGFsbG8=');
	});
});

describe('parseCleanJson / cleanTextReviver', () => {
	it('cleans strings at every depth, including arrays and object keys', () => {
		const json = JSON.stringify({
			data: {
				title: `a${ESC}b`,
				list: ['c\u009bd', 1, null, true],
				nested: { [`k${ESC}ey`]: `v${BEL}` },
			},
		});
		expect(parseCleanJson(json)).toEqual({
			data: {
				title: 'ab',
				list: ['cd', 1, null, true],
				nested: { key: 'v' },
			},
		});
	});

	it('gives a fixed message for a body that is not JSON', () => {
		expect(() => parseCleanJson(`${ESC}]52;c;aGFsbG8=${BEL}{`)).toThrow(
			/^Ongeldig JSON-antwoord van de server$/,
		);
	});

	it('returns the same object when no key changes', () => {
		const obj = { a: 1 };
		expect(cleanTextReviver('', obj)).toBe(obj);
	});
});
