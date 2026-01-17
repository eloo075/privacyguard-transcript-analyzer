# PrivacyGuard Setup Guide

## Quick Setup (5 minutes)

### Step 1: Install Node.js
Make sure you have Node.js 16+ installed:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### Step 2: Get ElevenLabs API Key
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
2. Create a new API key
3. Copy the key (you'll need it in Step 4)

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure Environment
Create a `.env` file in the project root:
```bash
# Windows (PowerShell)
echo "ELEVENLABS_API_KEY=your_actual_api_key_here" > .env
echo "PORT=3000" >> .env

# Mac/Linux
cat > .env << EOF
ELEVENLABS_API_KEY=your_actual_api_key_here
PORT=3000
EOF
```

**Important**: Replace `your_actual_api_key_here` with your actual API key from Step 2!

### Step 5: Start the Server
```bash
npm start
```

You should see:
```
🚀 PrivacyGuard server running on http://localhost:3000
📝 Make sure ELEVENLABS_API_KEY is set in your .env file
```

### Step 6: Open in Browser
Navigate to: `http://localhost:3000`

## Testing the Application

### Test 1: Upload Audio File
1. Find any audio file (MP3, WAV, etc.)
2. Click the upload area or drag & drop
3. Select entity detection categories
4. Click "Analyze Transcript"

### Test 2: Record Audio
1. Click the microphone button
2. Grant microphone permissions
3. Speak for a few seconds
4. Click "Stop Recording"
5. Click "Analyze Transcript"

### Test 3: Keyterm Prompting
1. Upload/record audio with specialized terms
2. Add keyterms in the textarea (e.g., "Xandeum", "pNode", "Heidelberg")
3. Analyze and see improved accuracy

## Troubleshooting

### "ELEVENLABS_API_KEY not found"
- Make sure `.env` file exists in the project root
- Check that the file contains: `ELEVENLABS_API_KEY=your_key`
- Restart the server after creating/editing `.env`

### "Cannot access microphone"
- Grant browser permissions for microphone
- Use HTTPS or localhost (required for MediaRecorder API)

### "CORS error"
- Make sure you're accessing via `http://localhost:3000`
- Don't open `index.html` directly in browser (use the server)

### "Port 3000 already in use"
- Change PORT in `.env` to another number (e.g., 3001)
- Or stop the process using port 3000

### API Errors
- Verify your API key is correct
- Check your ElevenLabs account has credits/quota
- Review error message in browser console (F12)

## Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

## Production Deployment

For production, consider:
1. Use environment variables for API keys (never commit `.env`)
2. Set up HTTPS
3. Add rate limiting
4. Configure CORS properly
5. Use a process manager like PM2

## Need Help?

Check the main [README.md](README.md) for more details and API documentation.
