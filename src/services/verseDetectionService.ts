import { BibleVerse, TranscriptionResult } from "../types/app";
import { bibleSearchService } from "./bibleSearchService";

class VerseDetectionService {
	private lastTriggerTime = 0;
	private cooldownPeriod = 5000; // 5 seconds cooldown between triggers

	async detectVerse(transcription: TranscriptionResult): Promise<BibleVerse[]> {
		const text = transcription.text.toLowerCase();
		const now = Date.now();

		// Check if we're in cooldown period
		if (now - this.lastTriggerTime < this.cooldownPeriod) {
			return [];
		}

		// Check for trigger phrases
		const triggerPhrases = [
			"in the book of",
			"turn your bibles to",
			"the book of",
			"let's turn our bibles to",
			"scripture says",
			"as it is written",
			"the word tells us",
			"in",
			"if you look at",
			"i'm reading from",
			"the bible teaches us in",
			"according to",
			"we find in",
			"turn with me to",
			"let's read together from",
			"i invite you to look at",
			"our passage today is from",
			"the text for today is",
			"as we see in",
			"the passage i want to highlight is",
			"let's examine what",
			"in the words of",
			"the apostle paul writes in",
			"jesus said in",
		];

		// Check for direct book references
		const bibleBooks = [
			"genesis",
			"exodus",
			"leviticus",
			"numbers",
			"deuteronomy",
			"joshua",
			"judges",
			"ruth",
			"1 samuel",
			"2 samuel",
			"1 kings",
			"2 kings",
			"1 chronicles",
			"2 chronicles",
			"ezra",
			"nehemiah",
			"esther",
			"job",
			"psalms",
			"proverbs",
			"ecclesiastes",
			"song of solomon",
			"isaiah",
			"jeremiah",
			"lamentations",
			"ezekiel",
			"daniel",
			"hosea",
			"joel",
			"amos",
			"obadiah",
			"jonah",
			"micah",
			"nahum",
			"habakkuk",
			"zephaniah",
			"haggai",
			"zechariah",
			"malachi",
			"matthew",
			"mark",
			"luke",
			"john",
			"acts",
			"romans",
			"1 corinthians",
			"2 corinthians",
			"galatians",
			"ephesians",
			"philippians",
			"colossians",
			"1 thessalonians",
			"2 thessalonians",
			"1 timothy",
			"2 timothy",
			"titus",
			"philemon",
			"hebrews",
			"james",
			"1 peter",
			"2 peter",
			"1 john",
			"2 john",
			"3 john",
			"jude",
			"revelation",
		];

		// Check for any trigger phrase
		let triggered = false;
		let queryText = text;

		for (const phrase of triggerPhrases) {
			if (text.includes(phrase)) {
				triggered = true;
				// Extract text after the trigger phrase
				const startIndex = text.indexOf(phrase) + phrase.length;
				queryText = text.substring(startIndex).trim();
				break;
			}
		}

		// If no trigger phrase found, check for direct book references
		if (!triggered) {
			for (const book of bibleBooks) {
				if (text.includes(book)) {
					triggered = true;
					queryText = text;
					break;
				}
			}
		}

		if (triggered) {
			this.lastTriggerTime = now;
			return await bibleSearchService.searchVerses(queryText);
		}

		return [];
	}
}

export const verseDetectionService = new VerseDetectionService();
