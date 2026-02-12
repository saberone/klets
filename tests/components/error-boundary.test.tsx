import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ErrorBoundary } from '../../src/components/error-boundary.js';

function ThrowingChild(): React.ReactElement {
	throw new Error('Test crash');
}

describe('ErrorBoundary', () => {
	beforeEach(() => {
		// Suppress stderr output from componentDidCatch
		vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
	});

	it('renders children normally', () => {
		const { lastFrame } = render(
			<ErrorBoundary>
				<Text>Hello</Text>
			</ErrorBoundary>,
		);
		expect(lastFrame()).toContain('Hello');
	});

	it('catches errors and shows fallback', () => {
		const { lastFrame } = render(
			<ErrorBoundary>
				<ThrowingChild />
			</ErrorBoundary>,
		);
		expect(lastFrame()).toContain('Er is iets misgegaan');
		expect(lastFrame()).toContain('Test crash');
		expect(lastFrame()).toContain('esc');
	});
});
