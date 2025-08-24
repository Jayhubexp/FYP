#!/usr/bin/env python3
"""
Bible Echo - Python Backend Server
Uses OpenAI Whisper (local) for speech transcription and Bible API for verse lookup
"""

import os
import io
import re
import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

import numpy as np
import tempfile
from transformers import pipeline
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import mimetypes
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load environment variables from .env (if present)
load_dotenv()

# CORS configuration for web and Electron
CORS(app, origins=[
    "http://localhost:5173",
    "file://",
    # Add more origins if needed
], supports_credentials=True)

HUGGINGFACE_API_TOKEN = os.environ.get("HUGGINGFACE_API_TOKEN")
HF_WHISPER_MODEL = "https://api-inference.huggingface.co/models/openai/whisper-small"

# Local pipeline (lazy) fallback
local_whisper_pipe = None

def initialize_local_whisper():
    """Initialize local Whisper pipeline using transformers.pipeline.
    Returns True on success, False otherwise."""
    global local_whisper_pipe
    if local_whisper_pipe is not None:
        return True
    try:
        # Use GPU if available
        import torch as _torch
        device = 0 if _torch.cuda.is_available() else -1
    except Exception:
        device = -1

    try:
        logger.info(f"Initializing local Whisper pipeline on device {device}")
        local_whisper_pipe = pipeline("automatic-speech-recognition", model="openai/whisper-small", device=device)
        logger.info("Local Whisper pipeline initialized")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize local Whisper pipeline: {e}")
        local_whisper_pipe = None
        return False

# Bible books mapping for better recognition
BIBLE_BOOKS = {
    # Old Testament
    'genesis': 'Genesis', 'gen': 'Genesis',
    'exodus': 'Exodus', 'exo': 'Exodus', 'ex': 'Exodus',
    'leviticus': 'Leviticus', 'lev': 'Leviticus',
    'numbers': 'Numbers', 'num': 'Numbers',
    'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'dt': 'Deuteronomy',
    'joshua': 'Joshua', 'josh': 'Joshua',
    'judges': 'Judges', 'judg': 'Judges',
    'ruth': 'Ruth',
    '1 samuel': '1 Samuel', '1sam': '1 Samuel', '1 sam': '1 Samuel',
    '2 samuel': '2 Samuel', '2sam': '2 Samuel', '2 sam': '2 Samuel',
    '1 kings': '1 Kings', '1kgs': '1 Kings', '1 kgs': '1 Kings',
    '2 kings': '2 Kings', '2kgs': '2 Kings', '2 kgs': '2 Kings',
    '1 chronicles': '1 Chronicles', '1chr': '1 Chronicles', '1 chr': '1 Chronicles',
    '2 chronicles': '2 Chronicles', '2chr': '2 Chronicles', '2 chr': '2 Chronicles',
    'ezra': 'Ezra',
    'nehemiah': 'Nehemiah', 'neh': 'Nehemiah',
    'esther': 'Esther', 'est': 'Esther',
    'job': 'Job',
    'psalms': 'Psalms', 'psalm': 'Psalms', 'ps': 'Psalms', 'psa': 'Psalms',
    'proverbs': 'Proverbs', 'prov': 'Proverbs', 'pr': 'Proverbs',
    'ecclesiastes': 'Ecclesiastes', 'eccl': 'Ecclesiastes', 'ecc': 'Ecclesiastes',
    'song of solomon': 'Song of Solomon', 'song': 'Song of Solomon', 'sos': 'Song of Solomon',
    'isaiah': 'Isaiah', 'isa': 'Isaiah',
    'jeremiah': 'Jeremiah', 'jer': 'Jeremiah',
    'lamentations': 'Lamentations', 'lam': 'Lamentations',
    'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel', 'eze': 'Ezekiel',
    'daniel': 'Daniel', 'dan': 'Daniel',
    'hosea': 'Hosea', 'hos': 'Hosea',
    'joel': 'Joel',
    'amos': 'Amos',
    'obadiah': 'Obadiah', 'obad': 'Obadiah',
    'jonah': 'Jonah',
    'micah': 'Micah', 'mic': 'Micah',
    'nahum': 'Nahum', 'nah': 'Nahum',
    'habakkuk': 'Habakkuk', 'hab': 'Habakkuk',
    'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah', 'zep': 'Zephaniah',
    'haggai': 'Haggai', 'hag': 'Haggai',
    'zechariah': 'Zechariah', 'zech': 'Zechariah', 'zec': 'Zechariah',
    'malachi': 'Malachi', 'mal': 'Malachi',
    
    # New Testament
    'matthew': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
    'mark': 'Mark', 'mk': 'Mark',
    'luke': 'Luke', 'lk': 'Luke',
    'john': 'John', 'jn': 'John',
    'acts': 'Acts',
    'romans': 'Romans', 'rom': 'Romans',
    '1 corinthians': '1 Corinthians', '1cor': '1 Corinthians', '1 cor': '1 Corinthians',
    '2 corinthians': '2 Corinthians', '2cor': '2 Corinthians', '2 cor': '2 Corinthians',
    'galatians': 'Galatians', 'gal': 'Galatians',
    'ephesians': 'Ephesians', 'eph': 'Ephesians',
    'philippians': 'Philippians', 'phil': 'Philippians', 'php': 'Philippians',
    'colossians': 'Colossians', 'col': 'Colossians',
    '1 thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians', '1 thess': '1 Thessalonians',
    '2 thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians', '2 thess': '2 Thessalonians',
    '1 timothy': '1 Timothy', '1tim': '1 Timothy', '1 tim': '1 Timothy',
    '2 timothy': '2 Timothy', '2tim': '2 Timothy', '2 tim': '2 Timothy',
    'titus': 'Titus', 'tit': 'Titus',
    'philemon': 'Philemon', 'phlm': 'Philemon',
    'hebrews': 'Hebrews', 'heb': 'Hebrews',
    'james': 'James', 'jas': 'James',
    '1 peter': '1 Peter', '1pet': '1 Peter', '1 pet': '1 Peter',
    '2 peter': '2 Peter', '2pet': '2 Peter', '2 pet': '2 Peter',
    '1 john': '1 John', '1jn': '1 John', '1 jn': '1 John',
    '2 john': '2 John', '2jn': '2 John', '2 jn': '2 John',
    '3 john': '3 John', '3jn': '3 John', '3 jn': '3 John',
    'jude': 'Jude',
    'revelation': 'Revelation', 'rev': 'Revelation'
}

# No local model initialization: we prefer the Hugging Face hosted API

def parse_bible_reference(text: str) -> List[Dict[str, Any]]:
    """
    Parse Bible references from text using rule-based approach
    Returns list of potential references found
    """
    references = []
    text_lower = text.lower()
    
    # Common trigger phrases that indicate a Bible reference is coming
    trigger_phrases = [
        r'(?:in|from|turn to|look at|read|see|according to|as written in|the book of|scripture says|bible says|word says)',
        r'(?:let\'s turn to|turn your bibles to|if you look at|i\'m reading from)',
        r'(?:our passage today is|the text for today is|as we see in)',
        r'(?:jesus said in|paul writes in|david wrote in|moses said in)'
    ]
    
    # Pattern to match Bible references: Book Chapter:Verse or Book Chapter Verse
    # Examples: "John 3:16", "1 Corinthians 13:4-7", "Psalm 23", "Matthew 5:3-10"
    bible_ref_pattern = r'\b([123]?\s*[a-zA-Z]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\b'
    
    # First, try to find references after trigger phrases
    for trigger in trigger_phrases:
        trigger_match = re.search(trigger, text_lower)
        if trigger_match:
            # Look for Bible reference after the trigger
            remaining_text = text[trigger_match.end():]
            matches = re.finditer(bible_ref_pattern, remaining_text, re.IGNORECASE)
            
            for match in matches:
                book_candidate = match.group(1).strip().lower()
                chapter = match.group(2)
                verse_start = match.group(3)
                verse_end = match.group(4)
                
                # Check if the book candidate matches a known Bible book
                canonical_book = None
                for key, value in BIBLE_BOOKS.items():
                    if book_candidate == key or book_candidate.replace(' ', '') == key.replace(' ', ''):
                        canonical_book = value
                        break
                
                if canonical_book:
                    ref = {
                        'book': canonical_book,
                        'chapter': int(chapter),
                        'verse_start': int(verse_start) if verse_start else None,
                        'verse_end': int(verse_end) if verse_end else None,
                        'reference': f"{canonical_book} {chapter}" + (f":{verse_start}" if verse_start else "") + (f"-{verse_end}" if verse_end else ""),
                        'confidence': 0.9  # High confidence for triggered references
                    }
                    references.append(ref)
    
    # If no triggered references found, look for standalone references
    if not references:
        matches = re.finditer(bible_ref_pattern, text, re.IGNORECASE)
        
        for match in matches:
            book_candidate = match.group(1).strip().lower()
            chapter = match.group(2)
            verse_start = match.group(3)
            verse_end = match.group(4)
            
            # Check if the book candidate matches a known Bible book
            canonical_book = None
            for key, value in BIBLE_BOOKS.items():
                if book_candidate == key or book_candidate.replace(' ', '') == key.replace(' ', ''):
                    canonical_book = value
                    break
            
            if canonical_book:
                ref = {
                    'book': canonical_book,
                    'chapter': int(chapter),
                    'verse_start': int(verse_start) if verse_start else None,
                    'verse_end': int(verse_end) if verse_end else None,
                    'reference': f"{canonical_book} {chapter}" + (f":{verse_start}" if verse_start else "") + (f"-{verse_end}" if verse_end else ""),
                    'confidence': 0.7  # Lower confidence for standalone references
                }
                references.append(ref)
    
    return references

def fetch_bible_verse(reference: str) -> Optional[Dict[str, Any]]:
    """
    Fetch Bible verse from Bible API
    Using Bible API (https://bible-api.com/) which is free and doesn't require API key
    """
    try:
        # Clean up the reference for the API
        clean_ref = reference.replace(' ', '+')
        url = f"https://bible-api.com/{clean_ref}"
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Handle both single verse and passage responses
            if 'verses' in data and data['verses']:
                # Multiple verses
                text = ' '.join([verse['text'] for verse in data['verses']])
                verse_ref = data['reference']
            else:
                # Single verse or passage
                text = data.get('text', '')
                verse_ref = data.get('reference', reference)
            
            return {
                'id': f"bible-{hash(verse_ref)}",
                'reference': verse_ref,
                'book': data.get('book_name', ''),
                'chapter': data.get('chapter', 0),
                'verse': data.get('verse', 0),
                'text': text.strip(),
                'translation': 'KJV'  # Bible API uses KJV by default
            }
            
    except requests.RequestException as e:
        logger.error(f"Error fetching Bible verse: {e}")
    except Exception as e:
        logger.error(f"Unexpected error fetching Bible verse: {e}")
    
    return None

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcribe audio using the Hugging Face hosted Whisper model."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No audio file selected'}), 400

    audio_bytes = audio_file.read()

    # First try Hugging Face inference API if token is present
    hf_used = False
    hf_result = None
    if HUGGINGFACE_API_TOKEN:
        content_type = getattr(audio_file, "mimetype", None) or mimetypes.guess_type(audio_file.filename or "")[0] or "application/octet-stream"
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}",
            "Accept": "application/json",
            "Content-Type": content_type,
        }
        try:
            hf_resp = requests.post(HF_WHISPER_MODEL, headers=headers, data=audio_bytes, timeout=120)
            if hf_resp.status_code == 200:
                hf_used = True
                hf_result = hf_resp.json()
            else:
                logger.error(f"Hugging Face error ({hf_resp.status_code}): {hf_resp.text}")
                if hf_resp.status_code == 404:
                    try:
                        probe = requests.get(HF_WHISPER_MODEL, headers={"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}, timeout=20)
                        logger.error(f"Model probe status: {probe.status_code} - {probe.text}")
                    except Exception:
                        logger.error("Model probe failed")
        except requests.RequestException as e:
            logger.error(f"Hugging Face API request failed: {e}")

    # If HF failed or no token, try local pipeline fallback
    if not hf_used:
        logger.info("Falling back to local Whisper pipeline")
        if not initialize_local_whisper():
            return jsonify({'error': 'No available transcription method (HF failed and local init failed)'}), 500

        tmp_path = None
        try:
            suffix = os.path.splitext(audio_file.filename)[1] or ".webm"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmpf:
                tmpf.write(audio_bytes)
                tmp_path = tmpf.name

            # Local pipeline can accept a file path
            local_out = local_whisper_pipe(tmp_path)
            # local_out may be a dict or list depending on pipeline version
            if isinstance(local_out, dict):
                transcribed_text = local_out.get('text', '').strip()
                raw = local_out
            elif isinstance(local_out, list) and len(local_out) > 0:
                transcribed_text = local_out[0].get('text', '').strip()
                raw = local_out
            else:
                transcribed_text = ''
                raw = local_out

        except Exception as e:
            logger.error(f"Local transcription failed: {e}")
            return jsonify({'error': 'Local transcription failed', 'details': str(e)}), 500
        finally:
            try:
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)
            except Exception:
                pass

        bible_refs = parse_bible_reference(transcribed_text)
        response_data = {'text': transcribed_text, 'bible_references': bible_refs, 'raw': raw}
        logger.info(f"Transcribed (local): {transcribed_text}")
        return jsonify(response_data)

    # HF succeeded
    result = hf_result
    transcribed_text = result.get('text', '').strip()
    bible_refs = parse_bible_reference(transcribed_text)
    response_data = {
        'text': transcribed_text,
        'bible_references': bible_refs,
        'raw': result
    }
    logger.info(f"Transcribed (HF): {transcribed_text}")
    if bible_refs:
        logger.info(f"Found Bible references: {[ref['reference'] for ref in bible_refs]}")
    return jsonify(response_data)

@app.route('/api/bible-search', methods=['GET'])
def bible_search():
    """Search for Bible verses using Bible API"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({
            'error': 'Query parameter "q" is required',
            'tip': 'Try a reference like "John 3:16" or search terms'
        }), 400
    
    try:
        # First, try to parse as a direct reference
        bible_refs = parse_bible_reference(query)
        verses = []
        
        if bible_refs:
            # Fetch verses for each reference found
            for ref in bible_refs:
                verse_data = fetch_bible_verse(ref['reference'])
                if verse_data:
                    verse_data['confidence'] = ref['confidence']
                    verses.append(verse_data)
        else:
            # If no direct reference found, try searching Bible API
            # Bible API doesn't have full-text search, so we'll try common interpretations
            search_terms = query.lower()
            
            # Try some common verse searches
            common_searches = {
                'love': 'John 3:16',
                'faith': '1 Corinthians 13:13',
                'hope': 'Romans 8:28',
                'peace': 'Philippians 4:7',
                'strength': 'Philippians 4:13',
                'trust': 'Proverbs 3:5',
                'shepherd': 'Psalm 23:1',
                'light': 'John 8:12',
                'way': 'John 14:6',
                'life': 'John 10:10'
            }
            
            for term, reference in common_searches.items():
                if term in search_terms:
                    verse_data = fetch_bible_verse(reference)
                    if verse_data:
                        verse_data['confidence'] = 0.6  # Lower confidence for keyword matches
                        verses.append(verse_data)
                    break
        
        response = {
            'query': query,
            'totalResults': len(verses),
            'verses': verses
        }
        
        if not verses:
            response['suggestion'] = 'Try a specific reference like "John 3:16" or "Psalm 23"'
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Bible search error: {e}")
        return jsonify({
            'error': 'Bible search failed',
            'details': str(e),
            'suggestion': 'Please try again with a specific Bible reference'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
    'huggingface_available': bool(HUGGINGFACE_API_TOKEN),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    logger.info("Starting Bible Echo Python Backend (Hugging Face Whisper)...")
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Server starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)