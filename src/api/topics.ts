import { api } from './client.js';
import type {
	PaginatedResponse,
	SingleResponse,
	Topic,
	TopicDetail,
} from './types.js';

export async function getTopics(): Promise<PaginatedResponse<Topic>> {
	return api.get('topics').json<PaginatedResponse<Topic>>();
}

export async function getTopic(
	slug: string,
): Promise<SingleResponse<TopicDetail>> {
	return api.get(`topics/${slug}`).json<SingleResponse<TopicDetail>>();
}
