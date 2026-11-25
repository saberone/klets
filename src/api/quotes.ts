import got from 'got';
import { parseCleanJson } from '../utils/clean-text.js';

const BASE =
	process.env['CODEKLETS_API_URL']?.replace('/api/v1', '') ||
	'https://codeklets.nl';

interface CharacterQuotes {
	name: string;
	quotes: string[];
}

interface QuotesResponse {
	characters: CharacterQuotes[];
	timestamp: string;
	signature: string;
}

export interface Quote {
	text: string;
	attribution: string;
}

export async function getRandomQuote(): Promise<Quote | null> {
	try {
		const data = await got
			.get(`${BASE}/api/easter-egg/quotes`, {
				timeout: { request: 3000 },
				parseJson: parseCleanJson,
			})
			.json<QuotesResponse>();

		const allQuotes: Quote[] = data.characters.flatMap((c) =>
			c.quotes.map((q) => ({ text: q, attribution: c.name })),
		);

		if (allQuotes.length === 0) return null;
		return allQuotes[Math.floor(Math.random() * allQuotes.length)]!;
	} catch {
		return null;
	}
}
