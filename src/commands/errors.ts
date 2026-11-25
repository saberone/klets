const NETWORK_CODES = new Set([
	'ENOTFOUND',
	'EAI_AGAIN',
	'ECONNREFUSED',
	'ECONNRESET',
	'ETIMEDOUT',
	'EHOSTUNREACH',
	'ENETUNREACH',
	'EPIPE',
]);

interface ErrorLike {
	code?: string;
	message?: string;
	name?: string;
	response?: { statusCode?: number; body?: unknown };
}

export function httpStatus(err: unknown): number | undefined {
	return (err as ErrorLike | null)?.response?.statusCode;
}

/** The API's error message ({ error, code }) from a got HTTPError, if any. */
export function apiErrorMessage(err: unknown): string | undefined {
	const body = (err as ErrorLike | null)?.response?.body;
	try {
		const parsed = typeof body === 'string' ? JSON.parse(body) : body;
		const msg = (parsed as { error?: unknown } | null)?.error;
		return typeof msg === 'string' ? msg : undefined;
	} catch {
		return undefined;
	}
}

/** A Dutch, one-line description of an API/network error. */
export function describeError(
	err: unknown,
	notFound = 'Niet gevonden.',
): string {
	const e = err as ErrorLike | null;
	const status = httpStatus(err);
	if (status === 404) return notFound;
	if (status !== undefined) {
		return `De CodeKlets API gaf een fout (HTTP ${status}).`;
	}
	const isNetwork =
		(e?.code !== undefined &&
			(NETWORK_CODES.has(e.code) || e.code.startsWith('ERR_SOCKET'))) ||
		e?.name === 'RequestError' ||
		e?.name === 'TimeoutError' ||
		e?.name === 'ReadError';
	if (isNetwork) {
		return `Kan de CodeKlets API niet bereiken (${e?.code ?? e?.message ?? 'onbekende fout'}). Controleer je internetverbinding.`;
	}
	return `Er ging iets mis: ${e?.message ?? String(err)}`;
}

export class CommandError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CommandError';
	}
}
