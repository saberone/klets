/**
 * Parses a link and returns its normalised href when it is a web link
 * (http: or https:), otherwise null.
 */
export function toWebUrl(raw: unknown): string | null {
	if (typeof raw !== 'string' || raw.trim() === '') return null;
	let url: URL;
	try {
		url = new URL(raw.trim());
	} catch {
		return null;
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
	return url.href;
}
