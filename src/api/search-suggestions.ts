import { api } from './client.js';
import type { SearchSuggestion, SingleResponse } from './types.js';

export async function getSearchSuggestions(
	limit = 10,
): Promise<SingleResponse<SearchSuggestion[]>> {
	return api
		.get('search-suggestions', { searchParams: { limit } })
		.json<SingleResponse<SearchSuggestion[]>>();
}
