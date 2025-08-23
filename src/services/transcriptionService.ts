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
			// Normalize some common cases to match server-side messages
			if (res.status === 401) {
				message = "Invalid API key - please check OpenAI configuration";
			} else if (res.status === 429) {
				message = "Rate limit exceeded - please try again later";
			} else if (res.status === 413) {
				message = "Audio file too large for transcription";
			}
			throw new Error(message);
		}

		const payload = await res.json();
		// Expecting { text: string, segments?: Array<any> }
		const result: TranscriptionResult = {
			text: payload.text || "",
			segments: payload.segments || [],
			confidence:
				typeof payload.confidence === "number" ? payload.confidence : undefined,
			language: payload.language,
			durationSec: payload.durationSec,
			timestamp: new Date(),
		};
		return result;
	}
}

export const transcriptionService = new TranscriptionService();
