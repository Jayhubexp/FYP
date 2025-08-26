import { BibleVerse } from "../types/app";

class BibleSearchService {
	// Helper function to correctly map the server response to our BibleVerse type
	private mapApiResponseToVerse(apiVerse: any): BibleVerse {
		// The server provides 'book', 'chapter', 'verse', 'text', and 'version' directly.
		// We just need to ensure the 'reference' field is created for display purposes.
		return {
			id:
				apiVerse.id || `${apiVerse.book} ${apiVerse.chapter}:${apiVerse.verse}`,
			reference: `${apiVerse.book} ${apiVerse.chapter}:${apiVerse.verse}`,
			book: apiVerse.book || "Unknown Book",
			chapter: apiVerse.chapter || 0,
			verse: apiVerse.verse || 0,
			text: apiVerse.text || "No text available.",
			version: apiVerse.version || "KJV", // Add the version field
		};
	}

	// Search verses by any query (reference or keyword)
	async searchVerses(query: string): Promise<BibleVerse[]> {
		if (!query.trim()) return [];
		try {
			// The backend handles both reference and keyword searches with the same endpoint
			const resp = await fetch(
				`http://localhost:5000/api/bible-search?q=${encodeURIComponent(query)}`,
			);

			if (!resp.ok) {
				throw new Error(`Server responded with status: ${resp.status}`);
			}

			const data = await resp.json();
			const versesFromApi = data?.verses || [];

			// Use our mapping function to ensure the data is in the correct format
			return versesFromApi.map(this.mapApiResponseToVerse);
		} catch (error) {
			console.error("Bible search error:", error);
			return [];
		}
	}
}

export const bibleSearchService = new BibleSearchService();
