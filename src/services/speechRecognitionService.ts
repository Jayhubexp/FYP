import { transcriptionService } from "./transcriptionService";
import { bibleSearchService } from "./bibleSearchService";

class SpeechRecognitionService {
	/**
	 * Checks if the given text contains trigger words for Bible search.
	 * @param text The text to check.
	 */
	hasTriggerWords(text: string): boolean {
		const triggerWords = ["bible", "scripture", "verse"];
		return triggerWords.some((word) => text.toLowerCase().includes(word));
	}
	private isListening = false;
	private mediaStream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private chunks: BlobPart[] = [];
	private intervalId: ReturnType<typeof setTimeout> | null = null;

	async startListening(): Promise<void> {
		if (this.isListening) return;
		this.isListening = true;

		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			this.mediaRecorder = new MediaRecorder(this.mediaStream, {
				mimeType: "audio/webm",
			});

			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					this.chunks.push(e.data);
				}
			};

			this.mediaRecorder.start(3000); // Send chunks every 3 seconds

			// Periodically process accumulated chunks
			this.intervalId = setInterval(() => {
				if (this.chunks.length > 0) {
					const blob = new Blob(this.chunks, { type: "audio/webm" });
					this.processAudioChunk(blob);
					this.chunks = []; // Reset chunks
				}
			}, 3000);
		} catch (err) {
			console.error("Microphone access denied:", err);
		}
	}

	private async processAudioChunk(chunk: Blob) {
		try {
			const result = await transcriptionService.transcribe(chunk);
			// Trigger Bible search with the latest transcription
			await this.triggerBibleSearch(result.text);
		} catch (err) {
			console.error("Transcription error:", err);
		}
	}

	private async triggerBibleSearch(text: string) {
		// Simple trigger word detection
		const triggerWords = ["bible", "scripture", "verse"];
		const hasTrigger = triggerWords.some((word) =>
			text.toLowerCase().includes(word),
		);

		if (hasTrigger) {
			await bibleSearchService.searchVerses(text);
			// Handle displaying verses if needed
		}
	}

	stopListening(): void {
		if (!this.isListening) return;
		this.isListening = false;

		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
			this.mediaRecorder.stop();
		}

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}

		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}
	}

	isCurrentlyListening(): boolean {
		return this.isListening;
	}
}

export const speechRecognitionService = new SpeechRecognitionService();

// import type { TranscriptionResult } from "../types/app";
// import { transcriptionService } from "./transcriptionService";

// /**
//  * SpeechRecognitionService (client-side)
//  *
//  * This service captures or accepts audio and forwards it to the server-side
//  * transcription endpoint for processing, mirroring the implementation in server.zip.
//  */
// class SpeechRecognitionService {
//   private isListening = false;
//   private mediaStream: MediaStream | null = null;
//   private mediaRecorder: MediaRecorder | null = null;
//   private chunks: BlobPart[] = [];
//   private callback: ((result: TranscriptionResult) => void) | null = null;

//   async startListening(callback: (result: TranscriptionResult) => void): Promise<void> {
//     if (this.isListening) return;
//     this.callback = callback;
//     // Request microphone access
//     this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: "audio/webm" });

//     this.chunks = [];
//     this.mediaRecorder.ondataavailable = (e) => {
//       if (e.data && e.data.size > 0) this.chunks.push(e.data);
//     };
//     this.mediaRecorder.onstop = async () => {
//       const blob = new Blob(this.chunks, { type: "audio/webm" });
//       try {
//         const result = await transcriptionService.transcribe(blob);
//         this.callback && this.callback(result);
//       } catch (err: any) {
//         console.error("Transcription error:", err?.message || err);
//         this.callback && this.callback({ text: "", segments: [], error: err?.message || "Transcription failed" } as any);
//       } finally {
//         this.chunks = [];
//       }
//     };

//     this.mediaRecorder.start();
//     this.isListening = true;
//   }

//   stopListening(): void {
//     if (!this.isListening) return;
//     this.isListening = false;
//     if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
//       this.mediaRecorder.stop();
//     }
//     if (this.mediaStream) {
//       this.mediaStream.getTracks().forEach((t) => t.stop());
//       this.mediaStream = null;
//     }
//   }

//   isCurrentlyListening(): boolean {
//     return this.isListening;
//   }

//   /**
//    * Convenience method for transcribing an already-recorded audio Blob/File.
//    */
//   async transcribe(audio: Blob): Promise<TranscriptionResult> {
//     return transcriptionService.transcribe(audio);
//   }
// }

// export const speechRecognitionService = new SpeechRecognitionService();
