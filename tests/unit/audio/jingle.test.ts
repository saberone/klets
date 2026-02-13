import { describe, it, expect } from 'vitest';
import { createWav, generateJingle } from '../../../src/audio/jingle.js';

describe('createWav', () => {
	it('produces a valid WAV header', () => {
		const samples = new Int16Array([0, 1000, -1000, 0]);
		const wav = createWav(samples, 11025);

		// RIFF header
		expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
		expect(wav.toString('ascii', 8, 12)).toBe('WAVE');

		// fmt chunk
		expect(wav.toString('ascii', 12, 16)).toBe('fmt ');
		expect(wav.readUInt16LE(20)).toBe(1); // PCM format
		expect(wav.readUInt16LE(22)).toBe(1); // mono
		expect(wav.readUInt32LE(24)).toBe(11025); // sample rate
		expect(wav.readUInt16LE(34)).toBe(16); // bits per sample

		// data chunk
		expect(wav.toString('ascii', 36, 40)).toBe('data');
		expect(wav.readUInt32LE(40)).toBe(samples.length * 2);

		// Total size: 44 header + 8 bytes of data
		expect(wav.length).toBe(44 + samples.length * 2);

		// RIFF size = file size - 8
		expect(wav.readUInt32LE(4)).toBe(wav.length - 8);
	});

	it('embeds sample data correctly', () => {
		const samples = new Int16Array([100, -200, 32767, -32768]);
		const wav = createWav(samples, 11025);

		expect(wav.readInt16LE(44)).toBe(100);
		expect(wav.readInt16LE(46)).toBe(-200);
		expect(wav.readInt16LE(48)).toBe(32767);
		expect(wav.readInt16LE(50)).toBe(-32768);
	});
});

describe('generateJingle', () => {
	it('produces a valid WAV buffer', () => {
		const wav = generateJingle();

		expect(wav).toBeInstanceOf(Buffer);
		expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
		expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
		expect(wav.length).toBeGreaterThan(44);
	});

	it('has approximately 1 second duration', () => {
		const wav = generateJingle();
		const dataSize = wav.readUInt32LE(40);
		const numSamples = dataSize / 2; // 16-bit mono
		const durationMs = (numSamples / 11025) * 1000;

		// ~1000ms, allow some tolerance
		expect(durationMs).toBeGreaterThan(900);
		expect(durationMs).toBeLessThan(1100);
	});
});
