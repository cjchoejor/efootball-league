# Database Migration - Add Players Management Features

## Required SQL Changes

Run this SQL in your Neon database to add support for player management:

```sql
-- Add account_number column to players table
ALTER TABLE players ADD COLUMN account_number VARCHAR(50) NOT NULL DEFAULT '';

-- Add timestamps if not already present
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

-- Create indexes for better query performance
CREATE INDEX idx_player_audit_player_id ON player_audit(player_id);
CREATE INDEX idx_player_audit_action ON player_audit(action);
CREATE INDEX idx_player_audit_changed_at ON player_audit(changed_at DESC);
CREATE INDEX idx_players_account_number ON players(account_number);
```

## What This Does

1. **Adds `account_number` column** to the `players` table
   - Required field for player identification
   - Can be user's in-game account number or ID

2. **Adds `updated_at` timestamp** to track when players were last modified

3. **Creates `player_audit` table** to track all changes
   - `player_id`: Reference to the player being modified
   - `action`: Type of change (CREATE, UPDATE, DELETE)
   - `old_values`: Previous state (as JSON)
   - `new_values`: New state (as JSON)
   - `changed_at`: Timestamp of the change

4. **Creates indexes** for:
   - Fast lookups by player_id in audit table
   - Fast lookups by action type
   - Reverse chronological queries for recent changes
   - Account number searches

## Features This Enables

- **Player Management Page**: Add, edit, delete players independently from tournaments
- **Change Tracking**: Full audit trail of all player modifications
- **Account Integration**: Track player accounts across all tournaments
- **Unique Account Numbers**: Ability to search and identify players by account number

## Implementation Details

The following Netlify functions use these new features:

- `get-players.js` - Retrieves all players
- `add-player.js` - Creates new player with account_number, logs to audit table
- `update-player.js` - Updates player details, logs changes to audit table
- `delete-player.js` - Removes player, logs deletion to audit table

## Backward Compatibility

- Existing `players` table rows will get empty string as default `account_number`
- No data loss
- Existing tournament functionality continues to work
- Can be safely applied to existing databases

## Migration Steps

1. Copy the SQL above
2. Go to your Neon dashboard
3. Connect to your database
4. Run the SQL commands
5. Verify tables and columns are created
6. Deploy the updated application code
