# Quick Git Commands for GitHub

## Make sure you're in the right directory first:

```bash
cd /Users/langdonn/Desktop/HQ
```

## Verify you're in a git repository:

```bash
git status
```

You should see: "On branch main" and "nothing to commit, working tree clean"

## If you get "not a git repository" error:

1. **Check your current directory:**
   ```bash
   pwd
   ```
   Should show: `/Users/langdonn/Desktop/HQ`

2. **If you're in a different folder, navigate to HQ:**
   ```bash
   cd /Users/langdonn/Desktop/HQ
   ```

3. **Verify .git folder exists:**
   ```bash
   ls -la | grep .git
   ```
   Should show: `.git`

## Link to GitHub (after creating repo on GitHub.com):

```bash
# Make sure you're in the HQ directory
cd /Users/langdonn/Desktop/HQ

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Check if remote is already added:

```bash
git remote -v
```

## If you need to remove and re-add remote:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```
