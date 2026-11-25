import { describe, it, expect } from 'vitest';
import {
	formatTranscriptText,
	formatTranscriptVtt,
	vttTimestamp,
	escapeVttText,
} from '../../../src/commands/format-transcript.js';
import type { TranscriptSegment } from '../../../src/api/types.js';

const seg = (over: Partial<TranscriptSegment>): TranscriptSegment => ({
	segmentIndex: 0,
	startTimeMs: 0,
	endTimeMs: 1000,
	text: 'Hallo',
	speaker: 'Saber Karmous',
	...over,
});

describe('formatTranscriptText', () => {
	it('prints one line per segment as [h:mm:ss] Speaker: text', () => {
		const out = formatTranscriptText([
			seg({ startTimeMs: 13_996, text: 'Welkom' }),
			seg({ startTimeMs: 3_723_000, text: 'Na een uur', speaker: 'Kishen' }),
		]);
		expect(out).toBe(
			'[0:00:13] Saber Karmous: Welkom\n[1:02:03] Kishen: Na een uur',
		);
	});

	it('omits the speaker when unknown and flattens newlines', () => {
		expect(
			formatTranscriptText([
				seg({ speaker: null, text: 'regel een\nregel twee' }),
			]),
		).toBe('[0:00:00] regel een regel twee');
	});
});

describe('vttTimestamp', () => {
	it('formats HH:MM:SS.mmm', () => {
		expect(vttTimestamp(0)).toBe('00:00:00.000');
		expect(vttTimestamp(13_996)).toBe('00:00:13.996');
		expect(vttTimestamp(3_723_004)).toBe('01:02:03.004');
	});
});

describe('formatTranscriptVtt', () => {
	it('produces a valid WebVTT document with voice spans', () => {
		const out = formatTranscriptVtt([
			seg({
				startTimeMs: 13_996,
				endTimeMs: 18_094,
				text: 'Hey, hallo allemaal.',
				speaker: 'Kishen',
			}),
			seg({
				startTimeMs: 18_437,
				endTimeMs: 22_285,
				text: 'Zonder spreker',
				speaker: null,
			}),
		]);
		expect(out).toBe(
			'WEBVTT\n\n' +
				'00:00:13.996 --> 00:00:18.094\n<v Kishen>Hey, hallo allemaal.\n\n' +
				'00:00:18.437 --> 00:00:22.285\nZonder spreker\n',
		);
	});

	it('every cue has HH:MM:SS.mmm timings with end after start', () => {
		const out = formatTranscriptVtt([
			seg({ startTimeMs: 5000, endTimeMs: 5000 }),
		]);
		const timing = out.split('\n\n')[1]!.split('\n')[0]!;
		expect(timing).toMatch(
			/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}$/,
		);
		expect(timing).toBe('00:00:05.000 --> 00:00:05.001');
	});

	it('escapes text and speaker so no tag, entity, arrow or blank line can break a cue', () => {
		const out = formatTranscriptVtt([
			seg({ text: 'a <b> & c --> d\n\ne', speaker: 'R&D <team>' }),
		]);
		const cue = out.split('\n\n')[1]!.trimEnd();
		expect(cue).toBe(
			'00:00:00.000 --> 00:00:01.000\n<v R&amp;D &lt;team&gt;>a &lt;b&gt; &amp; c --&gt; d e',
		);
		expect(cue.split('\n')[1]).not.toContain('-->');
	});

	it('escapeVttText handles plain text unchanged', () => {
		expect(escapeVttText('gewoon tekst')).toBe('gewoon tekst');
	});

	it('an empty transcript is still a valid WebVTT header', () => {
		expect(formatTranscriptVtt([])).toBe('WEBVTT\n');
	});
});
