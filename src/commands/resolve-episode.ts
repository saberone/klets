import { getEpisodes } from '../api/episodes.js';
import { CommandError, describeError } from './errors.js';

/** Turns "latest" into the newest episode's slug; other values are returned as-is. */
export async function resolveSlug(target: string): Promise<string> {
	if (target !== 'latest') return target;
	let res;
	try {
		res = await getEpisodes({ limit: 1, sort: 'newest' });
	} catch (err) {
		throw new CommandError(describeError(err));
	}
	const slug = res.data?.[0]?.slug;
	if (!slug) throw new CommandError('Geen afleveringen gevonden.');
	return slug;
}
