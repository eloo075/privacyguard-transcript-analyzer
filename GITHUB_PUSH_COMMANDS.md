# GitHub Push Commands 🚀

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "+" (top right) → "New repository"
3. **Repository name**: `privacyguard-transcript-analyzer`
4. **Description**: `AI-Powered Transcript Analyzer using ElevenLabs Scribe v2 with Entity Detection & Keyterm Prompting`
5. **Visibility**: Public ✅
6. **DO NOT** check "Initialize with README"
7. Click "Create repository"

## Step 2: Push Your Code

**Run these commands in PowerShell (replace YOUR_USERNAME with your GitHub username):**

```powershell
cd "c:\Users\lotfi\Downloads\index.html"

# Configure git (if not done)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Commit
git commit -m "Initial commit: PrivacyGuard with Scribe v2 - Entity Detection & Keyterm Prompting"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/privacyguard-transcript-analyzer.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Go to your GitHub repository
2. Check that all files are there:
   - ✅ index.html
   - ✅ server.js
   - ✅ package.json
   - ✅ README.md
   - ✅ SETUP.md
   - ✅ .gitignore
   - ✅ .env.example
   - ✅ vercel.json
3. Verify `.env` is NOT there (it's in .gitignore ✅)

## Important Notes:

⚠️ **Never commit `.env` file** - it contains your API key!
✅ `.env.example` is safe to commit (no real keys)

## If You Get Errors:

### "Git user not configured":
```powershell
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### "Authentication failed":
- Use GitHub Personal Access Token instead of password
- Or use GitHub Desktop app

### "Repository already exists":
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/privacyguard-transcript-analyzer.git
```

---

**Once pushed, your repo will be live!** 🎉
