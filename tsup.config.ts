import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/cli.tsx'],
	format: 'esm',
	target: 'node18',
	outDir: 'dist',
	clean: true,
	splitting: false,
	sourcemap: true,
	dts: false,
	external: [
		'@klets/audio-darwin-arm64',
		'@klets/audio-darwin-x64',
		'@klets/audio-linux-x64-gnu',
		'@klets/audio-linux-arm64-gnu',
		'@klets/audio-win32-x64',
		'@klets/audio-win32-arm64',
		'mpg123-decoder',
	],
	banner: {
		js: '#!/usr/bin/env node',
	},
});
