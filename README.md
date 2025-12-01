# eFootball League Tournament System

A modern, responsive web application for managing eFootball tournaments with persistent data storage, leaderboards, and match tracking.

## Features

- **Players Management**: Centralized player database with add/edit/delete functionality
- **Account Number Integration**: Track players by account number across tournaments
- **Tournament Management**: Create tournaments with auto-naming (WEEK 1, WEEK 2, etc.)
- **Player Registration**: Select existing players for tournaments instead of creating new ones
- **Fixture Auto-Generation**: Automatically creates all matches based on player count
- **Match Tracking**: Record match results with automatic stats calculation
- **Change Audit Trail**: Full audit history of all player modifications
- **Live Leaderboards**: Real-time tournament and all-time leaderboards
- **Persistent Storage**: All data stored in Neon PostgreSQL (no data loss)
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile (iPhone 16 Pro/Pro Max)
- **Dark Sporty Theme**: Modern UI with neon green and electric blue accents

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Netlify Functions
- **Database**: Neon PostgreSQL (powered by Neon)
- **Hosting**: Netlify

## Project Structure

```
efootbal-league/
├── src/
│   ├── css/
│   │   └── style.css          # All styling (responsive, dark theme)
│   ├── js/
│   │   ├── app.js             # Home page logic
│   │   ├── tournament.js       # Tournament creation and view
│   │   ├── players.js          # Player management logic
│   │   └── utils.js           # Utility functions
│   └── images/                # Placeholder for images
├── netlify/
│   └── functions/
│       ├── create-tournament.js    # Tournament creation endpoint
│       ├── get-tournaments.js      # Fetch tournaments
│       ├── get-stats.js            # Get leaderboard stats
│       ├── get-matches.js          # Get matches
│       ├── update-match.js         # Record match results
│       ├── get-players.js          # Fetch all players
│       ├── add-player.js           # Create new player
│       ├── update-player.js        # Update player details
│       └── delete-player.js        # Delete player
├── index.html                 # Home page
├── tournament.html            # Tournament create/view
├── players.html               # Player management
├── leaderboard.html           # All-time leaderboard
├── past-tournaments.html      # Completed tournaments list
├── netlify.toml              # Netlify config
├── PLAYERS_FEATURE_IMPLEMENTATION.md  # Detailed players feature guide
└── PLAYERS_DEPLOYMENT_GUIDE.md        # Deployment instructions
```

## Setup Instructions

### Prerequisites
- Node.js 16+
- Netlify CLI: `npm install -g netlify-cli`
- Git

### Local Development

1. **Clone and install**
   ```bash
   cd efootbal-league
   npm install
   ```

2. **Initialize Netlify DB**
   ```bash
   netlify db init
   ```

3. **Apply schema**
   ```bash
   netlify db push netlify/db/schema.sql
   ```

4. **Start local dev server**
   ```bash
   netlify dev
   ```

5. **Access at** `http://localhost:8888`

### Deployment to Netlify

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. **Connect to Netlify**
   ```bash
   netlify connect
   ```

3. **Deploy**
   ```bash
   netlify deploy
   ```

4. **Verify DB in Netlify UI**
   - Go to Netlify Dashboard → Your Site → Database
   - Confirm tables are created

## Database Schema

### Players
- `id`: Unique player ID
- `name`: Player name
- `team_name`: Team affiliation
- `account_number`: Player account ID (NEW)
- `photo_url`: Player photo URL
- `created_at`: Registration timestamp
- `updated_at`: Last update timestamp (NEW)

### Tournaments
- `id`: Tournament ID
- `name`: Tournament name (auto-generated: WEEK 1, WEEK 2, etc.)
- `status`: `ongoing` or `completed`
- `matches_per_player`: Total matches each player plays
- `created_at`: Start timestamp
- `completed_at`: Completion timestamp

### Matches
- `id`: Match ID
- `tournament_id`: Foreign key to tournament
- `player_a_id`, `player_b_id`: Players in match
- `goals_a`, `goals_b`: Goals scored
- `status`: `scheduled` or `completed`
- `match_date`: When match was played

### Tournament Stats
- Per-tournament stats for each player
- Tracks wins, draws, losses, goals, points

### All-Time Stats
- Aggregate stats across all tournaments
- Tracks total wins, goals, tournaments won, etc.

### Player Audit (NEW)
- `id`: Audit record ID
- `player_id`: Reference to player
- `action`: CREATE, UPDATE, or DELETE
- `old_values`: Previous state (JSON)
- `new_values`: New state (JSON)
- `changed_at`: Timestamp of change

## Features Breakdown

### 1. Player Management (NEW)
- **Players Page**: Dedicated page for managing players
- **Add Players**: Create players with name, team, account number, photo
- **Edit Players**: Update any player information
- **Delete Players**: Remove players (audit trail maintained)
- **Change Tracking**: All modifications logged in player_audit table
- **Card Layout**: Beautiful card-based display of all players

### 2. Create Tournament
- Auto-generates next week name
- Select 3+ existing players from dropdown
- Cannot select same player twice (dynamically excluded)
- Select matches per player (auto-calculated based on player count)
- Validates minimum 3 players

### 3. Player Registration
- Players created independently on Players page
- Account number required for identification
- Photos stored as base64 in database
- Auto-assigned unique player ID
- Reusable across multiple tournaments

### 4. Matches Per Player Logic
For `n` players:
- Possible pairs = `n * (n-1) / 2`
- Each pair plays: 2, 4, 6, 8, 10, 12... times
- Maximum 24 matches per player

Example (3 players):
- Pairs = 3, so options: 6, 12, 18, 24 matches

Example (4 players):
- Pairs = 6, so options: 12, 24 matches

### 5. Fixture Generation
- Creates bidirectional matches (A vs B and B vs A)
- All matches initially `scheduled`
- Uses existing player IDs from database
- Total matches = pairs × matches_per_pair × 2

### 6. Match Submission
- Select two players
- Input goals for each
- System auto-calculates:
  - Winner/draw
  - Points (3 for win, 1 for draw, 0 for loss)
  - Updates leaderboard with player_id reference

### 7. Tournament Completion
- End League button marks tournament as finished
- All matches set to `ENDED` status
- Tournament completion recorded
- Results viewable in Past Tournaments

### 8. Leaderboards
- **Tournament Leaderboard**: Ranked by points, goal difference
- **All-Time Leaderboard**: Aggregates across all tournaments
- **Player Stats**: Tracked by player_id for consistency across tournaments

## API Endpoints

### POST /netlify/functions/create-tournament
Creates a new tournament with existing players.

Request:
```json
{
  "playerIds": ["player_1", "player_2", "player_3"],
  "matchesPerPlayer": 12
}
```

### GET /netlify/functions/get-players
Fetch all players from database.

Returns:
```json
[
  {
    "id": "player_1",
    "name": "John Doe",
    "team_name": "Team A",
    "account_number": "ACC123",
    "photo_url": "data:image/jpeg;base64,..."
  }
]
```

### POST /netlify/functions/add-player
Create a new player.

Request:
```json
{
  "name": "John Doe",
  "teamName": "Team A",
  "accountNumber": "ACC123",
  "photoUrl": "data:image/jpeg;base64,..."
}
```

### POST /netlify/functions/update-player
Update player details.

Request:
```json
{
  "playerId": "player_1",
  "name": "John Doe",
  "teamName": "Team A",
  "accountNumber": "ACC123",
  "photoUrl": "data:image/jpeg;base64,..."
}
```

### POST /netlify/functions/delete-player
Delete a player (audit trail maintained).

Request:
```json
{
  "playerId": "player_1"
}
```

### GET /netlify/functions/get-tournaments
Fetch tournaments by status or ID.

Params:
- `status`: `ongoing` or `completed`
- `id`: Specific tournament ID
- `limit`: Max results

### GET /netlify/functions/get-stats
Get leaderboard stats.

Params:
- `type`: `tournament` or `all-time`
- `tournament_id`: For tournament stats
- `limit`: Max results

### GET /netlify/functions/get-matches
Get matches from a tournament.

Params:
- `tournament_id`: Tournament ID
- `status`: `scheduled` or `completed`
- `limit`: Max results

### POST /netlify/functions/update-match
Record a match result.

Request:
```json
{
  "matchId": "match_xyz",
  "goalsA": 3,
  "goalsB": 1
}
```

## Responsive Design

### Desktop (1200px+)
- Full-width layout
- Grid-based leaderboards
- All columns visible

### Tablet (768px - 1199px)
- Responsive navigation
- Single-column tables on mobile
- Optimized spacing

### Mobile (iPhone 16 Pro/Pro Max - 480px)
- Hamburger menu (ready for implementation)
- Stacked single-column layout
- Touch-friendly buttons (min 44px)
- Optimized font sizes
- Full-width inputs and buttons

## Styling

### Color Scheme (Dark Sporty)
- Background: `#0a0a0a` (pure black)
- Secondary: `#1a1a1a` (dark charcoal)
- Accent Green: `#00ff88` (neon)
- Accent Blue: `#0099ff` (electric)
- Text Primary: `#ffffff`
- Text Secondary: `#b0b0b0`

### CSS Variables
All colors defined in `:root` for easy customization.

## Recent Updates (Players Feature)

- ✅ Centralized player database
- ✅ Account number integration
- ✅ Player CRUD operations with audit trail
- ✅ Tournament creation with existing players
- ✅ Dynamic player dropdown exclusion
- ✅ Players management page
- ✅ Full change tracking and audit logs

## Future Enhancements

- [ ] Player search and filter
- [ ] Bulk import players from CSV
- [ ] Edit/delete match results
- [ ] Player availability/status tracking
- [ ] Mobile hamburger menu navigation
- [ ] Advanced leaderboard filters
- [ ] Export tournament results
- [ ] Admin authentication
- [ ] Real-time match notifications
- [ ] Team-based leaderboards
- [ ] Player photo upload to cloud storage

## Troubleshooting

### Matches not showing up
- Verify tournament ID in URL
- Check Netlify DB has data with `netlify db shell`

### Leaderboard not updating
- Ensure match status is `completed`
- Check stats calculation in update-match.js

### Photos not displaying
- Verify photo URLs are accessible
- Use fallback default avatar

### Local dev not working
- Run `netlify build` to check build errors
- Clear `.netlify` cache and reinstall

## License

MIT License - Free to use and modify
