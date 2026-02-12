import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ErrorDisplay } from '../../src/components/error-display.js';

describe('ErrorDisplay', () => {
	it('shows error message', () => {
		const { lastFrame } = render(<ErrorDisplay message="Netwerk fout" />);
		expect(lastFrame()).toContain('Netwerk fout');
	});

	it('shows retry hint when onRetry is provided', () => {
		const { lastFrame } = render(
			<ErrorDisplay message="Fout" onRetry={() => {}} />,
		);
		expect(lastFrame()).toContain('opnieuw te proberen');
	});

	it('does not show retry hint without onRetry', () => {
		const { lastFrame } = render(<ErrorDisplay message="Fout" />);
		expect(lastFrame()).not.toContain('opnieuw te proberen');
	});
});
