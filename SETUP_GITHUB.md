# How to Link This Repository to GitHub

Follow these steps to connect your local repository to GitHub:

## Step 1: Initialize Git Repository

Open your terminal in the `HQ` folder and run:

```bash
cd /Users/langdonn/Desktop/HQ
git init
```

## Step 2: Add All Files

```bash
git add .
```

## Step 3: Make Initial Commit

```bash
git commit -m "Initial commit: StockTiming Pro - AI-powered stock analysis platform"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - **Repository name**: `StockTiming-Pro` (or any name you prefer)
   - **Description**: "AI-powered stock market analysis platform with real-time signals"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 5: Link and Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/StockTiming-Pro.git

# Rename default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using SSH (if you have SSH keys set up)

```bash
git remote add origin git@github.com:YOUR_USERNAME/StockTiming-Pro.git
git branch -M main
git push -u origin main
```

## Important Security Notes

⚠️ **Before pushing to GitHub:**

1. **Change the default admin password** in `config.js`:
   - Line 18: Change `adminPassword: 'admin123'` to something secure

2. **Consider removing the webhook URL** from `config.js` if it's sensitive:
   - The webhook URL is on line 8
   - You can set it in the admin panel instead

3. **Never commit API keys**:
   - API keys are stored in browser localStorage, not in files
   - The config.js file has empty placeholders which is safe

## Future Updates

After the initial push, to update GitHub with new changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## Troubleshooting

### If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### If you need to change the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/StockTiming-Pro.git
```

### To check your remote:
```bash
git remote -v
```
