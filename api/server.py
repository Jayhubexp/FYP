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
    'revelation': 'Revelation', 'rev': 'Revelation' # Corrected from "Revelation of John"
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

    try:
        # Save the received audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            audio_file.save(tmp.name)
            audio_path = tmp.name

        # Transcribe the audio file using the pre-loaded Whisper model
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
        if 'audio_path' in locals() and os.path.exists(audio_path):
            os.remove(audio_path)

    # After transcribing, immediately search for verses using our central function.
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

# #!/usr/bin/env python3
# """
# Bible Echo - Python Backend Server (Corrected Version)
# Uses OpenAI Whisper (local) for speech transcription and Bible API for verse lookup
# """

# import os
# import io
# import re
# import json
# import logging
# from typing import List, Dict, Optional, Any
# from datetime import datetime
# import threading

# import numpy as np
# import tempfile
# import whisper
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import requests
# import sqlite3
# import mimetypes
# from dotenv import load_dotenv
# from werkzeug.utils import secure_filename
# import subprocess
# import json as _json

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = Flask(__name__)
# load_dotenv()

# # --- CORS Configuration ---
# CORS(app, resources={r"/api/*": {"origins": [
#     "http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5000", 
#     "file://", "null", "*",
# ]}}, supports_credentials=True)

# # --- Global Variables ---
# whisper_model = None
# hf_client = None
# last_transcription: Dict[str, Any] = {}
# last_transcription_lock = threading.Lock()
# PRELOAD_WHISPER = os.getenv("PRELOAD_WHISPER", "false").lower() in ("1", "true", "yes")

# def initialize_hf_client() -> bool:
#     """Initialize Hugging Face InferenceClient (fal-ai provider) if HF token present."""
#     global hf_client
#     if hf_client is not None:
#         return True
#     token = os.getenv("HUGGINGFACE_API_TOKEN")
#     if not token:
#         return False
#     try:
#         from huggingface_hub import InferenceClient
#         hf_client = InferenceClient(provider="fal-ai", api_key=token)
#         logger.info("Hugging Face InferenceClient initialized (provider=fal-ai)")
#         return True
#     except Exception as e:
#         logger.error(f"Failed to initialize Hugging Face InferenceClient: {e}")
#         hf_client = None
#         return False

# def transcribe_with_hf(audio_path: str, model: str = "openai/whisper-large-v3") -> Optional[str]:
#     """Use HF InferenceClient to transcribe a local audio file. Returns text or None."""
#     if not initialize_hf_client():
#         return None
#     try:
#         # The InferenceClient provides automatic_speech_recognition according to examples
#         out = hf_client.automatic_speech_recognition(audio_path, model=model)
#         # Output may be dict-like with 'text'
#         if isinstance(out, dict):
#             return out.get("text") or out.get("transcription") or _json.dumps(out)
#         return str(out)
#     except Exception as e:
#         logger.error(f"Hugging Face inference failed: {e}")
#         return None

# def initialize_whisper_model(model_name: str = "large-v3") -> bool:
#     """Load the OpenAI Whisper model (returns True on success)."""
#     global whisper_model
#     if whisper_model is not None:
#         return True
#     try:
#         logger.info(f"Loading whisper model '{model_name}' (this may take a while)...")
#         whisper_model = whisper.load_model(model_name)
#         logger.info("Whisper model loaded")
#         return True
#     except Exception as e:
#         logger.error(f"Failed to load whisper model '{model_name}': {e}")
#         whisper_model = None
#         return False

# # --- Bible Book Definitions (Canonical Names) ---
# # The keys are all lowercase for easy matching. The values are the exact names used in the database.
# BIBLE_BOOKS = {
#     'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers': 'Numbers',
#     'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua', 'judges': 'Judges', 'ruth': 'Ruth',
#     '1 samuel': '1 Samuel', '2 samuel': '2 Samuel', '1 kings': '1 Kings', '2 kings': '2 Kings',
#     '1 chronicles': '1 Chronicles', '2 chronicles': '2 Chronicles', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah',
#     'esther': 'Esther', 'job': 'Job', 'psalms': 'Psalms', 'proverbs': 'Proverbs',
#     'ecclesiastes': 'Ecclesiastes', 'song of solomon': 'Song of Solomon', 'isaiah': 'Isaiah',
#     'jeremiah': 'Jeremiah', 'lamentations': 'Lamentations', 'ezekiel': 'Ezekiel', 'daniel': 'Daniel',
#     'hosea': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obadiah': 'Obadiah', 'jonah': 'Jonah',
#     'micah': 'Micah', 'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
#     'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi', 'matthew': 'Matthew',
#     'mark': 'Mark', 'luke': 'Luke', 'john': 'John', 'acts': 'Acts', 'romans': 'Romans',
#     '1 corinthians': '1 Corinthians', '2 corinthians': '2 Corinthians', 'galatians': 'Galatians',
#     'ephesians': 'Ephesians', 'philippians': 'Philippians', 'colossians': 'Colossians',
#     '1 thessalonians': '1 Thessalonians', '2 thessalonians': '2 Thessalonians', '1 timothy': '1 Timothy',
#     '2 timothy': '2 Timothy', 'titus': 'Titus', 'philemon': 'Philemon', 'hebrews': 'Hebrews',
#     'james': 'James', '1 peter': '1 Peter', '2 peter': '2 Peter', '1 john': '1 John',
#     '2 john': '2 John', '3 john': '3 John', 'jude': 'Jude', 'revelation': 'Revelation of John'
# }
# # Create a reverse mapping for easier lookup
# CANONICAL_BIBLE_BOOKS = {k: v for k, v in BIBLE_BOOKS.items()}
# # Add common abbreviations
# CANONICAL_BIBLE_BOOKS.update({
#     'gen': 'Genesis', 'ex': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
#     'josh': 'Joshua', 'judg': 'Judges', '1 sam': '1 Samuel', '2 sam': '2 Samuel', '1 kgs': '1 Kings',
#     '2 kgs': '2 Kings', '1 chr': '1 Chronicles', '2 chr': '2 Chronicles', 'neh': 'Nehemiah',
#     'ps': 'Psalms', 'prov': 'Proverbs', 'eccl': 'Ecclesiastes', 'song': 'Song of Solomon',
#     'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
#     'hos': 'Hosea', 'mic': 'Micah', 'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah',
#     'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi', 'matt': 'Matthew', 'mk': 'Mark',
#     'lk': 'Luke', 'jn': 'John', 'rom': 'Romans', '1 cor': '1 Corinthians', '2 cor': '2 Corinthians',
#     'gal': 'Galatians', 'eph': 'Ephesians', 'phil': 'Philippians', 'col': 'Colossians',
#     '1 thess': '1 Thessalonians', '2 thess': '2 Thessalonians', '1 tim': '1 Timothy', '2 tim': '2 Timothy',
#     'tit': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James', '1 pet': '1 Peter',
#     '2 pet': '2 Peter', '1 jn': '1 John', '2 jn': '2 John', '3 jn': '3 John', 'rev': 'Revelation of John'
# })

# def get_db_connection():
#     """Establishes a connection to the SQLite database."""
#     base_dir = os.path.dirname(os.path.abspath(__file__))
#     db_path = os.path.join(base_dir, '..', 'src', 'data', 'bible.db')
#     if not os.path.exists(db_path):
#         logging.error(f"FATAL: bible.db not found at {db_path}")
#         return None
#     conn = sqlite3.connect(db_path)
#     conn.row_factory = sqlite3.Row
#     return conn

# def parse_bible_reference(text: str) -> List[Dict[str, Any]]:
#     """
#     Improved parsing for Bible references.
#     Handles formats like "John 3:16", "John3:16", "1 John 2:5", "1John2:5".
#     """
#     references = []
#     # Normalize text for easier parsing
#     text_lower = text.lower().strip()
    
#     # Generate a regex pattern from the book names to ensure we match valid books
#     # Sort by length descending to match "1 John" before "John"
#     book_keys = sorted(CANONICAL_BIBLE_BOOKS.keys(), key=len, reverse=True)
#     book_pattern = '|'.join(re.escape(k) for k in book_keys)

#     # Regex explanation:
#     # (book_pattern)  - Group 1: Matches any of the defined book names or abbreviations.
#     # \s* - Matches zero or more whitespace characters (the crucial fix).
#     # (\d+)           - Group 2: The chapter number.
#     # (?:[:\s](\d+))? - Group 3 (optional): A non-capturing group for verse, requires a separator (colon or space).
#     # (?:[-–](\d+))?  - Group 4 (optional): A non-capturing group for an end verse.
#     pattern = re.compile(rf'({book_pattern})\s*(\d+)(?:[:\s](\d+))?(?:[-–](\d+))?', re.IGNORECASE)

#     for match in pattern.finditer(text_lower):
#         book_input = match.group(1)
#         chapter = match.group(2)
#         verse_start = match.group(3)
#         verse_end = match.group(4)

#         canonical_book = CANONICAL_BIBLE_BOOKS.get(book_input)
#         if canonical_book:
#             ref_str = f"{canonical_book} {chapter}"
#             if verse_start:
#                 ref_str += f":{verse_start}"
#             if verse_end:
#                 ref_str += f"-{verse_end}"

#             references.append({
#                 'book': canonical_book,
#                 'chapter': int(chapter),
#                 'verse_start': int(verse_start) if verse_start else None,
#                 'verse_end': int(verse_end) if verse_end else None,
#                 'reference': ref_str,
#                 'confidence': 0.9
#             })
            
#     return references


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



# def fetch_bible_verse(reference: str) -> Optional[Dict[str, Any]]:
#     """Fetch a verse or passage from the local SQLite bible.db."""
#     conn = get_db_connection()
#     if not conn:
#         return None

#     try:
#         # Use our robust parser to destructure the reference string
#         parsed_refs = parse_bible_reference(reference)
#         if not parsed_refs:
#             return None # Not a valid reference format

#         ref = parsed_refs[0] # Use the first valid reference found
#         book, chapter, verse_start, verse_end = ref['book'], ref['chapter'], ref['verse_start'], ref['verse_end']
        
#         # Use the correct Bible version from your database
#         version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV66')

#         cursor = conn.cursor()
#         query = "SELECT text, book, chapter, verse FROM bible WHERE version=? AND book=? AND chapter=?"
#         params = [version, book, chapter]

#         if verse_start and verse_end:
#             query += " AND verse BETWEEN ? AND ?"
#             params.extend([verse_start, verse_end])
#         elif verse_start:
#             query += " AND verse = ?"
#             params.append(verse_start)
        
#         query += " ORDER BY verse"
#         cursor.execute(query, tuple(params))
#         rows = cursor.fetchall()

#         if not rows:
#             return None

#         text = ' '.join([f"[{r['verse']}] {r['text']}" for r in rows])
#         return {
#             'id': f"bible-{hash(reference)}",
#             'reference': ref['reference'],
#             'book': book,
#             'chapter': chapter,
#             'text': text.strip(),
#             'translation': version,
#         }
#     except Exception as e:
#         logger.error(f"Error fetching Bible verse from DB for '{reference}': {e}")
#         return None
#     finally:
#         if conn:
#             conn.close()


# def find_verses_for_text(text: str) -> Dict[str, Any]:
#     """
#     Given arbitrary text (transcription or query) return a dictionary with
#     'verses' (list) and optional 'suggestion'. Reuses parse_bible_reference
#     and performs a full-text search against the local bible.db.
#     """
#     verses = []
#     suggestion = None
#     version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV66')

#     # 1. Try to parse explicit references first (e.g., "John 3:16")
#     bible_refs = parse_bible_reference(text)
#     if bible_refs:
#         for ref in bible_refs:
#             verse_data = fetch_bible_verse(ref['reference'])
#             if verse_data:
#                 verse_data['confidence'] = ref.get('confidence', 0.8)
#                 verses.append(verse_data)
#         return {'verses': verses}

#     # 2. If no explicit reference, perform a keyword search in the database
#     base_dir = os.path.dirname(__file__)
#     db_path = os.path.normpath(os.path.join(base_dir, '..', 'src', 'data', 'bible.db'))
    
#     if os.path.exists(db_path):
#         try:
#             conn = sqlite3.connect(db_path)
#             cursor = conn.cursor()
#             # Perform a LIKE search against the 'text' column
#             cursor.execute(
#                 "SELECT book, chapter, verse, text FROM bible WHERE version=? AND text LIKE ? LIMIT 10",
#                 (version, f"%{text}%"),
#             )
#             rows = cursor.fetchall()
#             conn.close()
            
#             for r in rows:
#                 verses.append({
#                     'id': f"bible-{hash(f'{r[0]} {r[1]}:{r[2]}')}",
#                     'reference': f"{r[0]} {r[1]}:{r[2]}",
#                     'book': r[0],
#                     'chapter': r[1],
#                     'verse': r[2],
#                     'text': r[3],
#                     'translation': version,
#                     'confidence': 0.6 # Confidence for a text search result
#                 })
#         except Exception as e:
#             logger.error(f"Database search in find_verses_for_text failed: {e}")

#     # 3. If still no verses are found, provide a suggestion
#     if not verses:
#         suggestion = 'Try a specific reference like "John 3:16" or "Psalm 23"'

#     return {'verses': verses, 'suggestion': suggestion}

# # --- API Endpoints ---

# @app.route('/api/transcribe', methods=['POST'])
# def transcribe_audio():
#     """Transcribe audio using the Hugging Face hosted Whisper model."""
#     if 'audio' not in request.files:
#         return jsonify({'error': 'No audio file provided'}), 400

#     audio_file = request.files['audio']
#     if audio_file.filename == '':
#         return jsonify({'error': 'No audio file selected'}), 400

#     audio_bytes = audio_file.read()

#     # Save uploaded audio to temp file
#     tmp_path = None
#     converted = None
#     try:
#         suffix = os.path.splitext(audio_file.filename)[1] or ".webm"
#         with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmpf:
#             tmpf.write(audio_bytes)
#             tmp_path = tmpf.name

#         # Convert to WAV for compatibility
#         converted = convert_to_wav(tmp_path)
#         input_for_model = converted or tmp_path

#         # Try Hugging Face inference first (fal-ai provider)
#         hf_text = transcribe_with_hf(input_for_model, model="openai/whisper-large-v3")
#         if hf_text:
#             transcribed_text = hf_text.strip()
#             raw = {"provider": "huggingface"}
#             logger.info("Transcribed using Hugging Face InferenceClient")
#         else:
#             # Fallback to local whisper
#             if not initialize_whisper_model():
#                 return jsonify({'error': 'No available transcription method (HF failed and local whisper failed to load)'}), 500
#             result = whisper_model.transcribe(input_for_model)
#             transcribed_text = (result.get('text') or '').strip()
#             raw = result

#     except Exception as e:
#         logger.exception(f"Transcription failed: {e}")
#         return jsonify({'error': 'Transcription failed', 'details': str(e)}), 500
#     finally:
#         try:
#             if tmp_path and os.path.exists(tmp_path):
#                 os.remove(tmp_path)
#             if converted and os.path.exists(converted):
#                 os.remove(converted)
#         except Exception:
#             pass

#     # Parse simple references and also fetch full verse data where possible
#     bible_refs = parse_bible_reference(transcribed_text)
#     verses_result = find_verses_for_text(transcribed_text)

#     response_data = {
#         'text': transcribed_text,
#         'bible_references': bible_refs,
#         'verses': verses_result.get('verses', []),
#         'suggestion': verses_result.get('suggestion'),
#         'raw': raw
#     }

#     # Store last transcription for clients that poll or need to fetch later
#     try:
#         with last_transcription_lock:
#             last_transcription['text'] = transcribed_text
#             last_transcription['bible_references'] = bible_refs
#             last_transcription['verses'] = response_data['verses']
#             last_transcription['raw'] = raw
#             last_transcription['timestamp'] = datetime.now().isoformat()
#     except Exception:
#         pass

#     logger.info(f"Transcribed: {transcribed_text}")
#     if bible_refs:
#         logger.info(f"Found Bible references: {[ref['reference'] for ref in bible_refs]}")
#     if response_data['verses']:
#         logger.info(f"Fetched {len(response_data['verses'])} verse(s) from Bible API")

#     return jsonify(response_data)



# @app.route('/api/bible-search', methods=['GET'])
# def bible_search():
#     """
#     Handles both reference and keyword searches for Bible verses.
#     """
#     query = request.args.get('q', '').strip()
#     if not query:
#         return jsonify({'error': 'Query parameter "q" is required'}), 400

#     verses = []
    
#     # --- Step 1: Attempt to parse the query as a specific Bible reference ---
#     parsed_refs = parse_bible_reference(query)
    
#     if parsed_refs:
#         # It's a reference, so fetch the specific verse(s).
#         ref = parsed_refs[0]  # Use the first valid match
#         conn = get_db_connection()
#         if conn:
#             try:
#                 cursor = conn.cursor()
#                 # Use 'KJV' consistently, as the database was rebuilt with this version key.
#                 version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV')
                
#                 sql = "SELECT * FROM bible WHERE version=? AND book=? AND chapter=?"
#                 params = [version, ref['book'], ref['chapter']]

#                 vs_start = ref.get('verse_start')
#                 vs_end = ref.get('verse_end')

#                 if vs_start and vs_end and vs_start != vs_end:
#                     sql += " AND verse BETWEEN ? AND ?"
#                     params.extend([vs_start, vs_end])
#                 elif vs_start:
#                     sql += " AND verse = ?"
#                     params.append(vs_start)
                
#                 cursor.execute(sql, tuple(params))
#                 for row in cursor.fetchall():
#                     verses.append(dict(row))
#             except Exception as e:
#                 logger.error(f"Reference search for '{query}' failed: {e}")
#             finally:
#                 conn.close()

#     # --- Step 2: If no verses found by reference, perform a keyword search ---
#     # This block runs if the query wasn't a reference OR if the reference was not found.
#     if not verses:
#         conn = get_db_connection()
#         if conn:
#             try:
#                 cursor = conn.cursor()
#                 version = os.getenv('DEFAULT_BIBLE_VERSION', 'KJV')
#                 cursor.execute(
#                     "SELECT * FROM bible WHERE version=? AND text LIKE ? LIMIT 10",
#                     (version, f"%{query}%")
#                 )
#                 for row in cursor.fetchall():
#                     verses.append(dict(row))
#             except Exception as e:
#                 logger.error(f"Keyword search for '{query}' failed: {e}")
#             finally:
#                 conn.close()

#     response = {'query': query, 'totalResults': len(verses), 'verses': verses}
#     if not verses:
#         response['suggestion'] = 'No results found. Try a specific reference like "John 3:16" or a keyword.'
        
#     return jsonify(response)


# # All other functions (transcription, health check, etc.) remain the same.
# # Make sure to copy them from your original file into this one.
# # For brevity, I am omitting them here, but you MUST include them for the server to work.

# @app.route('/health', methods=['GET'])
# def health_check():
#     """Health check endpoint"""
#     return jsonify({
#         'status': 'healthy',
#     'whisper_available': bool(whisper_model is not None),
#         'timestamp': datetime.now().isoformat()
#     })


# if __name__ == '__main__':
#     logger.info("Starting Bible Echo Python Backend (Corrected Version)...")
#     port = int(os.environ.get('PORT', 5000))
#     if PRELOAD_WHISPER:
#         initialize_whisper_model()
#     logger.info(f"Server starting on port {port}")
#     app.run(host='0.0.0.0', port=port, debug=False)

