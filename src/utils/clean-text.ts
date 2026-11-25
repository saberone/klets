/**
 * Text from the API is shown in the terminal. Terminal control characters in
 * that text are removed so it is always printed as plain text.
 */

function isControl(code: number): boolean {
	// Keep tab (0x09) and newline (0x0a)
	if (code === 0x09 || code === 0x0a) return false;
	// C0 controls, DEL and C1 controls
	return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

/** Removes C0 control characters (except tab and newline), DEL and C1 controls. */
export function cleanText(text: string): string {
	let i = 0;
	while (i < text.length && !isControl(text.charCodeAt(i))) i++;
	if (i === text.length) return text;

	let result = text.slice(0, i);
	for (; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if (!isControl(code)) result += text[i];
	}
	return result;
}

/**
 * JSON.parse reviver that cleans every string value and every object key.
 * Objects are only rebuilt when a key changes.
 */
export function cleanTextReviver(_key: string, value: unknown): unknown {
	if (typeof value === 'string') return cleanText(value);
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		const entries = Object.entries(value as Record<string, unknown>);
		if (entries.some(([k]) => cleanText(k) !== k)) {
			return Object.fromEntries(entries.map(([k, v]) => [cleanText(k), v]));
		}
	}
	return value;
}

/**
 * JSON.parse with every string cleaned (used as got's parseJson). A body that
 * is not JSON gives a fixed message instead of one that quotes the body.
 */
export function parseCleanJson(text: string): unknown {
	try {
		return JSON.parse(text, cleanTextReviver);
	} catch {
		throw new SyntaxError('Ongeldig JSON-antwoord van de server');
	}
}
