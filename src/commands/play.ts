import { getEpisode } from '../api/episodes.js';
import type { EpisodeDetail } from '../api/types.js';
import { CommandError, describeError } from './errors.js';
import type { Io } from './output.js';
import { resolveSlug } from './resolve-episode.js';

/**
 * Validates `klets play <slug|latest>` before the TUI starts.
 * Returns the episode to play, or null after printing a Dutch error.
 */
export async function preparePlay(
	target: string,
	io: Io,
): Promise<EpisodeDetail | null> {
	try {
		const slug = await resolveSlug(target);
		const episode = (await getEpisode(slug)).data;
		if (!episode) {
			io.err(`Aflevering niet gevonden: "${target}".`);
			return null;
		}
		if (!episode.audioUrl) {
			io.err(
				`"${episode.title}" heeft (nog) geen audio en kan niet worden afgespeeld.`,
			);
			return null;
		}
		return episode;
	} catch (err) {
		io.err(
			err instanceof CommandError
				? err.message
				: describeError(err, `Aflevering niet gevonden: "${target}".`),
		);
		return null;
	}
}
