import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['tests/**/*.test.{ts,tsx}'],
		setupFiles: ['tests/setup.ts'],
		// Ink screen tests wait for rendered frames; leave room on a loaded machine
		testTimeout: 20_000,
	},
});
