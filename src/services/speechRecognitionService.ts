import { transcriptionService } from "./transcriptionService";
import type { TranscriptionResult } from "../types/app";

class SpeechRecognitionService {
	private isListening = false;
	private mediaStream: MediaStream | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private chunks: BlobPart[] = [];
	private callback: ((result: TranscriptionResult) => void) | null = null;
	private speechRecognition: any = null; // browser SpeechRecognition instance when available
	private lastTriggerAt = 0;
	private triggerCooldown = 5000; // ms
	private usingMediaRecorderFallback = false;

	async startListening(
		callback: (result: TranscriptionResult) => void,
	): Promise<void> {
		if (this.isListening) return;
		this.isListening = true;
		this.callback = callback;

		// Prefer Web Speech API (SpeechRecognition) when available for trigger-word detection
		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;
		if (SpeechRecognition) {
			try {
				this.speechRecognition = new SpeechRecognition();
				this.speechRecognition.continuous = true;
				this.speechRecognition.interimResults = true;
				this.speechRecognition.lang = "en-US";

				this.speechRecognition.onresult = async (event: any) => {
					let transcript = "";
					for (let i = event.resultIndex; i < event.results.length; ++i) {
						transcript += event.results[i][0].transcript;
					}

					// Debounce triggers
					const now = Date.now();
					const triggerWords = [
						"bible",
						"scripture",
						"verse",
						"psalm",
						"psalms",
						"john",
						"psalm",
						"chapter",
						"read",
						"turn to",
						"let's turn to",
					];
					const foundTrigger = triggerWords.some((w) =>
						transcript.toLowerCase().includes(w),
					);
					if (foundTrigger && now - this.lastTriggerAt > this.triggerCooldown) {
						this.lastTriggerAt = now;
						try {
							const result = await transcriptionService.lookupText(transcript);
							if (this.callback) this.callback(result);
						} catch (err) {
							console.error("lookupText failed:", err);
						}
					}
				};

				this.speechRecognition.onerror = async (e: any) => {
					console.warn("SpeechRecognition error", e);
					try {
						const errCode = e?.error || e?.message || "unknown";
						// If the error appears to be network/service related, fall back to MediaRecorder
						if (
							errCode === "network" ||
							errCode === "service-not-allowed" ||
							errCode === "not-allowed"
						) {
							// Prevent repeated fallback attempts
							if (this.usingMediaRecorderFallback) return;
							this.usingMediaRecorderFallback = true;
							console.info(
								"SpeechRecognition network/service error — switching to MediaRecorder fallback",
							);
							try {
								this.speechRecognition.onresult = null;
								this.speechRecognition.onend = null;
								this.speechRecognition.onerror = null;
								this.speechRecognition.stop();
							} catch {}
							this.speechRecognition = null;
							// start fallback
							try {
								await this._startMediaRecorderFallback();
							} catch (fbErr) {
								console.error("Failed to start MediaRecorder fallback:", fbErr);
								this.usingMediaRecorderFallback = false;
							}
						}
					} catch (outerErr) {
						console.error(
							"Error handling SpeechRecognition.onerror:",
							outerErr,
						);
					}
				};

				this.speechRecognition.onend = () => {
					// auto-restart to keep listening
					if (this.isListening) {
						try {
							this.speechRecognition.start();
						} catch {}
					}
				};

				this.speechRecognition.start();
				return;
			} catch (e) {
				console.warn(
					"SpeechRecognition init failed, falling back to MediaRecorder",
					e,
				);
			}
		}

		// Fallback: MediaRecorder chunking as before
		try {
			await this._startMediaRecorderFallback();
		} catch (err) {
			console.error("Microphone access denied or MediaRecorder failed:", err);
			this.isListening = false;
			throw err;
		}
	}

	/**
	 * Start the MediaRecorder-based fallback and begin recording in 5s chunks.
	 * This is a class method so it can be called from multiple code paths.
	 */
	private async _startMediaRecorderFallback(): Promise<void> {
		// If already recording, no-op
		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") return;

		this.mediaStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
		});
		this.mediaRecorder = new MediaRecorder(this.mediaStream, {
			mimeType: "audio/webm",
		});
		this.chunks = [];

		this.mediaRecorder.ondataavailable = async (e) => {
			if (e.data && e.data.size > 0) {
				// Immediately send each chunk for transcription so users see results quickly
				const chunkBlob = new Blob([e.data], { type: "audio/webm" });
				try {
					const result = await transcriptionService.transcribe(chunkBlob);
					if (this.callback) this.callback(result);
				} catch (err) {
					console.error("Transcription error (chunk):", err);
				}
				// Also keep chunk in buffer in case we want to assemble on stop
				this.chunks.push(e.data);
			}
		};

		this.mediaRecorder.onstop = async () => {
			if (this.chunks.length > 0) {
				const blob = new Blob(this.chunks, { type: "audio/webm" });
				try {
					const result = await transcriptionService.transcribe(blob);
					if (this.callback) this.callback(result);
				} catch (error) {
					console.error("Transcription error (fallback):", error);
					if (this.callback) {
						this.callback({
							text: "",
							confidence: 0,
							timestamp: new Date(),
						} as any);
					}
				} finally {
					this.chunks = [];
				}
			}
		};

		this.mediaRecorder.start(5000);
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

		if (this.speechRecognition) {
			try {
				this.speechRecognition.onresult = null;
				this.speechRecognition.onend = null;
				this.speechRecognition.onerror = null;
				this.speechRecognition.stop();
			} catch {}
			this.speechRecognition = null;
		}

		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
			this.mediaRecorder.stop();
		}

		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}

		// Reset fallback guard so later starts can attempt SpeechRecognition again
		this.usingMediaRecorderFallback = false;
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
