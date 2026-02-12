import { api } from './client.js';
import type {
	EpisodeDetail,
	EpisodeListItem,
	EpisodesQuery,
	PaginatedResponse,
	SingleResponse,
	TranscriptData,
} from './types.js';

export async function getEpisodes(
	query: EpisodesQuery = {},
): Promise<PaginatedResponse<EpisodeListItem>> {
	const searchParams: Record<string, string | number> = {};
	if (query.page) searchParams['page'] = query.page;
	if (query.limit) searchParams['limit'] = query.limit;
	if (query.season) searchParams['season'] = query.season;
	if (query.search) searchParams['search'] = query.search;
	if (query.tag) searchParams['tag'] = query.tag;
	if (query.sort) searchParams['sort'] = query.sort;

	return api
		.get('episodes', { searchParams })
		.json<PaginatedResponse<EpisodeListItem>>();
}

export async function getEpisode(
	slug: string,
): Promise<SingleResponse<EpisodeDetail>> {
	return api.get(`episodes/${slug}`).json<SingleResponse<EpisodeDetail>>();
}

export async function getTranscript(
	slug: string,
): Promise<SingleResponse<TranscriptData>> {
	return api
		.get(`episodes/${slug}/transcript`)
		.json<SingleResponse<TranscriptData>>();
}
