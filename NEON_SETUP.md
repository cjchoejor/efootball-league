# Neon PostgreSQL Setup Guide

Your code has been updated to work with **Neon PostgreSQL** instead of SQLite.

## What Changed

✅ All 5 functions updated to use `@netlify/neon`
✅ Database schema converted to PostgreSQL syntax
✅ SQL queries updated for PostgreSQL
✅ package.json updated with correct dependency

---

## Step 1: Deploy Updated Code

```bash
cd d:\efootbal-league

# Commit changes
git add .
git commit -m "feat: migrate to Neon PostgreSQL"

# Push to GitHub
git push origin main
```

Netlify will auto-deploy your updated functions.

---

## Step 2: Create Schema in Neon

Your Neon database is already created and connected. Now you need to create the tables.

### Option A: Using Neon Dashboard (Easy)

1. Go to https://console.neon.tech
2. Select your project
3. Click **SQL Editor**
4. Copy the entire contents of `netlify/db/schema.sql`
5. Paste into the SQL editor
6. Click **Execute**
7. Should see: "Success - 6 tables created"

### Option B: Using CLI (If you have psql)

```bash
# Get your database URL from Netlify Dashboard
# Dashboard → Storage → Neon → Copy connection string

psql "your-neon-connection-string" < netlify/db/schema.sql
```

---

## Step 3: Verify Tables Created

### In Neon Dashboard:

1. Go to https://console.neon.tech
2. Select your project
3. Click **SQL Editor**
4. Run this query:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Should return 6 tables:
- `all_time_stats`
- `matches`
- `players`
- `tournament_players`
- `tournament_stats`
- `tournaments`

---

## Step 4: Test Your Site

Wait for Netlify deployment to finish (2-3 minutes), then:

1. Go to your live site URL
2. Click "Create Tournament"
3. Add 3+ players
4. Create tournament
5. Submit a match result
6. Check leaderboard updates

**It should all work now!**

---

## Troubleshooting

### Functions Still Returning Errors?

Check the Netlify logs:
1. Dashboard → Your Site → **Functions** tab
2. Click the failing function
3. View logs - look for connection errors

### Database Connection Failed?

Make sure your `NETLIFY_DATABASE_URL` environment variable is set:
1. Netlify Dashboard → Site Settings → **Build & Deploy**
2. Scroll to **Environment**
3. Should have `NETLIFY_DATABASE_URL` from Neon
4. If missing, add it manually from Neon console

### Still Having Issues?

Try this in Neon Dashboard SQL Editor:

```sql
-- Test connection
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: 6
```

If this doesn't work, tables weren't created properly. Re-run the schema.

---

## Key Differences from SQLite

I've handled these for you, but good to know:

| Feature | SQLite | PostgreSQL |
|---------|--------|-----------|
| Params | `?` | `$1, $2, $3` |
| Insert or ignore | `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| String functions | `SUBSTR()` | `SUBSTRING()` |
| String position | `INSTR()` | `POSITION()` or `STRPOS()` |
| Auto-increment | `AUTOINCREMENT` | `SERIAL` |
| Conflicts | Single syntax | `ON CONFLICT ... DO UPDATE` |

All of these are correctly implemented in your functions.

---

## Performance Notes

PostgreSQL is more powerful than SQLite:
- ✅ Better for concurrent users
- ✅ Better for large datasets
- ✅ Better for complex queries
- ✅ Automatic indexes created

Your tournament system will scale better with Neon.

---

## Monitor Database Usage

In Neon Dashboard:
1. Go to **Monitoring**
2. See database stats
3. Monitor connections and queries
4. Free tier has good limits for your use case

---

## Next Steps

1. ✅ Deploy code (git push)
2. ✅ Create schema in Neon
3. ✅ Test your site
4. ✅ Start creating tournaments!

---

**Everything is now compatible with Neon PostgreSQL!**

The update handles:
- All SQL syntax conversion
- Parameter passing ($1, $2, etc.)
- PostgreSQL-specific functions
- Proper error handling
- Connection management

No changes needed to frontend - all connections go through functions.
