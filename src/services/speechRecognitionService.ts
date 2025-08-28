import { transcriptionService } from "./transcriptionService";
import type { TranscriptionResult } from "../types/app";

class SpeechRecognitionService {
	private isListening = false;
	private mediaStream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private callback: ((result: TranscriptionResult) => void) | null = null;

	async startListening(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		if (this.isListening) return;

		this.isListening = true;
		this.callback = callback;

		try {
			// Use the reliable MediaRecorder method to capture audio chunks.
			await this.startMediaRecorder();
		} catch (err) {
			console.error("Could not start listening:", err);
			this.stopListening();
			throw err;
		}
	}

	private async startMediaRecorder(): Promise<void> {
		this.mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});

		this.mediaRecorder = new MediaRecorder(this.mediaStream, {
			mimeType: "audio/webm",
		});

		this.mediaRecorder.ondataavailable = async (event) => {
			if (event.data && event.data.size > 0 && this.isListening) {
				const audioBlob = new Blob([event.data], { type: "audio/webm" });
				try {
					// Send every audio chunk to the backend for transcription.
					const result = await transcriptionService.transcribe(audioBlob);

					// Immediately forward the full, unfiltered result to the main app.
					if (result && this.callback) {
						this.callback(result);
					}
				} catch (err) {
					console.error("Transcription failed for audio chunk:", err);
				}
			}
		};

		// Record audio in 5-second intervals.
		this.mediaRecorder.start(5000);
		console.log("Continuous speech recognition started.");
	}

	stopListening(): void {
		if (!this.isListening) return;

		this.isListening = false;
		this.callback = null;

		if (this.mediaRecorder?.state === "recording") {
			this.mediaRecorder.stop();
		}

		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
		}

		this.mediaRecorder = null;
		this.mediaStream = null;
		console.log("Continuous speech recognition stopped.");
	}

	isCurrentlyListening(): boolean {
		return this.isListening;
	}
}

export const speechRecognitionService = new SpeechRecognitionService();
