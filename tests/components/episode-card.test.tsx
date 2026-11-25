import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { EpisodeCard } from '../../src/components/episode-card.js';
import { resetStore } from '../helpers/test-utils.js';
import { makeListItem } from '../helpers/fixtures.js';

describe('EpisodeCard', () => {
	beforeEach(() => resetStore());

	it('shows SxxEyy for a full episode', () => {
		const { lastFrame } = render(
			<EpisodeCard
				episode={makeListItem({ seasonNumber: 4, episodeNumber: 5 })}
				isSelected
			/>,
		);
		expect(lastFrame()).toContain('S04E05');
		expect(lastFrame()).not.toContain('TRAILER');
	});

	it('shows a TRAILER badge and no S00E00 for a trailer without numbers', () => {
		const { lastFrame } = render(
			<EpisodeCard
				episode={makeListItem({
					episodeType: 'trailer',
					seasonNumber: null,
					episodeNumber: null,
					title: 'De trailer',
				})}
				isSelected={false}
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('TRAILER');
		expect(frame).toContain('De trailer');
		expect(frame).not.toMatch(/S\d\dE\d\d/);
		expect(frame).not.toContain('null');
	});

	it('shows a BONUS badge next to the episode number', () => {
		const { lastFrame } = render(
			<EpisodeCard
				episode={makeListItem({
					episodeType: 'bonus',
					seasonNumber: 2,
					episodeNumber: 3,
				})}
				isSelected
			/>,
		);
		expect(lastFrame()).toContain('S02E03 BONUS');
	});

	it('renders without crashing when duration, date and audio are null', () => {
		const { lastFrame } = render(
			<EpisodeCard
				episode={makeListItem({
					durationSeconds: null,
					publishedAt: null,
					audioUrl: null,
					seasonNumber: null,
					episodeNumber: null,
				})}
				isSelected
			/>,
		);
		const frame = lastFrame()!;
		expect(frame).toContain('Test Episode');
		expect(frame).not.toContain('NaN');
		expect(frame).not.toContain('Invalid');
	});
});
