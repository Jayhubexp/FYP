// speechRecognition.ts (Corrected for Live Transcription Loop)

import { transcriptionService } from "./transcriptionService";
import type { TranscriptionResult } from "../types/app";

class SpeechRecognitionService {
	private isListening = false;
	private mediaRecorder: MediaRecorder | null = null;
	private callback: ((result: TranscriptionResult) => void) | null = null;
	private mediaStream: MediaStream | null = null;

	// The duration of each audio chunk in milliseconds
	private readonly CHUNK_DURATION_MS = 7000; // 7 seconds

	// --- Main Control Methods ---

	async startListening(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		if (this.isListening) {
			console.warn("Already listening.");
			return;
		}

		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			this.isListening = true;
			this.callback = callback;
			console.log("Starting live transcription loop...");

			// Kick off the first recording cycle
			this.recordAndProcessChunk();
		} catch (err) {
			console.error("Could not get microphone access:", err);
			this.stopListening(); // Clean up on failure
			throw err;
		}
	}

	stopListening(): void {
		if (!this.isListening) {
			return;
		}

		console.log("Stopping live transcription loop...");
		this.isListening = false;
		this.callback = null;

		// Stop any active recorder
		if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
			this.mediaRecorder.stop();
		}

		// Release the microphone
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}
	}

	// --- The Core Recording Loop ---

	private recordAndProcessChunk(): void {
		// If we've been told to stop, exit the loop
		if (!this.isListening || !this.mediaStream) {
			return;
		}

		const audioChunks: Blob[] = [];
		this.mediaRecorder = new MediaRecorder(this.mediaStream, {
			mimeType: "audio/webm",
		});

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				audioChunks.push(event.data);
			}
		};

		this.mediaRecorder.onstop = async () => {
			// Combine chunks into one complete file
			const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

			// Send for transcription without waiting for the result
			this.transcribeChunk(audioBlob);

			// IMPORTANT: Start the next recording cycle immediately
			this.recordAndProcessChunk();
		};

		this.mediaRecorder.start();

		// Let it record for the chunk duration, then stop it to trigger onstop
		setTimeout(() => {
			if (this.mediaRecorder?.state === "recording") {
				this.mediaRecorder.stop();
			}
		}, this.CHUNK_DURATION_MS);
	}

	private async transcribeChunk(audioBlob: Blob): Promise<void> {
		try {
			const result = await transcriptionService.transcribe(audioBlob);
			// Check if we are still in a listening state before calling back
			if (this.isListening && this.callback && result.text.trim()) {
				this.callback(result);
			}
		} catch (error) {
			console.error("Transcription failed for chunk:", error);
		}
	}

	isCurrentlyListening(): boolean {
		return this.isListening;
	}
}

export const speechRecognitionService = new SpeechRecognitionService();
