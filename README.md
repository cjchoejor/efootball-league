# eFootball League Tournament System

A modern, responsive web application for managing eFootball tournaments with persistent data storage, leaderboards, and match tracking.

## Features

- **Tournament Management**: Create tournaments with auto-naming (WEEK 1, WEEK 2, etc.)
- **Player Registration**: Add players with photos, names, and team affiliations
- **Fixture Auto-Generation**: Automatically creates all matches based on player count
- **Match Tracking**: Record match results with automatic stats calculation
- **Live Leaderboards**: Real-time tournament and all-time leaderboards
- **Persistent Storage**: All data stored in Netlify DB (no data loss)
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile (iPhone 16 Pro/Pro Max)
- **Dark Sporty Theme**: Modern UI with neon green and electric blue accents

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Netlify Functions
- **Database**: Netlify DB (SQLite)
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
│   │   └── utils.js           # Utility functions
│   └── images/                # Placeholder for images
├── netlify/
│   ├── db/
│   │   └── schema.sql         # Database schema
│   └── functions/
│       ├── create-tournament.js    # Tournament creation endpoint
│       ├── get-tournaments.js      # Fetch tournaments
│       ├── get-stats.js            # Get leaderboard stats
│       ├── get-matches.js          # Get matches
│       └── update-match.js         # Record match results
├── index.html                 # Home page
├── tournament.html            # Tournament create/view
├── leaderboard.html           # All-time leaderboard
├── past-tournaments.html      # Completed tournaments list
└── netlify.toml              # Netlify config
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
- `photo_url`: Player photo URL
- `created_at`: Registration timestamp

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

## Features Breakdown

### 1. Create Tournament
- Auto-generates next week name
- Add 3+ players with photos and team names
- Select matches per player (auto-calculated based on player count)
- Validates minimum 3 players

### 2. Player Registration
- Player name, team name, photo URL
- Photos stored via Netlify DB
- Auto-assigned unique player ID

### 3. Matches Per Player Logic
For `n` players:
- Possible pairs = `n * (n-1) / 2`
- Each pair plays: 2, 4, 6, 8, 10, 12... times
- Maximum 24 matches per player

Example (3 players):
- Pairs = 3, so options: 6, 12, 18, 24 matches

Example (4 players):
- Pairs = 6, so options: 12, 24 matches

### 4. Fixture Generation
- Creates bidirectional matches (A vs B and B vs A)
- All matches initially `scheduled`
- Total matches = pairs × matches_per_pair × 2

### 5. Match Submission
- Select two players
- Input goals for each
- System auto-calculates:
  - Winner/draw
  - Points (3 for win, 1 for draw, 0 for loss)
  - Updates leaderboard

### 6. Tournament Auto-Completion
- When all matches are completed
- Marks tournament as `completed`
- Records tournament winner

### 7. Leaderboards
- **Tournament Leaderboard**: Ranked by points, goal difference
- **All-Time Leaderboard**: Aggregates across all tournaments

## API Endpoints

### POST /netlify/functions/create-tournament
Creates a new tournament with players.

Request:
```json
{
  "players": [
    {
      "id": "player_1",
      "name": "John Doe",
      "teamName": "Team A",
      "photoUrl": "https://..."
    }
  ],
  "matchesPerPlayer": 12
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

## Future Enhancements

- [ ] Player photo upload to Netlify Blob storage
- [ ] Edit/delete match results
- [ ] Delete players (cascade delete unpublished fixtures)
- [ ] Mobile hamburger menu navigation
- [ ] Search and filter leaderboards
- [ ] Export tournament results
- [ ] Admin authentication
- [ ] Real-time match notifications
- [ ] Team-based leaderboards

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
