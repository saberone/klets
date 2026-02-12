import { api } from './client.js';
import type { Season } from './types.js';

export async function getSeasons(): Promise<{ data: Season[] }> {
	return api.get('seasons').json<{ data: Season[] }>();
}
