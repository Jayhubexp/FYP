import type { TranscriptionResult } from "../types/app";

export class TranscriptionService {
	private baseUrl: string;

	constructor() {
		// Hardcoded for local development
		this.baseUrl = "http://localhost:5000";
	}

	/**
	 * Send plain text to the backend for verse lookup (uses /api/transcribe-text)
	 */
	async lookupText(text: string): Promise<TranscriptionResult> {
		const endpoint = `${this.baseUrl}/api/transcribe`;
		const res = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		});

		if (!res.ok) {
			let message = `Lookup failed with status ${res.status}`;
			try {
				const data = await res.json();
				if (data && data.error) message = data.error;
			} catch {}
			throw new Error(message);
		}

		const payload = await res.json();
		const result: TranscriptionResult = {
			text: payload.text || "",
			segments: payload.raw?.chunks || [],
			confidence:
				typeof payload.confidence === "number" ? payload.confidence : undefined,
			language: payload.raw?.language || "en",
			durationSec: payload.raw?.duration,
			timestamp: new Date(),
			bibleReferences: payload.bible_references || [],
			verses: payload.verses || [],
		};

		return result;
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

		// If running in Electron and preload exposes uploadAudio, prefer main-process upload
		if (
			typeof window !== "undefined" &&
			(window as any).electronAPI?.uploadAudio
		) {
			// Convert Blob to base64 to send via IPC
			const name = (file as File).name || "audio.webm";
			const type = (file as File).type || "audio/webm";
			const arrayBuffer = await file.arrayBuffer();
			const uint8 = new Uint8Array(arrayBuffer);
			let binary = "";
			for (let i = 0; i < uint8.length; i++)
				binary += String.fromCharCode(uint8[i]);
			const base64 = btoa(binary);

			const resp = await (window as any).electronAPI.uploadAudio({
				name,
				type,
				dataBase64: base64,
			});

			if (!resp || resp.success === false) {
				throw new Error(resp?.error || "Main-process upload failed");
			}

			const payload = resp.data || {};
			const result: TranscriptionResult = {
				text: payload.text || "",
				segments: payload.raw?.chunks || [],
				confidence:
					typeof payload.confidence === "number"
						? payload.confidence
						: undefined,
				language: payload.raw?.language || "en",
				durationSec: payload.raw?.duration,
				timestamp: new Date(),
				bibleReferences: payload.bible_references || [],
				verses: payload.verses || [],
			};
			return result;
		}

		let res: Response | null = null;
		try {
			res = await fetch(endpoint, {
				method: "POST",
				body: form,
			});
		} catch (fetchErr) {
			// Fetch failed (Chromium chunked upload issues in Electron). Fall back to XHR upload.
			try {
				const xhrResponseText = await new Promise<string>((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open("POST", endpoint);
					xhr.onload = () => {
						if (xhr.status >= 200 && xhr.status < 300)
							resolve(xhr.responseText);
						else
							reject(new Error(`XHR upload failed with status ${xhr.status}`));
					};
					xhr.onerror = () =>
						reject(new Error("Network error during XHR upload"));
					xhr.send(form);
				});
				// build a minimal Response-like object by parsing the JSON
				const parsed = JSON.parse(xhrResponseText || "{}");
				// create a fake Response with json() method
				res = {
					ok: true,
					status: 200,
					json: async () => parsed,
				} as unknown as Response;
			} catch (xhrErr) {
				throw new Error(`Upload failed: ${fetchErr} / ${xhrErr}`);
			}
		}

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
			verses: payload.verses || [],
		};
		return result;
	}

	// NOTE: Removed getLastTranscription() and pollLastTranscription() to simplify flow.
	// Clients should POST audio to /api/transcribe and use the returned transcription.
}

export const transcriptionService = new TranscriptionService();
