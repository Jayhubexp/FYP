import { BibleVerse, TranscriptionResult } from "../types/app";
import { bibleSearchService } from "./bibleSearchService";

class VerseDetectionService {
	private lastTriggerTime = 0;
	private cooldownPeriod = 5000; // 5 seconds cooldown between triggers

	async detectVerse(transcription: TranscriptionResult): Promise<BibleVerse[]> {
		const now = Date.now();

		// Check if we're in cooldown period
		if (now - this.lastTriggerTime < this.cooldownPeriod) {
			return [];
		}

		// Check if the Python backend already detected Bible references
		if (
			transcription.bibleReferences &&
			transcription.bibleReferences.length > 0
		) {
			this.lastTriggerTime = now;

			// Convert the detected references to BibleVerse objects
			const verses: BibleVerse[] = [];

			for (const ref of transcription.bibleReferences) {
				// Fetch the actual verse text using the reference
				const searchResults = await bibleSearchService.searchVerses(
					ref.reference,
				);
				if (searchResults.length > 0) {
					// Add confidence from the detection
					searchResults[0].confidence = ref.confidence;
					verses.push(searchResults[0]);
				}
			}

			return verses;
		}

		return [];
	}
}

export const verseDetectionService = new VerseDetectionService();
