import got from 'got';

const RSS_URL = 'https://codeklets.nl/feed/xml';

let audioMap: Map<string, string> | null = null;

export async function getAudioUrl(
	slug: string,
): Promise<string | null> {
	if (!audioMap) {
		audioMap = await fetchAudioMap();
	}
	return audioMap.get(slug) ?? null;
}

async function fetchAudioMap(): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	try {
		const xml = await got(RSS_URL).text();
		// Simple regex parsing — no XML library needed
		const itemRegex = /<item>([\s\S]*?)<\/item>/g;
		let match;
		while ((match = itemRegex.exec(xml)) !== null) {
			const block = match[1]!;
			const linkMatch = block.match(
				/<link>https?:\/\/[^/]+\/episodes\/([^<]+)<\/link>/,
			);
			const enclosureMatch = block.match(
				/<enclosure[^>]+url="([^"]+)"/,
			);
			if (linkMatch && enclosureMatch) {
				map.set(linkMatch[1]!, enclosureMatch[1]!);
			}
		}
	} catch {
		// Silently fail — audio just won't be available
	}
	return map;
}
