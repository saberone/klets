import { api } from './client.js';
import type { SearchData, SingleResponse } from './types.js';

export async function search(
	query: string,
	type: 'episodes' | 'transcripts' | 'all' = 'all',
): Promise<SingleResponse<SearchData>> {
	return api
		.get('search', { searchParams: { q: query, type } })
		.json<SingleResponse<SearchData>>();
}
