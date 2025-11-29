# Neon Database Setup - Final Guide

## Issue: 500 Error from get-stats API

The 500 error indicates the Neon connection is failing. This requires proper setup in Netlify.

## Step 1: Get Your Neon Connection String

1. Go to https://console.neon.tech/
2. Log in to your Neon account
3. Select your project
4. Click on "Connection string" 
5. Copy the **Pooled connection** string (looks like):
   ```
   postgresql://user:password@ep-xxxxx.us-east-1.neon.tech/dbname?sslmode=require
   ```

## Step 2: Add Environment Variable to Netlify

1. Go to https://app.netlify.com
2. Select your site (fuzzyefootball.netlify.app)
3. Go to **Site settings** → **Build & deploy** → **Environment**
4. Click **Edit variables**
5. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string from Step 1
6. Click **Save**

## Step 3: Verify Functions Can Access It

The functions use `const sql = neon();` which automatically picks up `DATABASE_URL` from environment variables.

## Step 4: Redeploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site** 
3. Wait for build to complete

## Step 5: Test

1. Create a tournament
2. Open DevTools Console (F12)
3. Look for the new logs we added:
   - From create-tournament: "Adding X players to tournament"
   - From get-stats: "getTournamentStats called with..."

## If Still Getting 500 Error

1. Check Netlify Function Logs:
   - Go to Site → **Functions** tab
   - Click on `get-stats` function
   - Look at the real-time logs

2. Common errors:
   - `ENOTFOUND` = Neon connection string issue
   - `ECONNREFUSED` = Wrong connection string
   - `syntax error` = SQL query is malformed (unlikely since it was working before)

## Debugging the SQL Query

If needed, test the query directly in Neon:

```sql
-- Test if tournament_players table has data
SELECT tp.tournament_id, tp.player_id, p.name, p.team_name
FROM tournament_players tp
JOIN players p ON tp.player_id = p.id
WHERE tp.tournament_id = 'tournament_YOUR_ID_HERE';

-- Test if players table has data
SELECT * FROM players LIMIT 5;

-- Test if tournaments table has data
SELECT * FROM tournaments LIMIT 5;
```

## Expected Flow

1. User creates tournament with 3 players
   - Inserts into `tournaments` table
   - Inserts into `players` table (3 rows)
   - Inserts into `tournament_players` table (3 rows)
   - Inserts into `tournament_stats` table (3 rows with 0 stats)
   - Generates matches in `matches` table

2. User clicks "Add Match Result"
   - GET /get-stats API is called
   - Query JOINs tournament_players → players → tournament_stats
   - Returns list of players with their stats
   - Populates the Player A and Player B dropdowns

If step 1 succeeds but step 2 fails with 500, the issue is in the Neon connection for the function.
