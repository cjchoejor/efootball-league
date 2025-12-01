# Players Feature - Quick Reference Card

## Navigation
- **Players Page**: `/players.html` (new navigation link on all pages)

## Database Changes Required
```sql
-- Run in Neon console
ALTER TABLE players ADD COLUMN account_number VARCHAR(50) NOT NULL DEFAULT '';
ALTER TABLE players ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE player_audit (...);  -- See PLAYERS_DATABASE_MIGRATION.md for full SQL
```

## New Files Created
| File | Purpose |
|------|---------|
| `players.html` | Player management page |
| `src/js/players.js` | Frontend logic for players |
| `netlify/functions/get-players.js` | Get all players |
| `netlify/functions/add-player.js` | Create player |
| `netlify/functions/update-player.js` | Update player |
| `netlify/functions/delete-player.js` | Delete player |

## Modified Files
| File | Changes |
|------|---------|
| `index.html` | Added Players nav link |
| `tournament.html` | Added Players nav link + updated player form to dropdowns |
| `past-tournaments.html` | Added Players nav link |
| `leaderboard.html` | Added Players nav link |
| `src/js/tournament.js` | Use player dropdowns instead of text inputs |
| `src/css/style.css` | Added player card and selection styles |
| `netlify/functions/create-tournament.js` | Accept playerIds instead of creating new players |

## API Endpoints
```
GET  /.netlify/functions/get-players
POST /.netlify/functions/add-player
POST /.netlify/functions/update-player
POST /.netlify/functions/delete-player
POST /.netlify/functions/create-tournament  (MODIFIED)
```

## Features Summary

### 1. Players Page (New)
- **Location**: `/players.html`
- **Add Player**: Form to create new players with name, team, account number, photo
- **View Players**: Grid display of all players with photo, name, team, account number
- **Edit Player**: Click edit button to modify player details
- **Delete Player**: Remove player (audit record kept)

### 2. Player Dropdowns in Tournament
- **Location**: Tournament creation page (`/tournament.html`)
- **Select from Dropdown**: Choose existing players instead of typing names
- **No Duplicates**: Selected players excluded from other dropdowns
- **Dynamic Updates**: Dropdowns refresh as you select/deselect players

### 3. Change Tracking
- **Audit Table**: `player_audit` logs all changes
- **Action Types**: CREATE, UPDATE, DELETE
- **Timestamps**: Know when each change happened
- **Old/New Values**: See what changed and how

## Column Additions

### players table
```
account_number VARCHAR(50)    - NEW: Player account identifier
updated_at TIMESTAMP          - NEW: Last modification time
```

### player_audit table (NEW)
```
id SERIAL PRIMARY KEY
player_id VARCHAR(100)        - Foreign key to players
action VARCHAR(20)            - CREATE, UPDATE, DELETE
old_values JSONB              - Previous state
new_values JSONB              - New state
changed_at TIMESTAMP          - When change occurred
```

## User Workflows

### Add a Player
1. Click "Players" in navigation
2. Fill "Player Name", "Team Name", "Account Number"
3. Optionally upload photo
4. Click "Add Player"

### Edit a Player
1. Go to Players page
2. Click blue edit button on player card
3. Change fields you want to update
4. Click "Save Changes"

### Delete a Player
1. Go to Players page
2. Click edit button on player card
3. Click "Delete Player"
4. Confirm deletion

### Create Tournament with Existing Players
1. Go to Tournaments page
2. First player dropdown appears automatically
3. Click "Add Another Player" for each additional player
4. Select players from dropdowns (no duplicates allowed)
5. Select matches per player
6. Click "Create Tournament"

## Testing Checklist
- [ ] Database migration successful
- [ ] Code deployed to Netlify
- [ ] Players page loads and displays
- [ ] Can add new player
- [ ] Can edit player (changes persist)
- [ ] Can delete player
- [ ] Tournament shows player dropdowns
- [ ] Can't select same player twice in tournament
- [ ] Tournament creation works with existing players
- [ ] Leaderboard tracks player stats correctly

## Common Issues

| Issue | Solution |
|-------|----------|
| "Error loading players" | Check get-players.js logs, verify database connection |
| "Cannot add player" | Check all required fields filled, check add-player.js logs |
| "Dropdowns not showing" | Clear browser cache, hard refresh (Ctrl+F5) |
| "Players won't save" | Check update-player.js logs, verify database JSONB support |
| Empty Players list | Add players first from Players page |

## Key Differences from Old System

### Before (Old Player Creation)
```
Tournament Page → Add Player Form → Type Name/Team/Photo → Create each tournament
```

### After (New Player System)
```
Players Page → Create Player Once → Tournament Page → Select from Dropdown → Create Tournament
```

## Benefits
✅ Reuse players across tournaments  
✅ Consistent player data  
✅ Easier tournament creation  
✅ Account number tracking  
✅ Full audit trail of changes  
✅ No duplicate player entry  

## Database Queries

### View all players
```sql
SELECT id, name, team_name, account_number FROM players ORDER BY created_at DESC;
```

### Check audit history
```sql
SELECT * FROM player_audit WHERE player_id = 'player_123' ORDER BY changed_at DESC;
```

### Find player by account
```sql
SELECT * FROM players WHERE account_number = 'ACC123';
```

### Players who played in tournament
```sql
SELECT p.* FROM players p 
JOIN tournament_players tp ON p.id = tp.player_id 
WHERE tp.tournament_id = 'tournament_xyz';
```

## API Examples

### Get all players
```javascript
fetch('/.netlify/functions/get-players')
  .then(r => r.json())
  .then(players => console.log(players))
```

### Add new player
```javascript
fetch('/.netlify/functions/add-player', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'John Doe',
    teamName: 'Team A',
    accountNumber: 'ACC123',
    photoUrl: 'data:image/jpeg;base64,...'
  })
})
```

### Create tournament (new way)
```javascript
fetch('/.netlify/functions/create-tournament', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    playerIds: ['player_1', 'player_2', 'player_3'],
    matchesPerPlayer: 12
  })
})
```

## Documentation Links
- Full Implementation: `PLAYERS_FEATURE_IMPLEMENTATION.md`
- Deployment: `PLAYERS_DEPLOYMENT_GUIDE.md`
- Database Migration: `PLAYERS_DATABASE_MIGRATION.md`
- Main README: `README.md`

## Support
- Check function logs in Netlify dashboard
- Review browser console (F12)
- Query database directly for verification
- Read detailed guides for in-depth info
