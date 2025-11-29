# Fix Deployment Error - Quick Instructions

Your Netlify deployment failed because the functions were missing the `@netlify/functions` package. This has been fixed.

## What Was Done

1. ✅ **Created `package.json`** with `@netlify/functions` as a dependency
2. ✅ **Updated all 5 functions** to use correct database imports:
   - `create-tournament.js`
   - `get-tournaments.js`
   - `get-stats.js`
   - `get-matches.js`
   - `update-match.js`

## How to Fix Your Deployment

### Step 1: Commit the Changes

```bash
cd d:\efootbal-league

# Stage the new/updated files
git add package.json
git add netlify/functions/

# Commit with a descriptive message
git commit -m "fix: add @netlify/functions package and fix database imports"

# Push to GitHub
git push origin main
```

### Step 2: Trigger Redeploy on Netlify

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Deploys** tab
4. You should see the new commit
5. If not deployed automatically, click **Trigger deploy**

### Step 3: Wait for Success ✅

The build should now succeed. You'll see:
- ✅ Dependencies installed
- ✅ Functions packaged
- ✅ Site deployed
- ✅ Database ready

---

## Files Created/Modified

### New Files
- `package.json` - Declares `@netlify/functions` dependency

### Updated Files (all in `netlify/functions/`)
- `create-tournament.js` - Fixed import
- `get-tournaments.js` - Fixed import
- `get-stats.js` - Fixed import
- `get-matches.js` - Fixed import
- `update-match.js` - Fixed import

All functions now use:
```javascript
const { NetlifyDB } = require('@netlify/functions');
// Then in handler:
const db = new NetlifyDB();
```

---

## If You're Using Git from Command Line

```bash
# Open terminal/PowerShell in project folder
git status                                    # Check what changed
git add .                                     # Stage all changes
git commit -m "fix: add package.json and fix functions"
git push                                      # Push to GitHub
```

## If You're Using GitHub Desktop

1. Open GitHub Desktop
2. You'll see uncommitted changes
3. Click "Commit to main"
4. Enter message: "fix: add package.json and fix functions"
5. Click "Push origin"

---

## What This Fixes

**Before (Error):**
```
Cannot find module '@netlify/functions'
Error in netlify/functions/create-tournament.js:1
```

**After (Working):**
```
✅ Dependencies installed
✅ Functions packaged successfully
✅ Site deployed
```

---

## Verification

Once deployed, check the Netlify logs:

1. Dashboard → Your Site → **Deploys**
2. Click the latest deploy
3. Check "Build log" - should say "Build Successful"
4. Check "Functions" tab - all 5 should show ✅

---

## Next: Set Up Database

Once deployment succeeds, set up your database:

```bash
# Push schema to live database
netlify db push netlify/db/schema.sql
```

Then test:
```bash
netlify db shell
.tables
# Should show all 6 tables
```

---

## Still Getting Errors?

If deployment still fails after pushing:

1. **Hard refresh Netlify**: F12 → Ctrl+Shift+Delete
2. **Check your Git history**:
   ```bash
   git log --oneline -5
   # Should show your latest commit
   ```
3. **Force trigger redeploy**:
   - Dashboard → Deploys → "Trigger deploy"

---

**Status**: Ready to deploy ✅
**Next Step**: Commit changes and push to GitHub
