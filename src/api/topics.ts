import { api } from './client.js';
import type {
	ListResponse,
	SingleResponse,
	Topic,
	TopicDetail,
	TopicDetailRaw,
} from './types.js';

export async function getTopics(): Promise<ListResponse<Topic>> {
	return api.get('topics').json<ListResponse<Topic>>();
}

// API returns { data: { topic: {...}, episodes: [...] }, meta }
// We flatten it into SingleResponse<TopicDetail>
export function flattenTopicDetail(raw: TopicDetailRaw): SingleResponse<TopicDetail> {
	return {
		data: {
			...raw.data.topic,
			summary: raw.data.topic.summary ?? null,
			episodes: raw.data.episodes ?? [],
		},
	};
}

export async function getTopic(slug: string): Promise<SingleResponse<TopicDetail>> {
	const raw = await api.get(`topics/${encodeURIComponent(slug)}`).json<TopicDetailRaw>();
	return flattenTopicDetail(raw);
}
