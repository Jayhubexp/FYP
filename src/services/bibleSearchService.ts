import { BibleVerse } from '../types/app';
import { bibleData } from '../data/bibleDatabase';

class BibleSearchService {
  private verses: BibleVerse[] = [];

  initialize() {
    this.verses = bibleData;
  }

  searchVerses(query: string): BibleVerse[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    
    // Search strategies
    const results: Map<string, BibleVerse & { confidence: number }> = new Map();

    // 1. Direct reference search (e.g., "John 3:16")
    const referenceMatch = this.searchByReference(normalizedQuery);
    if (referenceMatch) {
      results.set(referenceMatch.id, { ...referenceMatch, confidence: 1.0 });
    }

    // 2. Exact phrase matching
    this.verses.forEach(verse => {
      const verseText = verse.text.toLowerCase();
      if (verseText.includes(normalizedQuery)) {
        const confidence = normalizedQuery.length / verseText.length;
        if (!results.has(verse.id) || results.get(verse.id)!.confidence < confidence) {
          results.set(verse.id, { ...verse, confidence: Math.min(confidence + 0.2, 1.0) });
        }
      }
    });

    // 3. Fuzzy word matching
    this.verses.forEach(verse => {
      const verseWords = verse.text.toLowerCase().split(/\s+/);
      const matchedWords = words.filter(word => 
        verseWords.some(verseWord => 
          verseWord.includes(word) || word.includes(verseWord) || 
          this.levenshteinDistance(word, verseWord) <= 2
        )
      );
      
      if (matchedWords.length >= Math.min(3, words.length * 0.7)) {
        const confidence = matchedWords.length / words.length * 0.8;
        if (!results.has(verse.id) || results.get(verse.id)!.confidence < confidence) {
          results.set(verse.id, { ...verse, confidence });
        }
      }
    });

    // 4. Semantic keyword matching
    const keywordMatches = this.searchByKeywords(words);
    keywordMatches.forEach(verse => {
      if (!results.has(verse.id)) {
        results.set(verse.id, verse);
      }
    });

    // Convert to array and sort by confidence
    return Array.from(results.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Limit to top 10 results
  }

  private searchByReference(query: string): BibleVerse | null {
    // Handle various reference formats
    const patterns = [
      /(\d?\s*\w+)\s+(\d+):(\d+)/i,  // "John 3:16", "1 John 2:3"
      /(\d?\s*\w+)\s+(\d+)\s+(\d+)/i, // "John 3 16"
      /(\w+)\s+(\d+):(\d+)/i          // "john 3:16"
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const [, book, chapter, verse] = match;
        const foundVerse = this.verses.find(v => 
          v.book.toLowerCase().includes(book.toLowerCase().trim()) &&
          v.chapter === parseInt(chapter) &&
          v.verse === parseInt(verse)
        );
        if (foundVerse) return foundVerse;
      }
    }

    return null;
  }

  private searchByKeywords(words: string[]): (BibleVerse & { confidence: number })[] {
    const keywordMap: { [key: string]: string[] } = {
      love: ['love', 'beloved', 'charity', 'affection'],
      faith: ['faith', 'believe', 'trust', 'faithful'],
      hope: ['hope', 'trust', 'expectation'],
      peace: ['peace', 'rest', 'calm', 'still'],
      joy: ['joy', 'rejoice', 'glad', 'merry'],
      strength: ['strength', 'strong', 'mighty', 'power'],
      wisdom: ['wisdom', 'wise', 'understanding', 'knowledge'],
      forgiveness: ['forgive', 'forgiveness', 'mercy', 'pardon'],
      salvation: ['salvation', 'save', 'saved', 'savior'],
      eternal: ['eternal', 'everlasting', 'forever', 'always']
    };

    const results: (BibleVerse & { confidence: number })[] = [];
    
    words.forEach(word => {
      Object.entries(keywordMap).forEach(([theme, keywords]) => {
        if (keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
          this.verses.forEach(verse => {
            const verseText = verse.text.toLowerCase();
            const keywordCount = keywords.filter(keyword => verseText.includes(keyword)).length;
            if (keywordCount > 0) {
              const confidence = Math.min(keywordCount * 0.3, 0.7);
              const existing = results.find(r => r.id === verse.id);
              if (existing) {
                existing.confidence = Math.max(existing.confidence, confidence);
              } else {
                results.push({ ...verse, confidence });
              }
            }
          });
        }
      });
    });

    return results;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const bibleSearchService = new BibleSearchService();