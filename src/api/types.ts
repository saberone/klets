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

/** Unpaginated list endpoints (persons, topics) return no meta. */
export interface ListResponse<T> {
	data: T[];
	meta?: PaginationMeta;
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
export type EpisodeType = 'full' | 'trailer' | 'bonus';

export interface EpisodeListItem {
	slug: string;
	title: string;
	intro: string | null;
	seasonNumber: number | null;
	episodeNumber: number | null;
	episodeType: EpisodeType;
	durationSeconds: number | null;
	publishedAt: string | null;
	artworkUrl: string | null;
	audioUrl: string | null;
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
	url: string | null;
	personName: string | null;
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
	seasonNumber: number | null;
	episodeNumber: number | null;
	episodeType: EpisodeType;
	durationSeconds: number | null;
	explicit: boolean;
	publishedAt: string | null;
	artworkUrl: string | null;
	audioUrl: string | null;
	tags: Tag[];
	persons: EpisodePersonDetail[];
	chapters: Chapter[];
	learningPoints: LearningPoint[];
	links: EpisodeLink[];
	platformLinks: PlatformLink[];
	hasTranscript: boolean;
}

// ── Transcript ──────────────────────────────────────────────
export interface TranscriptSegment {
	segmentIndex: number;
	startTimeMs: number;
	endTimeMs: number;
	text: string;
	speaker: string | null;
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
	summary: string | null;
	episodes: EpisodeListItem[];
}

/** Raw shape of GET /topics/:slug — flattened into TopicDetail by getTopic(). */
export interface TopicDetailRaw {
	data: {
		topic: Omit<TopicDetail, 'episodes'>;
		episodes: EpisodeListItem[];
	};
	meta?: PaginationMeta;
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
	seasonNumber: number | null;
	episodeNumber: number | null;
}

export interface SearchTranscriptResult {
	episodeSlug: string;
	episodeTitle: string;
	seasonNumber: number | null;
	episodeNumber: number | null;
	text: string;
	speaker: string | null;
	startTimeMs: number;
	endTimeMs: number;
}

/** Each key is only present when the matching `type` was requested. */
export interface SearchData {
	episodes?: SearchEpisodeResult[];
	transcripts?: SearchTranscriptResult[];
}

// ── Featured Moments ────────────────────────────────────────
export interface Moment {
	id: number;
	title: string;
	description: string | null;
	episodeSlug: string;
	episodeTitle: string;
	startTimeMs: number;
	endTimeMs: number;
	tag: Tag | null;
}

// ── Search Suggestions ─────────────────────────────────────
export interface SearchSuggestion {
	term: string;
	featured: boolean;
}

// ── Platform Links ─────────────────────────────────────────
export interface PlatformLink {
	platform: string;
	url: string;
}

// ── Easter Egg Quotes ──────────────────────────────────────
export interface Quote {
	text: string;
	attribution: string;
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
