import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { detectBackend } from '../player/detect.js';

const SAMPLE_RATE = 11025;

/**
 * Generate a pulse wave with configurable duty cycle and ADSR envelope.
 * Duty cycle 0.25 = classic NES lead, 0.125 = thin/bright, 0.5 = standard square.
 */
function generatePulse(
	freq: number,
	durationMs: number,
	options: {
		duty?: number;
		attackMs?: number;
		decayMs?: number;
		sustain?: number;
		releaseMs?: number;
		amplitude?: number;
		vibratoHz?: number;
		vibratoDepth?: number;
	} = {},
): Int16Array {
	const {
		duty = 0.25,
		attackMs = 5,
		decayMs = 30,
		sustain = 0.6,
		releaseMs = 20,
		amplitude = 10000,
		vibratoHz = 0,
		vibratoDepth = 0,
	} = options;

	const numSamples = Math.floor((SAMPLE_RATE * durationMs) / 1000);
	const samples = new Int16Array(numSamples);
	const attackSamples = Math.floor((SAMPLE_RATE * attackMs) / 1000);
	const decaySamples = Math.floor((SAMPLE_RATE * decayMs) / 1000);
	const releaseSamples = Math.floor((SAMPLE_RATE * releaseMs) / 1000);
	const releaseStart = numSamples - releaseSamples;

	for (let i = 0; i < numSamples; i++) {
		// Vibrato modulation
		const vibrato =
			vibratoHz > 0
				? vibratoDepth * Math.sin((2 * Math.PI * vibratoHz * i) / SAMPLE_RATE)
				: 0;
		const currentFreq = freq + vibrato;
		const period = SAMPLE_RATE / currentFreq;

		// Pulse wave with duty cycle
		const phase = i % period;
		const pulse = phase < period * duty ? 1 : -1;

		// ADSR envelope
		let envelope: number;
		if (i < attackSamples) {
			envelope = i / attackSamples;
		} else if (i < attackSamples + decaySamples) {
			const decayProgress = (i - attackSamples) / decaySamples;
			envelope = 1 - decayProgress * (1 - sustain);
		} else if (i < releaseStart) {
			envelope = sustain;
		} else {
			envelope = sustain * ((numSamples - i) / releaseSamples);
		}

		samples[i] = Math.round(pulse * amplitude * envelope);
	}

	return samples;
}

export function createWav(samples: Int16Array, sampleRate: number): Buffer {
	const dataSize = samples.length * 2;
	const buffer = Buffer.alloc(44 + dataSize);

	// RIFF header
	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + dataSize, 4);
	buffer.write('WAVE', 8);

	// fmt chunk
	buffer.write('fmt ', 12);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20); // PCM
	buffer.writeUInt16LE(1, 22); // mono
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);

	// data chunk
	buffer.write('data', 36);
	buffer.writeUInt32LE(dataSize, 40);

	for (let i = 0; i < samples.length; i++) {
		buffer.writeInt16LE(samples[i]!, 44 + i * 2);
	}

	return buffer;
}

/**
 * Mix multiple sample arrays together (additive), clamped to Int16 range.
 */
function mixSamples(...tracks: Int16Array[]): Int16Array {
	const maxLen = Math.max(...tracks.map((t) => t.length));
	const mixed = new Int16Array(maxLen);
	for (const track of tracks) {
		for (let i = 0; i < track.length; i++) {
			const sum = mixed[i]! + track[i]!;
			mixed[i] = Math.max(-32768, Math.min(32767, sum));
		}
	}
	return mixed;
}

/**
 * Place samples at a byte offset within a larger buffer.
 */
function placeAt(
	target: Int16Array,
	source: Int16Array,
	offsetMs: number,
): void {
	const offsetSamples = Math.floor((SAMPLE_RATE * offsetMs) / 1000);
	for (let i = 0; i < source.length; i++) {
		const idx = offsetSamples + i;
		if (idx < target.length) {
			const sum = target[idx]! + source[i]!;
			target[idx] = Math.max(-32768, Math.min(32767, sum));
		}
	}
}

export function generateJingle(): Buffer {
	// Lead melody — 25% pulse wave (classic NES lead)
	const lead: [number, number, number][] = [
		// [freq, startMs, durationMs]
		[523, 0, 100], // C5
		[659, 110, 100], // E5
		[784, 220, 100], // G5
		[1047, 340, 200], // C6 (held longer)
		[988, 560, 80], // B5 (grace note)
		[1047, 660, 300], // C6 (final, with vibrato)
	];

	// Bass — 50% square wave, lower octave
	const bass: [number, number, number][] = [
		[131, 0, 200], // C3
		[165, 220, 200], // E3
		[196, 440, 200], // G3
		[262, 660, 300], // C4
	];

	const totalMs = 1000;
	const totalSamples = Math.floor((SAMPLE_RATE * totalMs) / 1000);

	const leadTrack = new Int16Array(totalSamples);
	for (const [freq, start, dur] of lead) {
		const isLast = freq === 1047 && start === 660;
		const samples = generatePulse(freq, dur, {
			duty: 0.25,
			attackMs: 3,
			decayMs: 20,
			sustain: 0.5,
			releaseMs: 15,
			amplitude: 8000,
			vibratoHz: isLast ? 6 : 0,
			vibratoDepth: isLast ? 8 : 0,
		});
		placeAt(leadTrack, samples, start);
	}

	const bassTrack = new Int16Array(totalSamples);
	for (const [freq, start, dur] of bass) {
		const samples = generatePulse(freq, dur, {
			duty: 0.5,
			attackMs: 5,
			decayMs: 40,
			sustain: 0.4,
			releaseMs: 30,
			amplitude: 5000,
		});
		placeAt(bassTrack, samples, start);
	}

	const mixed = mixSamples(leadTrack, bassTrack);
	return createWav(mixed, SAMPLE_RATE);
}

export function playJingle(): void {
	try {
		const backend = detectBackend();
		if (!backend) return;

		const wavPath = join(tmpdir(), 'klets-jingle.wav');
		const wav = generateJingle();
		writeFileSync(wavPath, wav);

		let args: string[];
		switch (backend) {
			case 'mpv':
				args = ['--no-terminal', '--really-quiet', wavPath];
				break;
			case 'ffplay':
				args = ['-nodisp', '-autoexit', '-loglevel', 'quiet', wavPath];
				break;
			case 'afplay':
				args = [wavPath];
				break;
		}

		const child = spawn(backend, args, { stdio: 'ignore' });
		child.unref();

		child.on('exit', () => {
			try {
				unlinkSync(wavPath);
			} catch {
				// ignore
			}
		});
	} catch {
		// Fail silently — audio is non-essential
	}
}
