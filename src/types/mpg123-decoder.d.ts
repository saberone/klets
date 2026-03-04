declare module 'mpg123-decoder' {
	interface MPEGDecodedAudio {
		channelData: Float32Array[];
		samplesDecoded: number;
		sampleRate: number;
		errors: { message: string }[];
	}

	interface MPEGDecoderOptions {
		enableGapless?: boolean;
	}

	export class MPEGDecoder {
		constructor(options?: MPEGDecoderOptions);
		readonly ready: Promise<void>;
		decode(data: Uint8Array): MPEGDecodedAudio;
		decodeFrame(data: Uint8Array): MPEGDecodedAudio;
		decodeFrames(data: Uint8Array[]): MPEGDecodedAudio;
		reset(): Promise<void>;
		free(): void;
	}

	export class MPEGDecoderWebWorker {
		constructor(options?: MPEGDecoderOptions);
		readonly ready: Promise<void>;
		decode(data: Uint8Array): Promise<MPEGDecodedAudio>;
		decodeFrame(data: Uint8Array): Promise<MPEGDecodedAudio>;
		decodeFrames(data: Uint8Array[]): Promise<MPEGDecodedAudio>;
		reset(): Promise<void>;
		free(): Promise<void>;
	}
}
