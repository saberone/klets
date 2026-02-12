import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Loading } from '../../src/components/loading.js';

describe('Loading', () => {
	it('shows default message', () => {
		const { lastFrame } = render(<Loading />);
		expect(lastFrame()).toContain('Laden...');
	});

	it('shows custom message', () => {
		const { lastFrame } = render(
			<Loading message="Afleveringen laden..." />,
		);
		expect(lastFrame()).toContain('Afleveringen laden...');
	});
});
