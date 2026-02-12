import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { EmptyState } from '../../src/components/empty-state.js';

describe('EmptyState', () => {
	it('renders the message', () => {
		const { lastFrame } = render(
			<EmptyState message="Geen onderwerpen gevonden." />,
		);
		expect(lastFrame()).toContain('Geen onderwerpen gevonden.');
	});
});
