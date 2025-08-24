import type { TranscriptionResult } from "../types/app";

export class TranscriptionService {
	private baseUrl: string;

	constructor() {
		// Hardcoded for local development
		this.baseUrl = "http://localhost:5000";
	}

	/**
	 * Transcribe a Blob/File of audio by uploading to the server.
	 * @param audioBlob - a Blob or File containing audio (e.g., recorded WAV/MP3/MP4/M4A)
	 */
	async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
		const form = new FormData();
		// "audio" is the expected field name on the server (multer upload.single('audio'))
		const file =
			audioBlob instanceof File
				? audioBlob
				: new File([audioBlob], "audio.webm", {
						type: audioBlob.type || "audio/webm",
				  });
		form.append("audio", file);

		const endpoint = `${this.baseUrl}/api/transcribe`;
		const res = await fetch(endpoint, {
			method: "POST",
			body: form,
		});

		if (!res.ok) {
			// Try to extract server error
			let message = `Transcription failed with status ${res.status}`;
			try {
				const data = await res.json();
				if (data && data.error) message = data.error;
			} catch {}
			// Handle common error cases
			if (res.status === 413) {
				message = "Audio file too large for transcription";
			} else if (res.status === 500) {
				message = "Server error - please check if Whisper model is loaded";
			}
			throw new Error(message);
		}

		const payload = await res.json();
		// Expecting { text: string, bible_references?: Array<any>, raw?: any }
		const result: TranscriptionResult = {
			text: payload.text || "",
			segments: payload.raw?.chunks || [],
			confidence:
				typeof payload.confidence === "number" ? payload.confidence : undefined,
			language: payload.raw?.language || "en",
			durationSec: payload.raw?.duration,
			timestamp: new Date(),
			bibleReferences: payload.bible_references || [],
		};
		return result;
	}
}

export const transcriptionService = new TranscriptionService();
