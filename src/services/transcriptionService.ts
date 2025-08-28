import type { TranscriptionResult } from "../types/app";

export class TranscriptionService {
	private baseUrl: string;

	constructor() {
		// The base URL for your Python backend
		this.baseUrl = "http://localhost:5000";
	}

	/**
	 * Transcribes an audio Blob by uploading it to the Python server's
	 * /api/transcribe endpoint.
	 * @param audioBlob - A Blob or File containing the audio to transcribe.
	 */
	async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
		const form = new FormData();
		const file = new File([audioBlob], "audio.webm", {
			type: audioBlob.type || "audio/webm",
		});
		// The backend expects a file field named "audio"
		form.append("audio", file);

		const endpoint = `${this.baseUrl}/api/transcribe`;

		try {
			const res = await fetch(endpoint, {
				method: "POST",
				body: form,
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => null);
				throw new Error(
					errorData?.error || `Server responded with status ${res.status}`,
				);
			}

			const payload = await res.json();

			// Map the server's response to our frontend TranscriptionResult type
			const result: TranscriptionResult = {
				text: payload.text || "",
				confidence:
					typeof payload.confidence === "number" ? payload.confidence : 0,
				timestamp: new Date(),
				bibleReferences: payload.bible_references || [],
				verses: payload.verses || [],
				// Optional raw data from the server
				segments: payload.raw?.segments,
				language: payload.raw?.language,
				durationSec: payload.raw?.duration,
			};
			return result;
		} catch (error) {
			console.error("Transcription service error:", error);
			// Return an empty result on failure to prevent app crashes
			return {
				text: "Error during transcription.",
				confidence: 0,
				timestamp: new Date(),
				verses: [],
			};
		}
	}
}

export const transcriptionService = new TranscriptionService();
