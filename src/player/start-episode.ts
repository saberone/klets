import { getEpisode } from '../api/episodes.js';
import type { EpisodeDetail } from '../api/types.js';
import { useStore } from '../store/index.js';
import { getResumePosition } from '../store/history.js';
import { play } from './index.js';
import { toWebUrl } from '../utils/web-url.js';

export type StartEpisodeFailure =
	| 'no-audio'
	| 'invalid-audio'
	| 'not-found'
	| 'error'
	| 'no-player';

export type StartEpisodeResult =
	| { ok: true; episode: EpisodeDetail; startAt: number }
	| { ok: false; reason: StartEpisodeFailure; message: string };

export interface StartEpisodeOptions {
	/**
	 * Seconds to start at. 'resume' uses the saved history position
	 * (or 0 when the episode is finished or barely started). Default 0.
	 */
	startAt?: number | 'resume';
}

export const NO_AUDIO_MESSAGE =
	'Deze aflevering heeft (nog) geen audio en kan niet worden afgespeeld.';

export const INVALID_AUDIO_MESSAGE =
	'Afspelen mislukt: de audiolink van deze aflevering is geen webadres.';

function describeError(err: unknown): {
	reason: StartEpisodeFailure;
	message: string;
} {
	const status = (err as { response?: { statusCode?: number } })?.response
		?.statusCode;
	if (status === 404) {
		return { reason: 'not-found', message: 'Aflevering niet gevonden.' };
	}
	return {
		reason: 'error',
		message: `Aflevering laden mislukt: ${err instanceof Error ? err.message : 'onbekende fout'}`,
	};
}

/**
 * The one place that starts playback of an episode:
 * fetch the episode (unless given), update the player store, load chapters
 * and start audio at the requested position.
 */
export async function startEpisodePlayback(
	source: string | EpisodeDetail,
	options: StartEpisodeOptions = {},
): Promise<StartEpisodeResult> {
	let episode: EpisodeDetail;
	if (typeof source === 'string') {
		try {
			const res = await getEpisode(source);
			if (!res?.data) {
				return {
					ok: false,
					reason: 'not-found',
					message: 'Aflevering niet gevonden.',
				};
			}
			episode = res.data;
		} catch (err) {
			return { ok: false, ...describeError(err) };
		}
	} else {
		episode = source;
	}

	if (!episode.audioUrl) {
		return { ok: false, reason: 'no-audio', message: NO_AUDIO_MESSAGE };
	}
	const audioUrl = toWebUrl(episode.audioUrl);
	if (!audioUrl) {
		return {
			ok: false,
			reason: 'invalid-audio',
			message: INVALID_AUDIO_MESSAGE,
		};
	}

	const store = useStore.getState();
	const requested = options.startAt ?? 0;
	const startAt =
		requested === 'resume'
			? getResumePosition(store.getHistoryEntry(episode.slug))
			: Math.max(0, requested);

	store.setPlaying(episode.slug, episode.title, episode.durationSeconds ?? 0);
	store.setChapters(
		(episode.chapters ?? []).map((c) => ({
			title: c.title,
			startTime: c.startTime,
		})),
	);

	const started = await play(audioUrl, startAt);
	if (!started) {
		useStore.getState().stop();
		return {
			ok: false,
			reason: 'no-player',
			message: 'Afspelen mislukt: geen geschikte audiospeler gevonden.',
		};
	}
	return { ok: true, episode, startAt };
}
