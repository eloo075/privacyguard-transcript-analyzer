const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Transcription endpoint
app.post('/', upload.single('audio'), async (req, res) => {
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
                        // Send each keyterm as separate form field
                        validKeyterms.forEach((term) => {
                            formData.append('keyterms', term);
                        });
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
        const response = await fetch(ELEVENLABS_API_URL, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
            let errorData;
            const responseText = await response.text();
            
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText || `HTTP ${response.status}: ${response.statusText}` };
            }

            const errorMessage = errorData.detail?.message || 
                                errorData.message || 
                                errorData.error?.message ||
                                `API Error: ${response.status} ${response.statusText}`;
            
            return res.status(response.status).json({ 
                error: errorMessage,
                details: errorData.detail || errorData
            });
        }

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error('❌ Transcription error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
});

// Export for Vercel serverless function
module.exports = app;
