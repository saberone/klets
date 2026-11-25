import { getTranscript } from '../api/episodes.js';
import type { TranscriptFormat } from './args.js';
import {
	apiErrorMessage,
	CommandError,
	describeError,
	httpStatus,
} from './errors.js';
import {
	formatTranscriptText,
	formatTranscriptVtt,
} from './format-transcript.js';
import type { Io } from './output.js';
import { resolveSlug } from './resolve-episode.js';

/** `klets transcript <slug|latest> [--vtt | --json]`. Returns the exit code. */
export async function runTranscript(
	target: string,
	format: TranscriptFormat,
	io: Io,
): Promise<number> {
	let slug: string;
	let data;
	try {
		slug = await resolveSlug(target);
		data = (await getTranscript(slug)).data;
	} catch (err) {
		if (err instanceof CommandError) {
			io.err(err.message);
		} else if (httpStatus(err) === 404) {
			const transcriptMissing = /transcript/i.test(apiErrorMessage(err) ?? '');
			io.err(
				transcriptMissing
					? `Geen transcript beschikbaar voor "${target}".`
					: `Aflevering niet gevonden: "${target}".`,
			);
		} else {
			io.err(`Transcript laden mislukt: ${describeError(err)}`);
		}
		return 1;
	}

	if (format === 'json') {
		io.out(JSON.stringify(data, null, 2));
	} else if (format === 'vtt') {
		io.out(formatTranscriptVtt(data.segments ?? []));
	} else {
		io.out(formatTranscriptText(data.segments ?? []));
	}
	return 0;
}
