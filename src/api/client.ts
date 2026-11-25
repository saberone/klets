import got from 'got';
import { VERSION } from '../version.js';
import { cleanText, parseCleanJson } from '../utils/clean-text.js';

const BASE_URL =
	process.env['CODEKLETS_API_URL'] || 'https://codeklets.nl/api/v1';

export const api = got.extend({
	prefixUrl: BASE_URL,
	timeout: { request: 10_000 },
	retry: { limit: 2 },
	headers: {
		'user-agent': `klets-cli/${VERSION}`,
	},
	// Removes control characters from all API text
	parseJson: parseCleanJson,
	hooks: {
		// Error messages can quote response text (status text, body)
		beforeError: [
			(error) => {
				error.message = cleanText(error.message);
				return error;
			},
		],
	},
});
