const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const FormData = require("form-data");
const app = express();

// Allow CORS for web (localhost:5173) and desktop (file://, electron)
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"file://",
			// Add more origins if your Electron app uses a custom protocol, e.g. 'app://-'
		],
		credentials: true,
	}),
);
const upload = multer();

// Read OpenAI API key from environment variables
const OPENAI_API_KEY =
	process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || null;
if (!OPENAI_API_KEY) {
	console.warn(
		"Warning: OPENAI_API_KEY is not set. Transcription to OpenAI will fail with 401.",
	);
}

// Transcription endpoint
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
	try {
		if (!req.file || !req.file.buffer) {
			return res.status(400).json({ error: "No audio file provided" });
		}

		const audioBuffer = req.file.buffer;

		const form = new FormData();
		form.append("file", audioBuffer, {
			filename: req.file.originalname || "audio.webm",
			contentType: req.file.mimetype || "audio/webm",
			knownLength: audioBuffer.length,
		});
		form.append("model", "whisper-1");
		form.append("language", "en");

		const headers = Object.assign({}, form.getHeaders());
		if (OPENAI_API_KEY) headers["Authorization"] = `Bearer ${OPENAI_API_KEY}`;

		// Retry helper for transient 429 errors
		const wait = (ms) => new Promise((r) => setTimeout(r, ms));
		const postWithRetries = async (attempts = 3) => {
			try {
				return await axios.post(
					"https://api.openai.com/v1/audio/transcriptions",
					form,
					{
						headers,
						maxBodyLength: Infinity,
						maxContentLength: Infinity,
					},
				);
			} catch (err) {
				const errType = err?.response?.data?.error?.type;
				if (errType === "insufficient_quota") {
					const e = new Error("insufficient_quota");
					e.code = "INSUFFICIENT_QUOTA";
					throw e;
				}

				const status = err?.response?.status;
				if (status === 429 && attempts > 1) {
					const backoff = 500 * Math.pow(2, 3 - attempts); // 500ms, 1000ms, ...
					await wait(backoff);
					return postWithRetries(attempts - 1);
				}

				throw err;
			}
		};

		const response = await postWithRetries(3);

		return res.json({ text: response.data.text, raw: response.data });
	} catch (error) {
		if (error.code === "INSUFFICIENT_QUOTA") {
			console.error(
				"Transcription failed: insufficient quota for OpenAI account.",
			);
			return res.status(402).json({
				error: "Insufficient quota: please check your OpenAI plan and billing.",
			});
		}

		if (error.response) {
			console.error("Transcription error response data:", error.response.data);
			console.error(
				"Transcription error status:",
				error.response.status,
				error.response.statusText,
			);
			return res
				.status(error.response.status || 500)
				.json({ error: error.response.data });
		}

		console.error("Transcription error:", error.message || error);
		return res.status(500).json({ error: "Transcription failed" });
	}
});

// Bible search endpoint (example)

// Use World English Bible (public domain) with KJV as fallback
const BIBLE_ID = "9879dbb7cfe39e4d-04"; // WEB (World English Bible)
const FALLBACK_BIBLE_ID = "de4e12af7f28f599-02"; // KJV (fallback if WEB fails)
const API_BASE = "https://api.scripture.api.bible/v1";

function isReference(query) {
	return /\b\d?\s?[A-Za-z]+\s+\d+:\d+\b/.test(query);
}

app.get("/api/bible-search", async (req, res) => {
	const query = String(req.query.q || "");

	if (!query || !query.trim()) {
		return res.status(400).json({
			error: "Query parameter 'q' is required",
			tip: "Try a reference like 'John 3:16' or a keyword like 'love'",
		});
	}

	const tryBibleSearch = async (
		bibleId,
		scriptureKey = process.env.YOUR_SCRIPTURE_API_KEY,
	) => {
		try {
			const url = `${API_BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(
				query,
			)}`;
			const response = await axios.get(url, {
				headers: {
					"api-key": scriptureKey,
					Accept: "application/json",
				},
			});

			if (!response.data?.data?.verses?.length) {
				return { verses: [] };
			}

			return {
				verses: response.data.data.verses.map((verse) => ({
					id: verse.id,
					reference: verse.reference,
					text: (verse.text || "").replace(/<[^>]+>/g, ""), // strip HTML
					translation: bibleId === BIBLE_ID ? "WEB" : "KJV",
				})),
			};
		} catch (err) {
			return { error: err };
		}
	};

	try {
		// Try World English Bible first (public domain)
		let result = await tryBibleSearch(BIBLE_ID);

		// If WEB fails or returns no results, try KJV as fallback
		if (result.error || !result.verses.length) {
			const fallbackResult = await tryBibleSearch(FALLBACK_BIBLE_ID);
			if (!fallbackResult.error) {
				result = fallbackResult;
			}
		}

		if (result.error) {
			const status = result.error.response?.status;
			if (status === 401 || status === 403) {
				return res.status(status).json({
					error:
						"Bible API authentication failed. Using fallback offline search.",
					tip: "The app will continue working with limited functionality.",
				});
			}
			throw result.error;
		}

		// Add search metadata
		const response = {
			query,
			totalResults: result.verses.length,
			verses: result.verses,
		};

		if (result.verses.length === 0) {
			response.suggestion =
				"Try different keywords or check the reference format (e.g., 'John 3:16')";
		}

		res.json(response);
	} catch (error) {
		console.error(
			"Bible search error:",
			error?.response?.data || error?.message || error,
		);
		res.status(500).json({
			error: "Bible search failed",
			details: error?.response?.data?.message || error?.message,
			suggestion: "Please try again in a few moments",
		});
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
