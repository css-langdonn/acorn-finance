# GitHub Authentication Setup

GitHub no longer accepts passwords for Git operations. You need to use a **Personal Access Token (PAT)** instead.

## Option 1: Personal Access Token (Recommended - Easiest)

### Step 1: Create a Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name like: `StockTiming-Pro-Repo`
4. Select expiration (30 days, 60 days, 90 days, or no expiration)
5. **Select scopes** (check these boxes):
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if you plan to use GitHub Actions)
6. Click **"Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** - you won't be able to see it again!

### Step 2: Use the Token Instead of Password

When you run `git push`, use:
- **Username**: `css-langdonn` (your GitHub username)
- **Password**: Paste your Personal Access Token (not your GitHub password)

```bash
git push -u origin main
```

When prompted:
- Username: `css-langdonn`
- Password: `paste_your_token_here`

### Step 3: Save Credentials (Optional but Recommended)

To avoid entering the token every time:

**On macOS:**
```bash
# Use macOS Keychain to store credentials
git config --global credential.helper osxkeychain
```

Then on your next push, enter the token once and it will be saved.

## Option 2: SSH Keys (More Secure, One-Time Setup)

### Step 1: Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter to accept default location. Optionally set a passphrase.

### Step 2: Add SSH Key to GitHub

1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   Copy the entire output.

2. Go to: https://github.com/settings/keys
3. Click **"New SSH key"**
4. Title: `MacBook Air` (or any name)
5. Paste your public key
6. Click **"Add SSH key"**

### Step 3: Change Remote URL to SSH

```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin git@github.com:css-langdonn/REPO_NAME.git

# Push using SSH
git push -u origin main
```

## Quick Fix for Your Current Situation

Since you already have the HTTPS remote set up, the easiest fix is:

1. **Create a Personal Access Token** (follow Option 1, Step 1 above)
2. **Try pushing again:**
   ```bash
   git push -u origin main
   ```
3. When prompted:
   - Username: `css-langdonn`
   - Password: `paste_your_personal_access_token_here`

## Verify Your Remote URL

Check what remote you have set:
```bash
git remote -v
```

If it shows `YOUR_USERNAME` or `REPO_NAME`, update it:
```bash
git remote set-url origin https://github.com/css-langdonn/YOUR_ACTUAL_REPO_NAME.git
```

Replace `YOUR_ACTUAL_REPO_NAME` with the actual name of your GitHub repository.
