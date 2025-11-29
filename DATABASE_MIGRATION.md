# Database Migration - Add league_status to matches table

## Required SQL Changes

Run this SQL in your Neon database to add the `league_status` column to the matches table:

```sql
-- Add league_status column to matches table
ALTER TABLE matches ADD COLUMN league_status VARCHAR(50) DEFAULT 'ongoing';

-- Create index for faster queries
CREATE INDEX idx_matches_league_status ON matches(league_status);

-- Create index for tournament_id and league_status combinations
CREATE INDEX idx_matches_tournament_league ON matches(tournament_id, league_status);
```

## What This Does

1. **Adds `league_status` column** to the `matches` table with two possible values:
   - `'ongoing'` - Default for all new matches
   - `'ENDED'` - Set when the league is ended via the "End League" button

2. **Creates indexes** for better query performance when filtering by league status

## Implementation

This migration is automatically applied when:
- New tournaments are created (all new matches get `league_status = 'ongoing'`)
- The "End League" button is clicked (all matches get `league_status = 'ENDED'`)

## Backward Compatibility

- Existing matches will default to `'ongoing'`
- No data loss
- Can be safely applied to existing databases
