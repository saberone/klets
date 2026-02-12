import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Pagination } from '../../src/components/pagination.js';

describe('Pagination', () => {
	it('shows page info', () => {
		const { lastFrame } = render(
			<Pagination
				meta={{
					page: 1,
					limit: 15,
					total: 120,
					totalPages: 8,
					hasMore: true,
				}}
			/>,
		);
		expect(lastFrame()).toContain('Pagina 1/8');
		expect(lastFrame()).toContain('120 afleveringen');
	});

	it('shows next hint when hasMore', () => {
		const { lastFrame } = render(
			<Pagination
				meta={{
					page: 1,
					limit: 15,
					total: 30,
					totalPages: 2,
					hasMore: true,
				}}
			/>,
		);
		expect(lastFrame()).toContain('volgende');
	});

	it('shows prev hint when page > 1', () => {
		const { lastFrame } = render(
			<Pagination
				meta={{
					page: 2,
					limit: 15,
					total: 30,
					totalPages: 2,
					hasMore: false,
				}}
			/>,
		);
		expect(lastFrame()).toContain('vorige');
	});

	it('shows no nav hints on single page', () => {
		const { lastFrame } = render(
			<Pagination
				meta={{
					page: 1,
					limit: 15,
					total: 10,
					totalPages: 1,
					hasMore: false,
				}}
			/>,
		);
		expect(lastFrame()).not.toContain('volgende');
		expect(lastFrame()).not.toContain('vorige');
	});
});
