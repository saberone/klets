import { MPEGDecoder } from 'mpg123-decoder';

export interface PcmResult {
	buffer: Buffer;
	samplesDecoded: number;
	sampleRate: number;
	channels: number;
}

let decoder: InstanceType<typeof MPEGDecoder> | null = null;

export async function ensureDecoder(): Promise<void> {
	if (decoder) return;
	decoder = new MPEGDecoder();
	await decoder.ready;
}

/**
 * Decode an MP3 chunk into interleaved Int16LE PCM.
 */
export async function decode(mp3Chunk: Uint8Array): Promise<PcmResult> {
	await ensureDecoder();
	const { channelData, samplesDecoded, sampleRate } = decoder!.decode(
		mp3Chunk,
	);

	const channels = channelData.length;

	// Interleave Float32 channel data → Int16LE buffer
	const buffer = Buffer.alloc(samplesDecoded * channels * 2);
	for (let i = 0; i < samplesDecoded; i++) {
		for (let ch = 0; ch < channels; ch++) {
			const sample = Math.max(-1, Math.min(1, channelData[ch]![i]!));
			const int16 = sample < 0 ? sample * 32768 : sample * 32767;
			buffer.writeInt16LE(Math.round(int16), (i * channels + ch) * 2);
		}
	}

	return { buffer, samplesDecoded, sampleRate, channels };
}

export async function resetDecoder(): Promise<void> {
	if (decoder) {
		await decoder.reset();
	}
}

export function freeDecoder(): void {
	if (decoder) {
		decoder.free();
		decoder = null;
	}
}
