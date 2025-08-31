#!/usr/bin/env python3
"""
Bible Echo - Python Backend Server (FINAL AUTOMATED Version)
"""

import os
import re
import logging
import sqlite3
import subprocess
import tempfile
from typing import List, Dict, Optional
from datetime import datetime
import whisper # Ensure you have the whisper library installed
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Basic Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = Flask(__name__)
load_dotenv()
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- Global Whisper Model ---
# This ensures the model is loaded only once for efficiency
whisper_model = None

def initialize_whisper_model(model_name: str = "tiny.en"): # Change "base" to "tiny.en"
    """Load the OpenAI Whisper model (returns True on success)."""
    global whisper_model
    if whisper_model is not None:
        return True
    try:
        logger.info(f"Loading whisper model '{model_name}' (this may take a while)...")
        whisper_model = whisper.load_model(model_name)
        logger.info("Whisper model loaded successfully.")
        return True
    except Exception as e:
        logger.error(f"Failed to load whisper model '{model_name}': {e}")
        whisper_model = None
        return False

# --- Bible Book Definitions for Parsing ---
CANONICAL_BIBLE_BOOKS = {
    'genesis': 'Genesis', 'gen': 'Genesis', 'exodus': 'Exodus', 'ex': 'Exodus',
    'leviticus': 'Leviticus', 'lev': 'Leviticus', 'numbers': 'Numbers', 'num': 'Numbers',
    'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'joshua': 'Joshua', 'josh': 'Joshua',
    'judges': 'Judges', 'judg': 'Judges', 'ruth': 'Ruth', '1 samuel': '1 Samuel',
    '1 sam': '1 Samuel', '2 samuel': '2 Samuel', '2 sam': '2 Samuel', '1 kings': '1 Kings',
    '1 kgs': '1 Kings', '2 kings': '2 Kings', '2 kgs': '2 Kings', '1 chronicles': '1 Chronicles',
    '1 chr': '1 Chronicles', '2 chronicles': '2 Chronicles', '2 chr': '2 Chronicles',
    'ezra': 'Ezra', 'nehemiah': 'Nehemiah', 'neh': 'Nehemiah', 'esther': 'Esther', 'job': 'Job',
    'psalms': 'Psalms', 'ps': 'Psalms', 'proverbs': 'Proverbs', 'prov': 'Proverbs',
    'ecclesiastes': 'Ecclesiastes', 'eccl': 'Ecclesiastes', 'song of solomon': 'Song of Solomon',
    'song': 'Song of Solomon', 'isaiah': 'Isaiah', 'isa': 'Isaiah', 'jeremiah': 'Jeremiah',
    'jer': 'Jeremiah', 'lamentations': 'Lamentations', 'lam': 'Lamentations',
    'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel', 'daniel': 'Daniel', 'dan': 'Daniel',
    'hosea': 'Hosea', 'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obadiah': 'Obadiah',
    'jonah': 'Jonah', 'micah': 'Micah', 'mic': 'Micah', 'nahum': 'Nahum', 'habakkuk': 'Habakkuk',
    'hab': 'Habakkuk', 'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah', 'haggai': 'Haggai',
    'hag': 'Haggai', 'zechariah': 'Zechariah', 'zech': 'Zechariah', 'malachi': 'Malachi',
    'mal': 'Malachi', 'matthew': 'Matthew', 'matt': 'Matthew', 'mark': 'Mark', 'mk': 'Mark',
    'luke': 'Luke', 'lk': 'Luke', 'john': 'John', 'jn': 'John', 'acts': 'Acts',
    'romans': 'Romans', 'rom': 'Romans', '1 corinthians': '1 Corinthians', '1 cor': '1 Corinthians',
    '2 corinthians': '2 Corinthians', '2 cor': '2 Corinthians', 'galatians': 'Galatians',
    'gal': 'Galatians', 'ephesians': 'Ephesians', 'eph': 'Ephesians', 'philippians': 'Philippians',
    'phil': 'Philippians', 'colossians': 'Colossians', 'col': 'Colossians',
    '1 thessalonians': '1 Thessalonians', '1 thess': '1 Thessalonians',
    '2 thessalonians': '2 Thessalonians', '2 thess': '2 Thessalonians',
    '1 timothy': '1 Timothy', '1 tim': '1 Timothy', '2 timothy': '2 Timothy',
    '2 tim': '2 Timothy', 'titus': 'Titus', 'tit': 'Titus', 'philemon': 'Philemon',
    'phlm': 'Philemon', 'hebrews': 'Hebrews', 'heb': 'Hebrews', 'james': 'James',
    'jas': 'James', '1 peter': '1 Peter', '1 pet': '1 Peter', '2 peter': '2 Peter',
    '2 pet': '2 Peter', '1 john': '1 John', '1 jn': '1 John', '2 john': '2 John',
    '2 jn': '2 John', '3 john': '3 John', '3 jn': '3 John', 'jude': 'Jude',
    'revelation': 'Revelation of John', 'rev': 'Revelation of John' # Corrected from "Revelation of John"
}

# --- Helper Functions ---
def get_db_connection():
    """Establishes a connection to the SQLite database."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, '..', 'src', 'data', 'bible.db')
    if not os.path.exists(db_path):
        logger.error(f"FATAL: bible.db not found at {db_path}")
        return None
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def parse_bible_reference(text: str) -> List[Dict[str, any]]:
    """Robustly parses Bible references from text."""
    references = []
    text_lower = text.lower().strip().replace(" verse ", ":")
    book_keys = sorted(CANONICAL_BIBLE_BOOKS.keys(), key=len, reverse=True)
    book_pattern = '|'.join(re.escape(k) for k in book_keys)
    pattern = re.compile(rf'({book_pattern})\s*(\d+)(?::(\d+))?(?:[-–](\d+))?', re.IGNORECASE)

    for match in pattern.finditer(text_lower):
        book_input, chapter, verse_start, verse_end = match.groups()
        canonical_book = CANONICAL_BIBLE_BOOKS.get(book_input)
        if canonical_book:
            ref_str = f"{canonical_book} {chapter}"
            if verse_start:
                ref_str += f":{verse_start}"
            if verse_end:
                ref_str += f"-{verse_end}"
            references.append({
                'book': canonical_book,
                'chapter': int(chapter),
                'verse_start': int(verse_start) if verse_start else None,
                'verse_end': int(verse_end) if verse_end else (int(verse_start) if verse_start else None),
                'reference': ref_str,
            })
    return references

def search_verses_in_db(query: str) -> List[Dict[str, any]]:
    """A single, unified function to search the database by reference or keyword."""
    verses = []
    
    # First, try to parse as a specific reference
    parsed_refs = parse_bible_reference(query)
    if parsed_refs:
        ref = parsed_refs[0]
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV') # Use KJV consistently
                sql = "SELECT * FROM bible WHERE version=? AND book=? AND chapter=?"
                params = [version, ref['book'], ref['chapter']]
                vs_start, vs_end = ref.get('verse_start'), ref.get('verse_end')
                if vs_start and vs_end and vs_start != vs_end:
                    sql += " AND verse BETWEEN ? AND ?"
                    params.extend([vs_start, vs_end])
                elif vs_start:
                    sql += " AND verse = ?"
                    params.append(vs_start)
                cursor.execute(sql, tuple(params))
                for row in cursor.fetchall():
                    verses.append(dict(row))
            finally:
                conn.close()

    # If no verses were found by reference, perform a keyword search
    if not verses:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV')
                cursor.execute(
                    "SELECT * FROM bible WHERE version=? AND text LIKE ? LIMIT 10",
                    (version, f"%{query}%")
                )
                for row in cursor.fetchall():
                    verses.append(dict(row))
            finally:
                conn.close()
    return verses

# --- API Endpoints ---
@app.route('/api/bible-search', methods=['GET'])
def bible_search_endpoint():
    """Endpoint for manual text searches from the UI."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Query parameter "q" is required'}), 400
    
    verses = search_verses_in_db(query)
    
    response = {'query': query, 'totalResults': len(verses), 'verses': verses}
    if not verses:
        response['suggestion'] = 'No results found. Try a specific reference like "John 3:16" or a keyword.'
        
    return jsonify(response)

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio_endpoint():
    """
    Endpoint for transcribing audio and then immediately searching for verses.
    This is the core of the automated workflow.
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    transcribed_text = ""
    raw_transcription_data = {}
    
    # Define audio_path outside the try block to ensure it's accessible in finally
    audio_path = None 
    
    try:
        # Save the received audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            audio_file.save(tmp.name)
            audio_path = tmp.name

        # --- THIS IS THE ONLY FIX YOU NEED ---
        # Check the file size before transcription to prevent crashes from empty files.
        if os.path.getsize(audio_path) < 1024: # Check if file is less than 1KB
            logger.warning(f"Received an empty or very small audio file. Skipping transcription.")
            return jsonify({
                'text': '',
                'verses': [],
                'raw': {},
                'info': 'No audio detected in the recording.'
            })
        # --- END OF FIX ---

        # Transcribe the original audio file directly. Whisper will handle the conversion.
        if whisper_model:
            result = whisper_model.transcribe(audio_path)
            transcribed_text = result.get('text', '').strip()
            raw_transcription_data = result
            logger.info(f"Transcribed: '{transcribed_text}'")
        else:
            logger.error("Whisper model not loaded. Cannot transcribe.")
            raise Exception("Whisper model not available")

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return jsonify({'error': 'Transcription failed'}), 500
    finally:
        # Clean up the temporary file
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)

    # After transcribing, immediately search for verses.
    verses = search_verses_in_db(transcribed_text)
    
    response_data = {
        'text': transcribed_text,
        'verses': verses,
        'raw': raw_transcription_data,
    }
    
    return jsonify(response_data)

# --- Health Check and Main Execution ---
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Initialize the Whisper model on startup
    initialize_whisper_model()
    
    port = int(os.environ.get('PORT', 5000))
    logger.info(f" Starting Final Automated Bible Server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)



# def convert_to_wav(input_path: str) -> Optional[str]:
#     """Convert an audio file to WAV using ffmpeg. Returns path to converted file or None on failure."""
#     try:
#         base, _ = os.path.splitext(input_path)
#         out_path = f"{base}.converted.wav"
#         # Run ffmpeg to convert to 16k WAV PCM which models accept well
#         cmd = [
#             "ffmpeg",
#             "-y",
#             "-i",
#             input_path,
#             "-ar",
#             "16000",
#             "-ac",
#             "1",
#             "-c:a",
#             "pcm_s16le",
#             out_path,
#         ]
#         subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
#         return out_path
#     except Exception as e:
#         logger.warning(f"ffmpeg conversion failed or ffmpeg not available: {e}")
#         return None





