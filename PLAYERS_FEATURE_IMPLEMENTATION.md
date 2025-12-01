# Players Feature Implementation Guide

## Overview

This document describes the new **Players Management** feature added to the eFootball League application. This feature allows users to manage a central player database and link players across tournaments, enabling all-time leaderboard tracking.

## Key Features Implemented

### 1. Dedicated Players Management Page
- New `players.html` page with dedicated section for player management
- Add new players with Name, Team Name, Account Number, and Photo
- Edit existing player details (name, team, account number, photo)
- Delete players (with audit trail)
- View all players in attractive card-based layout

### 2. Player Database
- All players stored in central `players` table
- Each player has unique ID (`player_id`)
- Account number field for player identification
- Photo storage (base64 encoded in URL field)
- Timestamps for creation and updates

### 3. Change Tracking
- New `player_audit` table tracks all changes
- Records CREATE, UPDATE, and DELETE actions
- Stores old and new values as JSON
- Full audit trail for compliance and debugging

### 4. Tournament Player Selection
- Tournament creation now uses dropdown select instead of text input
- Only shows players from the central database
- Prevents duplicate player selection
- Updates dropdowns dynamically as players are added

### 5. Account Number Integration
- Every player has an account number field
- Can be used to identify players uniquely
- Displayed in past tournament results and leaderboards

## Files Created

### Frontend

1. **players.html**
   - Main page for player management
   - Form for adding new players
   - Grid display of all players
   - Edit modal for modifying player details

2. **src/js/players.js**
   - `PlayerManager` class handles all player operations
   - Methods:
     - `loadPlayers()` - Fetch all players from API
     - `handleAddPlayer()` - Create new player
     - `openEditModal()` - Display edit form
     - `handleUpdatePlayer()` - Update player details
     - `handleDeletePlayer()` - Remove player

### Backend (Netlify Functions)

1. **netlify/functions/get-players.js**
   - Endpoint: `GET /.netlify/functions/get-players`
   - Returns all players from database
   - Sorted by creation date (newest first)

2. **netlify/functions/add-player.js**
   - Endpoint: `POST /.netlify/functions/add-player`
   - Creates new player in database
   - Logs creation to player_audit table
   - Body: `{ name, teamName, accountNumber, photoUrl }`
   - Returns: `{ playerId, name, teamName, accountNumber }`

3. **netlify/functions/update-player.js**
   - Endpoint: `POST /.netlify/functions/update-player`
   - Updates player details
   - Only updates photo if new one provided
   - Logs changes to player_audit table
   - Body: `{ playerId, name, teamName, accountNumber, photoUrl }`
   - Returns: `{ playerId, name, teamName, accountNumber }`

4. **netlify/functions/delete-player.js**
   - Endpoint: `POST /.netlify/functions/delete-player`
   - Removes player from database
   - Logs deletion to player_audit table
   - Body: `{ playerId }`
   - Returns: `{ message: 'Player deleted successfully' }`

### Modified Files

1. **tournament.html**
   - Updated to use player dropdowns instead of text inputs
   - Added info message directing users to Players page to add new players

2. **src/js/tournament.js**
   - New methods for player dropdown management:
     - `loadAvailablePlayers()` - Fetch all players on page load
     - `addPlayerDropdown()` - Add a player selection dropdown
     - `handlePlayerChange()` - Handle player selection
     - `refreshAllPlayerDropdowns()` - Update dropdowns to exclude selected players
     - `removePlayerDropdown()` - Remove a player from selection
     - `reindexPlayerDropdowns()` - Re-index dropdowns after removal
   - Removed old methods: `addPlayerForm()`, `removePlayerForm()`, `collectPlayers()`, `fileToBase64()`
   - Updated `createTournament()` to send `playerIds` instead of new player objects

3. **netlify/functions/create-tournament.js**
   - Updated to accept `playerIds` array instead of `players` object
   - Fetches existing players from database instead of creating new ones
   - Links players to tournament via `tournament_players` table
   - Still generates fixtures as before

4. **All HTML files** (index.html, tournament.html, past-tournaments.html, leaderboard.html)
   - Added "Players" navigation link between "Past Tournaments" and "Leaderboard"

5. **src/css/style.css**
   - Added styles for Players page
   - Added styles for player card display
   - Added styles for player selection dropdowns
   - Added responsive styles for mobile and tablet views

## Database Schema Changes

### Required SQL Migrations

Run these SQL commands in your Neon database:

```sql
-- Add account_number column to players table
ALTER TABLE players ADD COLUMN account_number VARCHAR(50) NOT NULL DEFAULT '';

-- Add updated_at timestamp
ALTER TABLE players ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create player_audit table for tracking changes
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

-- Create indexes for performance
CREATE INDEX idx_player_audit_player_id ON player_audit(player_id);
CREATE INDEX idx_player_audit_action ON player_audit(action);
CREATE INDEX idx_player_audit_changed_at ON player_audit(changed_at DESC);
CREATE INDEX idx_players_account_number ON players(account_number);
```

### Table Structure

**players table:**
```
id (VARCHAR(100)) - Primary key
name (VARCHAR(255))
team_name (VARCHAR(255))
account_number (VARCHAR(50)) - NEW
photo_url (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP) - NEW
```

**player_audit table:** (NEW)
```
id (SERIAL) - Primary key
player_id (VARCHAR(100)) - Foreign key to players.id
action (VARCHAR(20)) - CREATE, UPDATE, DELETE
old_values (JSONB) - Previous state
new_values (JSONB) - New state
changed_at (TIMESTAMP)
created_at (TIMESTAMP)
```

## User Workflows

### Adding a New Player

1. Navigate to "Players" page from navigation menu
2. Fill in player details:
   - Player Name (required)
   - Team Name (required)
   - Account Number (required)
   - Photo (optional, can add later)
3. Click "Add Player"
4. Player appears in the grid below

### Editing a Player

1. Go to "Players" page
2. Click the blue edit button (pencil icon) on any player card
3. Modify the details you want to change
4. Click "Save Changes"
5. Updates take effect immediately

### Deleting a Player

1. Go to "Players" page
2. Click the blue edit button on a player card
3. Click "Delete Player" button
4. Confirm deletion
5. Player is removed (but audit record is kept)

### Creating a Tournament with Existing Players

1. Navigate to "Tournaments" page
2. Add players by clicking "Add Another Player" to create dropdowns
3. Select existing players from the dropdowns (one per dropdown)
4. Cannot select the same player twice
5. Available players update as you select them
6. Select matches per player
7. Click "Create Tournament"
8. Tournament is created with selected players (no new player creation)

## Key Improvements

1. **Centralized Player Database**
   - Players created once, used across multiple tournaments
   - Consistent player data
   - Easy to manage and update player info

2. **Change Tracking**
   - Full audit trail of all changes
   - Know who changed what and when
   - Compliance and debugging support

3. **Account Number Integration**
   - Players can be identified by account number
   - Useful for in-game account integration
   - Shows in leaderboards and results

4. **Better Tournament Creation**
   - No need to re-enter player info for each tournament
   - Prevents duplicate players in tournament
   - Faster tournament setup

5. **All-Time Leaderboard Ready**
   - Player IDs are consistent across tournaments
   - Can now track stats across tournaments
   - Foundation for all-time leaderboard calculations

## Future Enhancements

1. **Search and Filter**
   - Search players by name or account number
   - Filter by team
   - Sort by various criteria

2. **Player Import/Export**
   - Bulk import players from CSV
   - Export player list
   - Integration with external systems

3. **Advanced Statistics**
   - Player career statistics
   - Historical comparisons
   - Performance trends

4. **Team Management**
   - Create teams and assign players
   - Team-based leaderboards
   - Team statistics

5. **Player Availability**
   - Mark players as active/inactive
   - Track player availability for tournaments
   - Prevent deleted players from being selected

## Troubleshooting

### Players List is Empty

1. Check database connection
2. Run database migrations (see PLAYERS_DATABASE_MIGRATION.md)
3. Ensure `players` table exists and has records

### Cannot Select Player in Tournament

1. Go to Players page and add some players first
2. Make sure players have all required fields (name, team, account number)
3. Check browser console for error messages

### Edit Modal Not Showing

1. Clear browser cache
2. Refresh the page
3. Check if players.js is loaded in browser console

### Dropdowns Not Updating

1. Make sure all selected players have valid IDs
2. Check browser console for JavaScript errors
3. Try refreshing the page

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/.netlify/functions/get-players` | Get all players |
| POST | `/.netlify/functions/add-player` | Create new player |
| POST | `/.netlify/functions/update-player` | Update player details |
| POST | `/.netlify/functions/delete-player` | Delete player |
| POST | `/.netlify/functions/create-tournament` | Create tournament (modified) |

## Testing Checklist

- [ ] Navigate to Players page - should load without errors
- [ ] Add a new player - should appear in grid immediately
- [ ] Edit a player - changes should save and display
- [ ] Delete a player - should remove from grid
- [ ] Create tournament - can select players from dropdown
- [ ] Select same player twice - second dropdown should exclude it
- [ ] Remove player from tournament - dropdown should update
- [ ] Complete tournament - should track stats by player_id
- [ ] View leaderboard - should show player stats

## Database Backup

Before running database migrations, backup your database:
1. Go to Neon console
2. Create a branch for backup
3. Run migrations on main branch
4. Verify everything works
5. Delete backup branch

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Check database for data integrity
4. Review function logs in Netlify dashboard
