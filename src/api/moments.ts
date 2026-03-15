import { api } from './client.js';
import type { Moment, PaginatedResponse } from './types.js';

export async function getMoments(
	options: { page?: number; limit?: number; tag?: string } = {},
): Promise<PaginatedResponse<Moment>> {
	const searchParams: Record<string, string | number> = {};
	if (options.page) searchParams['page'] = options.page;
	if (options.limit) searchParams['limit'] = options.limit;
	if (options.tag) searchParams['tag'] = options.tag;

	return api
		.get('moments', { searchParams })
		.json<PaginatedResponse<Moment>>();
}
