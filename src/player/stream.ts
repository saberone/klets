import got from 'got';
import { decode, type PcmResult } from './decode.js';

const AVG_MP3_BITRATE = 128_000; // 128 kbps fallback

export interface AudioStreamInfo {
	estimatedDuration: number;
	totalBytes: number;
}

export interface StreamOptions {
	byteOffset?: number;
	signal?: AbortSignal;
}

/**
 * Stream an MP3 URL, decode chunks to PCM, and yield them.
 * Provides estimated duration from Content-Length.
 * Supports byte-range seeking via `byteOffset`.
 */
export async function* createAudioStream(
	url: string,
	info: AudioStreamInfo = { estimatedDuration: 0, totalBytes: 0 },
	options: StreamOptions = {},
): AsyncGenerator<PcmResult> {
	const headers: Record<string, string> = {};
	if (options.byteOffset && options.byteOffset > 0) {
		headers['Range'] = `bytes=${options.byteOffset}-`;
	}

	const stream = got.stream(url, {
		headers,
		...(options.signal ? { signal: options.signal } : {}),
	});

	try {
		await new Promise<void>((resolve, reject) => {
			stream.once('response', (response) => {
				if (!options.byteOffset) {
					// Only read total size from the initial (non-ranged) request
					const contentLength = Number(
						response.headers['content-length'],
					);
					if (contentLength > 0) {
						info.totalBytes = contentLength;
						if (info.estimatedDuration === 0) {
							info.estimatedDuration = Math.floor(
								contentLength / (AVG_MP3_BITRATE / 8),
							);
						}
					}
				}
				resolve();
			});
			stream.once('error', reject);
		});

		for await (const chunk of stream) {
			const mp3Data =
				chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
			const pcm = await decode(mp3Data);
			if (pcm.samplesDecoded > 0) {
				yield pcm;
			}
		}
	} catch {
		// Aborted or network error — generator ends cleanly
	}
}

/**
 * Estimate byte offset for a given time in seconds.
 */
export function timeToByteOffset(
	seconds: number,
	totalBytes: number,
	totalDuration: number,
): number {
	if (totalDuration <= 0 || totalBytes <= 0) {
		// Fallback: assume constant bitrate
		return Math.floor(seconds * (AVG_MP3_BITRATE / 8));
	}
	return Math.floor((seconds / totalDuration) * totalBytes);
}
