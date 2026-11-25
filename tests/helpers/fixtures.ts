import type { EpisodeDetail, EpisodeListItem } from '../../src/api/types.js';

export function makeListItem(
	over: Partial<EpisodeListItem> = {},
): EpisodeListItem {
	return {
		slug: 'ep-1',
		title: 'Test Episode',
		intro: null,
		seasonNumber: 1,
		episodeNumber: 1,
		episodeType: 'full',
		durationSeconds: 3600,
		publishedAt: '2024-01-01T00:00:00Z',
		artworkUrl: null,
		audioUrl: 'https://media.example/ep-1.mp3',
		tags: [],
		persons: [],
		hasTranscript: false,
		chapterCount: 0,
		...over,
	};
}

export function makeDetail(over: Partial<EpisodeDetail> = {}): EpisodeDetail {
	return {
		slug: 'ep-1',
		title: 'Test Episode',
		intro: 'Intro tekst',
		showNotes: null,
		seasonNumber: 1,
		episodeNumber: 1,
		episodeType: 'full',
		durationSeconds: 3600,
		explicit: false,
		publishedAt: '2024-01-01T00:00:00Z',
		artworkUrl: null,
		audioUrl: 'https://media.example/ep-1.mp3',
		tags: [],
		persons: [],
		chapters: [],
		learningPoints: [],
		links: [],
		platformLinks: [],
		hasTranscript: false,
		...over,
	};
}
