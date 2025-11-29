# Testing Guide - Player Dropdown & Tournament Features

## Prerequisites
1. Neon database tables must be created (execute schema.sql in Neon SQL Editor)
2. Netlify deploy is up and running

## Testing Player Dropdown Issue

### Step 1: Create a Tournament
1. Go to http://your-netlify-site/tournament.html
2. Click "Add Player" and fill in at least 3 players:
   - Player 1: Name "John", Team "Team A"
   - Player 2: Name "Mike", Team "Team B"
   - Player 3: Name "Sarah", Team "Team C"
3. Select "Matches per Player" (e.g., "6 matches per player")
4. Click "Create Tournament"
5. **Check console (F12) for messages like "Tournament count: 0, New tournament number: 1, Name: WEEK 01"**

### Step 2: Verify Tournament Created
- You should see the tournament name as "WEEK 01" (with leading zero)
- Check that the tournament displays on the home page

### Step 3: Test Player Dropdown
1. In the tournament view, click "Add Match Result" button
2. **IMPORTANT: Open DevTools (F12 → Console tab)**
3. Look for debug logs that show:
   ```
   === setupMatchModal DEBUG ===
   Input stats: [...]
   Stats is array: true
   Stats length: 3
   ```
4. If you see these logs AND the dropdowns are populated, the fix worked!

### Step 4: Check Console for Errors
Look for any error messages like:
- "Stats API error"
- "No stats data available"
- "Player select elements not found"

If you see errors, note them and we'll debug further.

### Step 5: Test Tournament Naming
1. Create a second tournament
2. Verify it's named "WEEK 02" (not "WEEK 11" or higher)
3. Create a third tournament
4. Verify it's named "WEEK 03"

## Testing Delete Functionality

1. Create a tournament with 3 players
2. Add 1-2 match results
3. Click "Delete Tournament" button
4. Click "OK" to confirm
5. **Verify in Neon database** that:
   - The tournament row is deleted
   - All matches related to that tournament are deleted
   - All tournament_stats for that tournament are deleted
   - All tournament_players entries are deleted

### Verify in Neon SQL Editor:
```sql
SELECT COUNT(*) FROM tournaments WHERE id = 'tournament_xxxx';
SELECT COUNT(*) FROM matches WHERE tournament_id = 'tournament_xxxx';
SELECT COUNT(*) FROM tournament_stats WHERE tournament_id = 'tournament_xxxx';
SELECT COUNT(*) FROM tournament_players WHERE tournament_id = 'tournament_xxxx';
```
All should return 0.

## Common Issues & Solutions

### Issue: Player dropdown still empty
- Check browser console (F12) for the "setupMatchModal DEBUG" logs
- Look for "Stats API error" messages
- Check Neon database - are tournament_players records created?

### Issue: Tournament naming wrong (WEEK 11 instead of WEEK 02)
- This suggests the COUNT query is returning unexpected values
- Check Netlify function logs for "Tournament count:" message
- Verify no deleted/orphaned tournament records in database

### Issue: Delete not working
- Check console for error messages
- Verify Neon connection is active
- Check Netlify function logs in the Functions tab

## Debug Commands

In browser console, after creating a tournament, run:
```javascript
// Check what tournament ID was created
new URLSearchParams(window.location.search).get('id')

// Manually test the stats API
fetch('/.netlify/functions/get-stats?type=tournament&tournament_id=YOUR_TOURNAMENT_ID')
  .then(r => r.json())
  .then(d => console.log('Raw response:', d))
```
