import { BibleVerse } from "../types/app";

class BibleSearchService {
	// Always use the local backend proxy /api/bible-search which now queries the local SQLite DB.

	// Detect if query looks like a reference (e.g., "John 3:16")
	private isReference(query: string): boolean {
		return /\b\d?\s?[A-Za-z]+\s+\d+:\d+\b/.test(query);
	}

	// Get a verse by reference like "John 3:16"
	async getVerseByReference(ref: string): Promise<BibleVerse | null> {
		try {
			const resp = await fetch(
				`http://localhost:5000/api/bible-search?q=${encodeURIComponent(ref)}`,
			);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data = await resp.json();
			const verses = data?.verses || [];
			if (!verses || verses.length === 0) return null;
			const v = verses[0];
			// Normalize to BibleVerse
			const [bookPart, rest] = (v.reference || "").split(" ", 2);
			const parts = (rest || "").split(":");
			const chapter = parseInt(parts[0] || "0") || 0;
			const verseNum = parseInt(parts[1] || "0") || 0;
			return {
				id: v.id || `${v.reference}`,
				reference: v.reference || "",
				book: bookPart || v.book || "",
				chapter,
				verse: verseNum,
				text: v.text || "",
			} as BibleVerse;
		} catch (error) {
			console.error("Error fetching verse from local proxy:", error);
			return null;
		}
	}

	// Search verses by text content
	async searchVerses(query: string): Promise<BibleVerse[]> {
		if (!query.trim()) return [];
		try {
			const resp = await fetch(
				`http://localhost:5000/api/bible-search?q=${encodeURIComponent(query)}`,
			);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data = await resp.json();
			const verses = data?.verses || [];
			return verses.map((v: any) => {
				const [bookPart, rest] = (v.reference || "").split(" ", 2);
				const parts = (rest || "").split(":");
				const chapter = parseInt(parts[0] || "0") || 0;
				const verseNum = parseInt(parts[1] || "0") || 0;
				return {
					id: v.id || `${v.reference}`,
					reference: v.reference || "",
					book: bookPart || v.book || "",
					chapter,
					verse: verseNum,
					text: v.text || "",
				} as BibleVerse;
			});
		} catch (error) {
			console.error("Bible search error from local proxy:", error);
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
