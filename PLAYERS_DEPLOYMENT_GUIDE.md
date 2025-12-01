# Players Feature - Deployment Checklist

## Pre-Deployment

- [ ] Review all code changes in git diff
- [ ] Test locally if possible
- [ ] Have database access ready
- [ ] Backup current database
- [ ] Create database branch for safety (Neon)

## Step 1: Database Migration

1. Go to your Neon database console
2. Open SQL Editor
3. Run the following SQL commands:

```sql
-- Add account_number and updated_at columns
ALTER TABLE players ADD COLUMN account_number VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE players ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create player_audit table
CREATE TABLE IF NOT EXISTS player_audit (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_audit_player_id FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_player_audit_player_id ON player_audit(player_id);
CREATE INDEX idx_player_audit_action ON player_audit(action);
CREATE INDEX idx_player_audit_changed_at ON player_audit(changed_at DESC);
CREATE INDEX idx_players_account_number ON players(account_number);
```

4. Verify tables exist:
   - `players` table should have `account_number` column
   - `players` table should have `updated_at` column
   - `player_audit` table should exist with all columns

## Step 2: Deploy Code

### Files Created (New)
- `players.html`
- `src/js/players.js`
- `netlify/functions/get-players.js`
- `netlify/functions/add-player.js`
- `netlify/functions/update-player.js`
- `netlify/functions/delete-player.js`

### Files Modified
- `index.html` - Added Players nav link
- `tournament.html` - Added Players nav link, updated player form
- `past-tournaments.html` - Added Players nav link
- `leaderboard.html` - Added Players nav link
- `src/js/tournament.js` - Updated to use player dropdowns
- `src/css/style.css` - Added new styles
- `netlify/functions/create-tournament.js` - Updated to use player IDs

### Deployment Steps

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Add Players management feature with centralized player database"
   ```

2. **Push to repository:**
   ```bash
   git push origin main
   ```

3. **Netlify will auto-deploy**
   - New functions will be deployed
   - All HTML/CSS/JS files will be updated
   - No additional deployment configuration needed

4. **Verify deployment:**
   - Check Netlify dashboard
   - Functions should show all 6 functions (add/update/delete/get-player, create-tournament)
   - No build errors

## Step 3: Test in Production

1. **Test Players Page:**
   - Navigate to `https://yourdomain.com/players.html`
   - Should load without errors
   - "Add New Player" form should be visible

2. **Add a Test Player:**
   - Fill in all required fields
   - Upload a test photo (optional)
   - Click "Add Player"
   - Should appear in grid immediately

3. **Test Edit:**
   - Click edit button on the player
   - Change some fields
   - Click "Save Changes"
   - Should update immediately

4. **Test Tournament Creation:**
   - Go to Tournaments page
   - You should see player dropdowns instead of text inputs
   - Select 3-4 players from dropdown
   - Cannot select same player twice
   - Create tournament should work

5. **Test Tournament Play:**
   - Complete a tournament match
   - View leaderboard
   - Player stats should be tracked correctly

## Post-Deployment Verification

- [ ] Players page loads without errors
- [ ] Can add new players
- [ ] Can edit existing players
- [ ] Can delete players (soft delete to audit)
- [ ] Tournament creation shows player dropdowns
- [ ] Cannot select duplicate players
- [ ] Creating tournament with existing players works
- [ ] Match results still track correctly
- [ ] Leaderboard displays player stats
- [ ] No JavaScript errors in console
- [ ] No database errors in logs

## Rollback Plan (If Needed)

If something goes wrong:

1. **Quick Rollback:**
   - Revert HTML/CSS/JS files
   - Redeploy to Netlify
   - No data loss

2. **Database Rollback:**
   - If using Neon: Restore from backup branch
   - The new columns are backward compatible
   - Old code will still work

3. **Contact Support:**
   - Check Netlify function logs
   - Check browser console errors
   - Check database with SQL query

## Database Query Examples

### Check if migration worked:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players';
```

### View player audit log:
```sql
SELECT * FROM player_audit 
ORDER BY changed_at DESC 
LIMIT 10;
```

### Check player count:
```sql
SELECT COUNT(*) as total_players FROM players;
```

### Search player by account number:
```sql
SELECT * FROM players 
WHERE account_number = 'ACC123' 
LIMIT 1;
```

## Common Issues & Solutions

### Issue: "404 Not Found" on Players page
- **Solution:** Clear browser cache, hard refresh (Ctrl+F5)

### Issue: "Error loading players"
- **Solution:** Check get-players.js function logs in Netlify
- Run database query: `SELECT * FROM players LIMIT 1;`

### Issue: "Cannot add player"
- **Solution:** Check add-player.js logs
- Verify all required fields are filled
- Check database connection

### Issue: "Dropdowns not showing in tournament"
- **Solution:** Clear cache and refresh
- Check browser console for errors
- Verify players exist in database

### Issue: "Players won't save"
- **Solution:** Check update-player.js logs
- Verify JSONB is supported in database
- Check player_audit table exists

## Success Indicators

- ✅ All new functions deployed to Netlify
- ✅ Players page accessible and functional
- ✅ Add/Edit/Delete operations work
- ✅ Tournament creation shows dropdowns
- ✅ No console errors
- ✅ Database contains audit records
- ✅ Player stats tracked correctly in matches

## Next Steps

After successful deployment:

1. Add comprehensive player list to database
2. Create first tournament with existing players
3. Complete matches and verify leaderboard
4. Share link with league members
5. Monitor logs for any issues

## Support Contact

If you encounter issues:
1. Check function logs in Netlify dashboard
2. Inspect browser console (F12)
3. Query database directly for data integrity
4. Review error messages carefully

## Documentation Links

- Players Feature Guide: `PLAYERS_FEATURE_IMPLEMENTATION.md`
- Database Migration: `PLAYERS_DATABASE_MIGRATION.md`
- Main Architecture: `ARCHITECTURE.md`

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**Verified Working:** ___________
