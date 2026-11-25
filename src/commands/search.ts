import { search } from '../api/search.js';
import { describeError } from './errors.js';
import { formatSearchResults } from './format-search.js';
import type { Io } from './output.js';

/** `klets search <query> [--json]`. Returns the exit code. */
export async function runSearch(
	query: string,
	options: { json: boolean },
	io: Io,
): Promise<number> {
	let data;
	try {
		data = (await search(query)).data;
	} catch (err) {
		io.err(`Zoeken mislukt: ${describeError(err)}`);
		return 1;
	}
	if (options.json) {
		io.out(JSON.stringify(data, null, 2));
	} else {
		io.out(formatSearchResults(query, data, io.color));
	}
	return 0;
}
