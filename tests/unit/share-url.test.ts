import { describe, it, expect } from 'vitest';
import { buildEpisodeUrl, buildSegmentUrl } from '../../src/utils/share-url.js';

describe('buildEpisodeUrl', () => {
	it('links to the episode page without t', () => {
		expect(buildEpisodeUrl('mijn-aflevering')).toBe(
			'https://codeklets.nl/afleveringen/mijn-aflevering',
		);
		expect(buildEpisodeUrl('mijn-aflevering', null)).toBe(
			'https://codeklets.nl/afleveringen/mijn-aflevering',
		);
	});

	it('adds t as whole seconds, floored', () => {
		expect(buildEpisodeUrl('ep', 754)).toBe(
			'https://codeklets.nl/afleveringen/ep?t=754',
		);
		expect(buildEpisodeUrl('ep', 754.99)).toBe(
			'https://codeklets.nl/afleveringen/ep?t=754',
		);
	});

	it('omits t when it would be 0, negative or invalid', () => {
		expect(buildEpisodeUrl('ep', 0)).toBe(
			'https://codeklets.nl/afleveringen/ep',
		);
		expect(buildEpisodeUrl('ep', 0.9)).toBe(
			'https://codeklets.nl/afleveringen/ep',
		);
		expect(buildEpisodeUrl('ep', -5)).toBe(
			'https://codeklets.nl/afleveringen/ep',
		);
		expect(buildEpisodeUrl('ep', Number.NaN)).toBe(
			'https://codeklets.nl/afleveringen/ep',
		);
	});

	it('encodes the slug', () => {
		expect(buildEpisodeUrl('a b')).toBe(
			'https://codeklets.nl/afleveringen/a%20b',
		);
	});
});

describe('buildSegmentUrl', () => {
	it('converts milliseconds to floored seconds', () => {
		expect(buildSegmentUrl('ep', 13_996)).toBe(
			'https://codeklets.nl/afleveringen/ep?t=13',
		);
		expect(buildSegmentUrl('ep', 999)).toBe(
			'https://codeklets.nl/afleveringen/ep',
		);
	});
});
