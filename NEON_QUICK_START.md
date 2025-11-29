# Neon Setup - Quick Start (5 Minutes)

## What's Already Done ✅

- Code updated to use Neon PostgreSQL
- All 5 functions rewritten for `@netlify/neon`
- Schema converted to PostgreSQL syntax
- package.json updated

## What You Need to Do

### Step 1: Deploy Code (1 minute)

```bash
cd d:\efootbal-league
git add .
git commit -m "feat: migrate to Neon PostgreSQL"
git push origin main
```

**Wait for Netlify deployment to finish (2-3 min).**

---

### Step 2: Create Tables in Neon (2 minutes)

**Do this in Neon Dashboard:**

1. Go to https://console.neon.tech
2. Log in with your Neon account
3. Select your project
4. Click **SQL Editor** (top left)
5. Clear any existing code
6. Open your project folder and copy entire contents of:
   ```
   netlify/db/schema.sql
   ```
7. Paste it into Neon SQL Editor
8. Click **Execute** button
9. Should show: "Success"

---

### Step 3: Verify Tables (1 minute)

In Neon SQL Editor, run:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Should return 6 tables:**
```
all_time_stats
matches
players
tournament_players
tournament_stats
tournaments
```

If you see these 6 tables, ✅ you're done!

---

### Step 4: Test (1 minute)

1. Go to your live site (from Netlify Dashboard)
2. Click "Create Tournament"
3. Add 3 players
4. Create tournament
5. Submit a match
6. Check leaderboard

**Everything should work!** 🎉

---

## Done in 5 Minutes

That's it! Your tournament system is now live with Neon PostgreSQL.

---

## If Something Doesn't Work

### Tables not created?
- Make sure you executed the FULL schema.sql in Neon
- Try copying schema again and re-executing

### Site shows errors?
- Check Netlify Dashboard → Functions → View logs
- Make sure Neon connection string is set (should be automatic)
- Wait 5 minutes and try again

### Match submission fails?
- Verify tables exist (run the SELECT query above)
- Check function logs in Netlify Dashboard
- Make sure Neon database is active

---

## Full Documentation

For detailed info, see:
- `NEON_SETUP.md` - Full setup guide
- `README.md` - Feature documentation
- `FINAL_STEPS.md` - Deployment details

---

**Status**: Ready to go live ✅
**Time to complete**: ~5 minutes
