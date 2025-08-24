# Bible Echo Python Backend

This is the Python backend server for Bible Echo that uses OpenAI's Whisper model locally for speech transcription and integrates with Bible APIs for verse lookup.

## Features

- **Local Whisper Transcription**: Uses OpenAI's whisper-small model locally (no API keys required)
- **Bible Reference Detection**: Rule-based parsing to detect Bible references from speech
- **Bible API Integration**: Fetches verses from Bible API (bible-api.com)
- **GPU Support**: Automatically uses GPU if available for faster transcription

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. First run will download the Whisper model (about 244MB):

```bash
python server.py
```

### GPU Support (Optional but Recommended)

For faster transcription, install PyTorch with CUDA support:

```bash
# For CUDA 11.8
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Usage

### Start the Server

```bash
python server.py
```

The server will start on `http://localhost:5000` by default.

### API Endpoints

#### POST /api/transcribe

Transcribe audio using local Whisper model.

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: audio file (webm, wav, mp3, etc.)

**Response:**

```json
{
  "text": "transcribed text",
  "bible_references": [
    {
      "book": "John",
      "chapter": 3,
      "verse_start": 16,
      "reference": "John 3:16",
      "confidence": 0.9
    }
  ],
  "raw": { ... }
}
```

#### GET /api/bible-search

Search for Bible verses.

**Request:**

- Method: GET
- Query parameter: `q` (search query or reference)

**Response:**

```json
{
	"query": "John 3:16",
	"totalResults": 1,
	"verses": [
		{
			"id": "bible-123456",
			"reference": "John 3:16",
			"book": "John",
			"chapter": 3,
			"verse": 16,
			"text": "For God so loved the world...",
			"translation": "KJV"
		}
	]
}
```

#### GET /health

Health check endpoint.

## Bible Reference Detection

The server uses a rule-based approach to detect Bible references from transcribed speech:

1. **Trigger Phrases**: Looks for phrases like "in the book of", "turn to", "scripture says", etc.
2. **Book Recognition**: Matches against a comprehensive list of Bible book names and abbreviations
3. **Reference Parsing**: Extracts chapter and verse numbers using regex patterns
4. **Confidence Scoring**: Assigns confidence scores based on context

## Supported Bible Books

The server recognizes all 66 books of the Bible with common abbreviations:

- Old Testament: Genesis (Gen), Exodus (Ex), Psalms (Ps), etc.
- New Testament: Matthew (Matt), John, Romans (Rom), etc.

## Configuration

Environment variables:

- `PORT`: Server port (default: 5000)

## Troubleshooting

### Common Issues

1. **Model Download Fails**: Ensure stable internet connection for first run
2. **Audio Format Errors**: Server accepts most audio formats (webm, wav, mp3, m4a)
3. **GPU Not Detected**: Install PyTorch with CUDA support for GPU acceleration
4. **Memory Issues**: whisper-small requires ~1GB RAM, use whisper-tiny for lower memory usage

### Performance Tips

- Use GPU for 3-5x faster transcription
- Process audio in chunks for real-time performance
- Consider whisper-base for better accuracy (larger model)

## License

This project uses the MIT License.
