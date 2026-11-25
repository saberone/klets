import type { TranscriptSegment } from '../api/types.js';
import { formatMsLong } from '../theme/format.js';

/** Plain text: one line per segment, "[h:mm:ss] Speaker: text". */
export function formatTranscriptText(segments: TranscriptSegment[]): string {
	return segments
		.map((seg) => {
			const text = seg.text.replace(/\s*\n\s*/g, ' ').trim();
			const speaker = seg.speaker?.trim();
			return `[${formatMsLong(seg.startTimeMs)}] ${speaker ? `${speaker}: ` : ''}${text}`;
		})
		.join('\n');
}

/** WebVTT timestamp: HH:MM:SS.mmm */
export function vttTimestamp(ms: number): string {
	const total = Math.max(0, Math.round(ms));
	const h = Math.floor(total / 3_600_000);
	const m = Math.floor((total % 3_600_000) / 60_000);
	const s = Math.floor((total % 60_000) / 1000);
	const milli = total % 1000;
	const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
	return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
}

/** Escapes cue text so it cannot contain tags, entities or the "-->" arrow. */
export function escapeVttText(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\s*\r?\n\s*/g, ' ')
		.trim();
}

/** Valid WebVTT with the speaker as a voice span (<v Name>). */
export function formatTranscriptVtt(segments: TranscriptSegment[]): string {
	const cues = segments.map((seg) => {
		const start = Math.max(0, seg.startTimeMs);
		// End must be after start for a valid cue
		const end = seg.endTimeMs > start ? seg.endTimeMs : start + 1;
		const text = escapeVttText(seg.text);
		const speaker = seg.speaker ? escapeVttText(seg.speaker) : '';
		const payload = speaker ? `<v ${speaker}>${text}` : text;
		return `${vttTimestamp(start)} --> ${vttTimestamp(end)}\n${payload}`;
	});
	return ['WEBVTT', ...cues].join('\n\n') + '\n';
}
