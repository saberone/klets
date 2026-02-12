import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { HomeScreen } from '../../src/screens/home.js';
import { useStore } from '../../src/store/index.js';
import { resetStore, delay, INK_INIT_DELAY } from '../helpers/test-utils.js';

describe('HomeScreen', () => {
	beforeEach(() => {
		resetStore();
	});

	it('renders menu items', async () => {
		const { lastFrame } = render(<HomeScreen />);
		await delay(INK_INIT_DELAY);
		const frame = lastFrame()!;
		expect(frame).toContain('Afleveringen');
		expect(frame).toContain('Onderwerpen');
		expect(frame).toContain('Personen');
		expect(frame).toContain('Zoeken');
	});

	it('navigates on enter', async () => {
		const { stdin } = render(<HomeScreen />);
		await delay(INK_INIT_DELAY);
		stdin.write('\r');
		await delay(50);
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(2);
		expect(stack[1]!.screen).toBe('episodes-list');
	});

	it('j moves selection down', async () => {
		const { stdin } = render(<HomeScreen />);
		await delay(INK_INIT_DELAY);
		stdin.write('j');
		await delay(50);
		stdin.write('\r');
		await delay(50);
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(2);
		expect(stack[1]!.screen).toBe('topics-list');
	});
});
