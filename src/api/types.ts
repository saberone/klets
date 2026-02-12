// ── Pagination ──────────────────────────────────────────────
export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasMore: boolean;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface SingleResponse<T> {
	data: T;
}

export interface ApiError {
	error: string;
	code: string;
}

// ── Tag ─────────────────────────────────────────────────────
export interface Tag {
	name: string;
	slug: string;
}

// ── Person (list) ───────────────────────────────────────────
export interface SocialLinks {
	website: string | null;
	linkedin: string | null;
	bluesky: string | null;
	github: string | null;
}

export interface PersonSummary {
	id: number;
	name: string;
	role: string;
}

export interface PersonListItem {
	id: number;
	name: string;
	jobTitle: string | null;
	tagline: string | null;
	imageUrl: string | null;
	socialLinks: SocialLinks;
	episodeCount: number;
}

export interface PersonDetail extends PersonListItem {
	episodes: EpisodeListItem[];
}

// ── Episode (list) ──────────────────────────────────────────
export interface EpisodeListItem {
	slug: string;
	title: string;
	intro: string | null;
	seasonNumber: number;
	episodeNumber: number;
	durationSeconds: number;
	publishedAt: string;
	artworkUrl: string | null;
	tags: Tag[];
	persons: PersonSummary[];
	hasTranscript: boolean;
	chapterCount: number;
}

// ── Episode (detail) ────────────────────────────────────────
export interface Chapter {
	title: string;
	startTime: number;
	resourceUrl: string | null;
}

export interface LearningPoint {
	content: string;
	order: number;
}

export interface EpisodeLink {
	title: string;
	url: string;
	personId: number | null;
}

export interface EpisodePersonDetail {
	id: number;
	name: string;
	role: string;
	jobTitle: string | null;
	socialLinks: SocialLinks;
}

export interface EpisodeDetail {
	slug: string;
	title: string;
	intro: string | null;
	showNotes: string | null;
	seasonNumber: number;
	episodeNumber: number;
	durationSeconds: number;
	explicit: boolean;
	publishedAt: string;
	artworkUrl: string | null;
	tags: Tag[];
	persons: EpisodePersonDetail[];
	chapters: Chapter[];
	learningPoints: LearningPoint[];
	links: EpisodeLink[];
	hasTranscript: boolean;
}

// ── Transcript ──────────────────────────────────────────────
export interface TranscriptSegment {
	segmentIndex: number;
	startTimeMs: number;
	endTimeMs: number;
	text: string;
	speaker: string | null;
	confidence: number | null;
}

export interface TranscriptData {
	episodeSlug: string;
	episodeTitle: string;
	segmentCount: number;
	segments: TranscriptSegment[];
}

// ── Topic ───────────────────────────────────────────────────
export interface Topic {
	name: string;
	slug: string;
	episodeCount: number;
}

export interface TopicDetail {
	name: string;
	slug: string;
	episodeCount: number;
	episodes: EpisodeListItem[];
}

// ── Season ──────────────────────────────────────────────────
export interface Season {
	seasonNumber: number;
}

// ── Search ──────────────────────────────────────────────────
export interface SearchEpisodeResult {
	slug: string;
	title: string;
	intro: string | null;
	seasonNumber: number;
	episodeNumber: number;
	matchType: string;
}

export interface SearchTranscriptResult {
	episodeSlug: string;
	episodeTitle: string;
	text: string;
	speaker: string | null;
	startTimeMs: number;
}

export interface SearchData {
	episodes: SearchEpisodeResult[];
	transcripts: SearchTranscriptResult[];
}

// ── Query params ────────────────────────────────────────────
export interface EpisodesQuery {
	page?: number;
	limit?: number;
	season?: number;
	search?: string;
	tag?: string;
	sort?: 'newest' | 'oldest' | 'alpha' | 'longest' | 'shortest';
}
