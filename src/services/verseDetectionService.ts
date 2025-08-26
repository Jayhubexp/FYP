import { BibleVerse, TranscriptionResult } from "../types/app";
import { bibleSearchService } from "./bibleSearchService";

class VerseDetectionService {
	private lastTriggerTime = 0;
	private cooldownPeriod = 5000; // 5 seconds cooldown between triggers

	async detectVerse(transcription: TranscriptionResult): Promise<BibleVerse[]> {
		const now = Date.now();

		if (now - this.lastTriggerTime < this.cooldownPeriod) {
			return [];
		}

		// The Python backend now sends full verse objects in the 'verses' property
		if (transcription.verses && transcription.verses.length > 0) {
			this.lastTriggerTime = now;
			// We can return these directly, as the search service will ensure they are mapped correctly.
			return transcription.verses;
		}

		// This is a fallback in case the backend only sends 'bibleReferences'
		if (
			transcription.bibleReferences &&
			transcription.bibleReferences.length > 0
		) {
			this.lastTriggerTime = now;
			const verses: BibleVerse[] = [];
			for (const ref of transcription.bibleReferences) {
				const searchResults = await bibleSearchService.searchVerses(
					ref.reference,
				);
				if (searchResults.length > 0) {
					const foundVerse = searchResults[0];
					foundVerse.confidence = ref.confidence;
					verses.push(foundVerse);
				}
			}
			return verses;
		}

		return [];
	}
}

export const verseDetectionService = new VerseDetectionService();
