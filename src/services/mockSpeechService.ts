import { TranscriptionResult } from '../types/app';

class MockSpeechService {
  private isListening = false;
  private intervalId: NodeJS.Timeout | null = null;
  private callback: ((result: TranscriptionResult) => void) | null = null;

  // Mock sermon phrases that might contain Bible verses
  private mockPhrases = [
    "As Jesus said, love your neighbor as yourself",
    "The Bible tells us in John three sixteen that God so loved the world",
    "Remember what Paul wrote about faith, hope, and love, but the greatest of these is love",
    "Trust in the Lord with all your heart and lean not on your own understanding",
    "I can do all things through Christ who strengthens me",
    "Be still and know that I am God",
    "The Lord is my shepherd, I shall not want",
    "For where two or three are gathered in my name, there am I among them",
    "Ask and it will be given to you, seek and you will find",
    "Come unto me, all ye that labor and are heavy laden, and I will give you rest"
  ];

  private currentPhraseIndex = 0;

  startListening(callback: (result: TranscriptionResult) => void) {
    if (this.isListening) return;
    
    this.isListening = true;
    this.callback = callback;
    this.currentPhraseIndex = 0;

    // Simulate real-time transcription with delays
    this.intervalId = setInterval(() => {
      if (this.currentPhraseIndex < this.mockPhrases.length) {
        const phrase = this.mockPhrases[this.currentPhraseIndex];
        const result: TranscriptionResult = {
          text: phrase,
          confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
          timestamp: new Date()
        };
        
        if (this.callback) {
          this.callback(result);
        }
        
        this.currentPhraseIndex++;
      } else {
        // Loop back to beginning
        this.currentPhraseIndex = 0;
      }
    }, 8000); // New phrase every 8 seconds
  }

  stopListening() {
    this.isListening = false;
    this.callback = null;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

export const mockSpeechService = new MockSpeechService();