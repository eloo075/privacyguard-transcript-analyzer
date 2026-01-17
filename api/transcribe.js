const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configure multer for file uploads (memory storage)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Vercel serverless function handler
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ 
                error: 'Server configuration error: ELEVENLABS_API_KEY not set' 
            });
        }

        // Parse multipart form data manually for Vercel
        const Busboy = require('busboy');
        const busboy = Busboy({ headers: req.headers });
        
        let audioBuffer = null;
        let audioFilename = 'audio.webm';
        let audioContentType = 'audio/webm';
        let entityDetection = null;
        let keyterms = null;
        let languageCode = null;
        let diarize = false;
        let tagAudioEvents = false;

        return new Promise((resolve, reject) => {
            busboy.on('file', (name, file, info) => {
                if (name === 'audio') {
                    const chunks = [];
                    audioFilename = info.filename || 'audio.webm';
                    audioContentType = info.mimeType || 'audio/webm';
                    
                    file.on('data', (data) => {
                        chunks.push(data);
                    });
                    
                    file.on('end', () => {
                        audioBuffer = Buffer.concat(chunks);
                    });
                } else {
                    file.resume();
                }
            });

            busboy.on('field', (name, value) => {
                if (name === 'entityDetection') {
                    try {
                        entityDetection = JSON.parse(value);
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                } else if (name === 'keyterms') {
                    try {
                        keyterms = JSON.parse(value);
                    } catch (e) {
                        // Ignore invalid JSON
                    }
                } else if (name === 'languageCode') {
                    languageCode = value || null;
                } else if (name === 'diarize') {
                    diarize = value === 'true' || value === true;
                } else if (name === 'tagAudioEvents') {
                    tagAudioEvents = value === 'true' || value === true;
                }
            });

            busboy.on('finish', async () => {
                try {
                    if (!audioBuffer) {
                        return resolve(res.status(400).json({ error: 'No audio file provided' }));
                    }

                    // Create FormData for ElevenLabs API
                    const formData = new FormData();
                    
                    // Determine file extension
                    let filename = audioFilename;
                    if (!filename.includes('.')) {
                        if (audioContentType === 'audio/mpeg' || audioContentType === 'audio/mp3') {
                            filename = 'audio.mp3';
                            audioContentType = 'audio/mpeg';
                        } else if (audioContentType === 'audio/wav' || audioContentType === 'audio/wave') {
                            filename = 'audio.wav';
                            audioContentType = 'audio/wav';
                        } else if (audioContentType === 'audio/mp4' || audioContentType === 'audio/m4a') {
                            filename = 'audio.m4a';
                            audioContentType = 'audio/mp4';
                        } else {
                            filename = 'audio.webm';
                            audioContentType = audioContentType || 'audio/webm';
                        }
                    }
                    
                    formData.append('file', audioBuffer, {
                        filename: filename,
                        contentType: audioContentType
                    });
                    formData.append('model_id', 'scribe_v2');

                    // Add entity detection if provided
                    if (entityDetection && Array.isArray(entityDetection) && entityDetection.length > 0) {
                        formData.append('entity_detection', JSON.stringify(entityDetection));
                    }

                    // Add keyterms if provided
                    if (keyterms && Array.isArray(keyterms) && keyterms.length > 0) {
                        if (keyterms.length > 100) {
                            return resolve(res.status(400).json({ 
                                error: 'Maximum 100 keyterms allowed' 
                            }));
                        }
                        
                        // Validate and filter keyterms
                        const validKeyterms = [];
                        for (const term of keyterms) {
                            const trimmedTerm = String(term).trim();
                            if (trimmedTerm.length === 0) continue;
                            if (trimmedTerm.length > 50) {
                                continue;
                            }
                            validKeyterms.push(trimmedTerm);
                        }
                        
                        if (validKeyterms.length > 0) {
                            validKeyterms.forEach((term) => {
                                formData.append('keyterms', term);
                            });
                        }
                    }

                    // Add language code if provided
                    if (languageCode && languageCode !== '') {
                        formData.append('language_code', languageCode);
                    }

                    // Add optional parameters
                    if (diarize) {
                        formData.append('diarize', 'true');
                    }

                    if (tagAudioEvents) {
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

                    // Read response once
                    const responseText = await response.text();

                    if (!response.ok) {
                        let errorData;
                        try {
                            errorData = JSON.parse(responseText);
                        } catch (e) {
                            errorData = { message: responseText || `HTTP ${response.status}: ${response.statusText}` };
                        }

                        const errorMessage = errorData.detail?.message || 
                                            errorData.message || 
                                            errorData.error?.message ||
                                            `API Error: ${response.status} ${response.statusText}`;
                        
                        return resolve(res.status(response.status).json({ 
                            error: errorMessage,
                            details: errorData.detail || errorData
                        }));
                    }

                    // Parse successful response
                    const result = JSON.parse(responseText);
                    return resolve(res.json(result));

                } catch (error) {
                    console.error('❌ Transcription error:', error);
                    return resolve(res.status(500).json({ 
                        error: 'Internal server error', 
                        message: error.message
                    }));
                }
            });

            req.pipe(busboy);
        });
    } catch (error) {
        console.error('❌ Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message
        });
    }
};
