import { afterEach } from 'vitest';
import { cleanup } from 'ink-testing-library';

// Unmount every Ink instance after each test so renders, timers and store
// subscriptions from one test cannot leak into (or slow down) the next.
afterEach(() => {
	cleanup();
});
