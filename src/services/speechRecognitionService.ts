import { transcriptionService } from "./transcriptionService";

class SpeechRecognitionService {
	private isListening = false;
	private mediaStream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private chunks: BlobPart[] = [];
	private callback: ((result: TranscriptionResult) => void) | null = null;

	async startListening(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		if (this.isListening) return;
		this.isListening = true;
		this.callback = callback;

		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});

			this.mediaRecorder = new MediaRecorder(this.mediaStream, {
				mimeType: "audio/webm",
			});

			this.chunks = [];
			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					this.chunks.push(e.data);
				}
			};

			this.mediaRecorder.onstop = async () => {
				if (this.chunks.length > 0) {
					const blob = new Blob(this.chunks, { type: "audio/webm" });
					try {
						const result = await transcriptionService.transcribe(blob);
						if (this.callback) {
							this.callback(result);
						}
					} catch (error) {
						console.error("Transcription error:", error);
						if (this.callback) {
							this.callback({
								text: "",
								confidence: 0,
								timestamp: new Date(),
								segments: [],
								error:
									error instanceof Error
										? error.message
										: "Transcription failed",
							} as any);
						}
					} finally {
						this.chunks = [];
					}
				}
			};

			// Record in chunks for real-time processing
			this.mediaRecorder.start(5000); // 5-second chunks
		} catch (err) {
			console.error("Microphone access denied:", err);
			this.isListening = false;
			throw err;
		}
	}

	/**
	 * Checks if the given text contains trigger words for Bible search.
	 * @param text The text to check.
	 */
	hasTriggerWords(text: string): boolean {
		// This is now handled by the Python backend, but keeping for compatibility
		const triggerWords = ["bible", "scripture", "verse", "book", "chapter"];
		return triggerWords.some((word) => text.toLowerCase().includes(word));
	}

	stopListening(): void {
		if (!this.isListening) return;
		this.isListening = false;
		this.callback = null;

		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
			this.mediaRecorder.stop();
		}

		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}
	}

	isCurrentlyListening(): boolean {
		return this.isListening;
	}

	/**
	 * Convenience method for transcribing an already-recorded audio Blob/File.
	 */
	async transcribe(audio: Blob): Promise<TranscriptionResult> {
		return transcriptionService.transcribe(audio);
	}
}

export const speechRecognitionService = new SpeechRecognitionService();
