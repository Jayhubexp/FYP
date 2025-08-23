import { BibleVerse } from "../types/app";

class BibleSearchService {
	private apiKey: string = (process.env.YOUR_SCRIPTURE_API_KEY as any) ?? "";
	private bibleId: string = "de4e12af7f28f599-02"; // KJV Bible ID

	constructor() {
		if (!this.apiKey) {
			console.warn(
				"YOUR_SCRIPTURE_API_KEY not set — bibleSearchService will use the local /api/bible-search proxy when available.",
			);
		}
	}

	private async fetchFromApi(path: string) {
		const isBrowser =
			typeof window !== "undefined" && typeof window.document !== "undefined";

		// In browser, always use the local proxy to avoid exposing API keys and to prevent CORS/401
		if (isBrowser) {
			const match = path.match(/search\?query=(.*)$/);
			const q = match ? decodeURIComponent(match[1]) : "";
			const proxyUrl = `/api/bible-search?q=${encodeURIComponent(q)}`;
			const proxyResp = await fetch(proxyUrl);
			if (!proxyResp.ok) {
				throw new Error(`Proxy HTTP error! status: ${proxyResp.status}`);
			}
			return proxyResp.json();
		}

		// Server-side: call the external Scripture API directly using configured API key
		if (!this.apiKey) {
			throw new Error(
				"Scripture API key not configured for server-side requests",
			);
		}

		const response = await fetch(`https://api.scripture.api.bible/v1${path}`, {
			headers: {
				"api-key": this.apiKey,
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	}

	// Detect if query looks like a reference (e.g., "John 3:16")
	private isReference(query: string): boolean {
		return /\b\d?\s?[A-Za-z]+\s+\d+:\d+\b/.test(query);
	}

	// Get a verse by reference like "John 3:16"
	async getVerseByReference(ref: string): Promise<BibleVerse | null> {
		try {
			const encodedRef = encodeURIComponent(ref);
			const data = await this.fetchFromApi(
				`/bibles/${this.bibleId}/search?query=${encodedRef}`,
			);

			// Support both external API shape { data: { verses: [...] } } and local proxy which returns an array
			let verses: any[] = [];
			if (Array.isArray(data)) {
				verses = data;
			} else if (data && data.data && Array.isArray(data.data.verses)) {
				verses = data.data.verses;
			}

			if (verses.length === 0) return null;

			const verse = verses[0];
			const reference = verse.reference || verse.canonical || "";
			const referenceParts = (reference.split(" ")[1] || "").split(":");
			const chapterNum = parseInt(referenceParts[0] || "0") || 0;
			const verseNum = parseInt(referenceParts[1] || "0") || 0;

			return {
				id: verse.id,
				reference,
				book: (reference.split(" ")[0] || "").trim(),
				chapter: chapterNum,
				verse: verseNum,
				text: (verse.text || verse.content || "").replace(/<[^>]+>/g, ""), // strip HTML
			};
		} catch (error) {
			console.error("Error fetching verse:", error);
			return null;
		}
	}

	// Search verses by text content
	async searchVerses(query: string): Promise<BibleVerse[]> {
		if (!query.trim()) return [];

		try {
			const encodedQuery = encodeURIComponent(query);
			const data = await this.fetchFromApi(
				`/bibles/${this.bibleId}/search?query=${encodedQuery}`,
			);

			let verses: any[] = [];
			if (Array.isArray(data)) {
				verses = data;
			} else if (data && data.data && Array.isArray(data.data.verses)) {
				verses = data.data.verses;
			}

			if (!verses || verses.length === 0) return [];

			return verses.map((verse: any) => {
				const reference = verse.reference || verse.canonical || "";
				const referenceParts = (reference.split(" ")[1] || "").split(":");
				const chapterNum = parseInt(referenceParts[0] || "0") || 0;
				const verseNum = parseInt(referenceParts[1] || "0") || 0;

				return {
					id: verse.id,
					reference,
					book: (reference.split(" ")[0] || "").trim(),
					chapter: chapterNum,
					verse: verseNum,
					text: (verse.text || verse.content || "").replace(/<[^>]+>/g, ""),
				} as BibleVerse;
			});
		} catch (error) {
			console.error("Bible search error:", error);
			return [];
		}
	}

	// Master method: decide whether query is a reference or text
	async findVerse(query: string): Promise<BibleVerse[] | BibleVerse | null> {
		if (this.isReference(query)) {
			return await this.getVerseByReference(query);
		} else {
			return await this.searchVerses(query);
		}
	}
}

export const bibleSearchService = new BibleSearchService();
