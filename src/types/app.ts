export interface BibleVerse {
	id: string;
	reference: string;
	book: string;
	chapter: number;
	verse: number;
	text: string;
	confidence?: number;
}

export interface TranscriptionResult {
	text: string;
	confidence: number;
	timestamp: Date;
	segments?: Array<any>;
	language?: string;
	durationSec?: number;
	bibleReferences?: Array<{
		book: string;
		chapter: number;
		verse_start?: number;
		verse_end?: number;
		reference: string;
		confidence: number;
	}>;
	// Verses returned by the backend (fully fetched BibleVerse objects)
	verses?: BibleVerse[];
}

export interface ProjectionSettings {
	fontSize: number;
	backgroundColor: string;
	textColor: string;
	fontFamily: string;
	theme?: string;
	backgroundImage?: string;
	textShadow: boolean;
	textOutline: boolean;
}

export interface LogEntry {
	timestamp: Date;
	message: string;
	type: "info" | "success" | "warning" | "error";
}

export interface Song {
	id: string;
	title: string;
	artist?: string;
	lyrics: SongSection[];
	themes: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface SongSection {
	id: string;
	type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "tag";
	number?: number;
	text: string;
}

export interface Presentation {
	id: string;
	title: string;
	slides: PresentationSlide[];
	createdAt: Date;
	filePath?: string;
}

export interface PresentationSlide {
	id: string;
	title: string;
	content: string;
	imageUrl?: string;
	notes?: string;
}

export interface MediaItem {
	id: string;
	title: string;
	type: "image" | "video";
	url: string;
	thumbnailUrl?: string;
	publicId?: string;
	duration?: number;
	createdAt: Date;
	size?: number;
	format?: string;
}

export interface CloudinaryConfig {
	cloudName: string;
	apiKey: string;
	apiSecret?: string; // For server-side only
}

export interface UploadResponse {
	success: boolean;
	url?: string;
	thumbnailUrl?: string;
	publicId?: string;
	error?: string;
}

export interface PlaylistItem {
	id: string;
	type: "bible" | "song" | "presentation" | "media" | "blank";
	title: string;
	content: BibleVerse | Song | Presentation | MediaItem | null;
	duration?: number;
	notes?: string;
}

export interface Schedule {
	id: string;
	title: string;
	date: Date;
	items: PlaylistItem[];
	createdAt: Date;
	updatedAt: Date;
}

export interface Theme {
	id: string;
	name: string;
	backgroundColor: string;
	textColor: string;
	fontFamily: string;
	fontSize: number;
	backgroundImage?: string;
	textShadow: boolean;
	textOutline: boolean;
	gradient?: {
		from: string;
		to: string;
		direction: string;
	};
}

export interface AppState {
	isListening: boolean;
	currentTranscription: string;
	matchedVerses: BibleVerse[];
	selectedVerse: BibleVerse | null;
	projectionSettings: ProjectionSettings;
	logs: LogEntry[];
	songs: Song[];
	presentations: Presentation[];
	mediaItems: MediaItem[];
	currentSchedule: Schedule | null;
	currentPlaylistItem: PlaylistItem | null;
	themes: Theme[];
	isLiveMode: boolean;
	showBlackScreen: boolean;
	showLogo: boolean;
	previewMode: boolean;
}
