import got from 'got';

const BASE_URL =
	process.env['CODEKLETS_API_URL'] || 'https://preview.codeklets.nl/api/v1';

export const api = got.extend({
	prefixUrl: BASE_URL,
	timeout: { request: 10_000 },
	retry: { limit: 2 },
	headers: {
		'user-agent': 'klets-cli/0.1.0',
	},
});
