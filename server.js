const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ElevenLabs API endpoint - Batch transcription
// Based on docs: https://elevenlabs.io/docs/api-reference/speech-to-text
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
// Try alternative endpoint formats - the API might use a different path
const ELEVENLABS_API_URL = `${ELEVENLABS_API_BASE}/speech-to-text`;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
    console.warn('⚠️  WARNING: ELEVENLABS_API_KEY not found in environment variables!');
    console.warn('   Please create a .env file with: ELEVENLABS_API_KEY=your_key_here');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'PrivacyGuard API is running',
        apiKeySet: !!ELEVENLABS_API_KEY,
        apiKeyPrefix: ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.substring(0, 10) + '...' : 'not set'
    });
});

// Transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ 
                error: 'Server configuration error: ELEVENLABS_API_KEY not set' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { entityDetection, keyterms, languageCode, diarize, tagAudioEvents } = req.body;

        // Create FormData for ElevenLabs API
        const formData = new FormData();
        
        // Determine file extension from original name or mimetype
        let filename = req.file.originalname || 'audio.webm';
        let contentType = req.file.mimetype;
        
        // Ensure proper file extension
        if (!filename.includes('.')) {
            if (contentType === 'audio/mpeg' || contentType === 'audio/mp3') {
                filename = 'audio.mp3';
                contentType = 'audio/mpeg';
            } else if (contentType === 'audio/wav' || contentType === 'audio/wave') {
                filename = 'audio.wav';
                contentType = 'audio/wav';
            } else if (contentType === 'audio/mp4' || contentType === 'audio/m4a') {
                filename = 'audio.m4a';
                contentType = 'audio/mp4';
            } else {
                filename = 'audio.webm';
                contentType = contentType || 'audio/webm';
            }
        }
        
        formData.append('file', req.file.buffer, {
            filename: filename,
            contentType: contentType
        });
        formData.append('model_id', 'scribe_v2');
        
        console.log('   Using filename:', filename);
        console.log('   Using content type:', contentType);

        // Add entity detection if provided
        if (entityDetection) {
            try {
                const entityTypes = JSON.parse(entityDetection);
                if (Array.isArray(entityTypes) && entityTypes.length > 0) {
                    formData.append('entity_detection', JSON.stringify(entityTypes));
                }
            } catch (e) {
                console.warn('Invalid entity_detection format:', e.message);
            }
        }

        // Add keyterms if provided
        if (keyterms) {
            try {
                const keytermsArray = JSON.parse(keyterms);
                if (Array.isArray(keytermsArray) && keytermsArray.length > 0) {
                    if (keytermsArray.length > 100) {
                        return res.status(400).json({ 
                            error: 'Maximum 100 keyterms allowed' 
                        });
                    }
                    
                    // Validate and filter keyterms
                    const validKeyterms = [];
                    for (const term of keytermsArray) {
                        const trimmedTerm = String(term).trim();
                        if (trimmedTerm.length === 0) continue;
                        if (trimmedTerm.length > 50) {
                            console.warn(`Keyterm "${trimmedTerm}" exceeds 50 characters, skipping`);
                            continue;
                        }
                        validKeyterms.push(trimmedTerm);
                    }
                    
                    if (validKeyterms.length > 0) {
                        // ElevenLabs API expects keyterms as an array
                        // Try sending each keyterm as a separate form field with same name
                        // This creates an array when parsed by the API
                        validKeyterms.forEach((term) => {
                            formData.append('keyterms', term);
                        });
                        console.log('   Keyterms count:', validKeyterms.length);
                        console.log('   Keyterms:', validKeyterms.join(', '));
                        console.log('   Sending each keyterm as separate form field');
                    }
                }
            } catch (e) {
                console.warn('Invalid keyterms format:', e.message);
            }
        }

        // Add language code if provided
        if (languageCode && languageCode !== '') {
            formData.append('language_code', languageCode);
        }

        // Add optional parameters
        if (diarize === 'true' || diarize === true) {
            formData.append('diarize', 'true');
        }

        if (tagAudioEvents === 'true' || tagAudioEvents === true) {
            formData.append('tag_audio_events', 'true');
        }

        // Call ElevenLabs API
        // Correct endpoint: /v1/speech-to-text (NOT /convert)
        const apiUrl = ELEVENLABS_API_URL;
        console.log('📤 Sending request to ElevenLabs API...');
        console.log('   Full URL:', apiUrl);
        console.log('   File size:', req.file.size, 'bytes');
        console.log('   File type:', req.file.mimetype);
        console.log('   Entity detection:', entityDetection || 'none');
        console.log('   Keyterms:', keyterms || 'none');
        console.log('   API Key prefix:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.substring(0, 10) + '...' : 'NOT SET');

        let response;
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY
                },
                body: formData
            });
        } catch (fetchError) {
            console.error('❌ Fetch error:', fetchError.message);
            throw new Error(`Network error: ${fetchError.message}`);
        }

        console.log('📥 Response status:', response.status, response.statusText);

        if (!response.ok) {
            let errorData;
            const responseText = await response.text();
            console.error('❌ API Error Response:', responseText);
            
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText || `HTTP ${response.status}: ${response.statusText}` };
            }

            const errorMessage = errorData.detail?.message || 
                                errorData.message || 
                                errorData.error?.message ||
                                `API Error: ${response.status} ${response.statusText}`;
            
            console.error('❌ Error details:', errorMessage);
            
            return res.status(response.status).json({ 
                error: errorMessage,
                details: errorData.detail || errorData
            });
        }

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('❌ Transcription error:', error);
        console.error('   Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 PrivacyGuard server running on http://localhost:${PORT}`);
    console.log(`📝 Make sure ELEVENLABS_API_KEY is set in your .env file`);
});
