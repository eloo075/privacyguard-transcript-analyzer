# Deploy to Vercel - Complete Guide 🚀

## Quick Deploy (5 minutes)

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

This will open your browser - sign in with GitHub (recommended).

### Step 3: Deploy

```powershell
cd "c:\Users\lotfi\Downloads\index.html"
vercel
```

**Answer the prompts:**
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name: **privacyguard-transcript-analyzer** (or press Enter for default)
- Directory: **.** (current directory, just press Enter)
- Override settings? **No**

### Step 4: Add Environment Variable

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: `privacyguard-transcript-analyzer`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. **Key**: `ELEVENLABS_API_KEY`
6. **Value**: `sk_2521f76836c934099c50cc2ca87d75fdcd778ea095bf485d`
7. **Environment**: Select all (Production, Preview, Development)
8. Click **Save**

### Step 5: Redeploy

```powershell
vercel --prod
```

**Done!** Your app is live! 🎉

---

## Alternative: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub First

Follow `GITHUB_PUSH_COMMANDS.md` to push your code to GitHub.

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. **Import** your GitHub repository: `privacyguard-transcript-analyzer`
5. Click **Import**

### Step 3: Configure Project

**Build Settings:**
- **Framework Preset**: Other
- **Root Directory**: `./` (leave as is)
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

**Environment Variables:**
- Click **"Environment Variables"**
- Add: `ELEVENLABS_API_KEY` = `sk_2521f76836c934099c50cc2ca87d75fdcd778ea095bf485d`
- Select all environments (Production, Preview, Development)

### Step 4: Deploy

Click **"Deploy"**

Vercel will:
1. Install dependencies
2. Build your project
3. Deploy it
4. Give you a URL like: `privacyguard-transcript-analyzer.vercel.app`

**Done!** ✅

---

## Verify Your Deployment

1. **Visit your URL**: `https://privacyguard-transcript-analyzer.vercel.app`
2. **Test the app**:
   - Upload an audio file
   - Test Entity Detection
   - Test Keyterm Prompting
3. **Check server logs**: Vercel Dashboard → Your Project → Functions → View Logs

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution**: Make sure `package.json` has all dependencies listed

### Issue: API calls failing
**Solution**: 
- Check environment variable is set correctly
- Verify API key is correct
- Check Vercel function logs

### Issue: 404 errors on API routes
**Solution**: 
- Verify `vercel.json` is configured correctly
- Check that routes are set up properly

### Issue: CORS errors
**Solution**: 
- Vercel handles CORS automatically
- If issues persist, check server.js CORS settings

---

## Your Live Demo URL

After deployment, you'll get a URL like:
```
https://privacyguard-transcript-analyzer.vercel.app
```

**Use this URL in:**
- Contest submission form
- Your X (Twitter) post
- GitHub README.md

---

## Update README with Live Demo

Add this to your README.md:

```markdown
## 🌐 Live Demo

Try it live: [https://privacyguard-transcript-analyzer.vercel.app](https://privacyguard-transcript-analyzer.vercel.app)
```

---

## Pro Tips

✅ **Automatic deployments**: Every push to GitHub auto-deploys
✅ **Preview deployments**: Each PR gets its own preview URL
✅ **Free tier**: Vercel free tier is perfect for demos
✅ **Custom domain**: You can add your own domain later

---

**Your demo website will be live in minutes!** 🚀
