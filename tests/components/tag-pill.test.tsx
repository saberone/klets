import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { TagPill } from '../../src/components/tag-pill.js';

describe('TagPill', () => {
	it('renders tag name in brackets', () => {
		const { lastFrame } = render(<TagPill name="React" />);
		expect(lastFrame()).toContain('[React]');
	});
});
