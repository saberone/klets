import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/api/client.js', () => ({
	api: { get: vi.fn() },
}));

import { api } from '../../../src/api/client.js';
import { getTopic, flattenTopicDetail } from '../../../src/api/topics.js';

const RAW = {
	data: {
		topic: { name: 'AI', slug: 'ai', episodeCount: 8, summary: 'Over AI' },
		episodes: [{ slug: 'ep-1', title: 'Een' }],
	},
	meta: { page: 1, limit: 20, total: 8, totalPages: 1, hasMore: false },
};

describe('topic detail (nested API shape)', () => {
	it('flattens { topic, episodes } into TopicDetail', () => {
		const result = flattenTopicDetail(RAW as never);
		expect(result.data.name).toBe('AI');
		expect(result.data.episodeCount).toBe(8);
		expect(result.data.summary).toBe('Over AI');
		expect(result.data.episodes).toHaveLength(1);
	});

	it('getTopic requests topics/:slug and flattens the result', async () => {
		const json = vi.fn().mockResolvedValue(RAW);
		vi.mocked(api.get).mockReturnValue({ json } as never);
		const result = await getTopic('ai');
		expect(api.get).toHaveBeenCalledWith('topics/ai');
		expect(result.data.name).toBe('AI');
	});
});
