# System Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  index.html  │  │tournament.html│  │leaderboard.html│     │
│  │  (Home Page) │  │  (Create/View)│  │   (Stats)      │     │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘       │
│         │                 │                  │               │
│  ┌──────▼─────────────────▼──────────────────▼──────┐        │
│  │            JavaScript (app.js, tournament.js)     │       │
│  │  - Event handling                                │        │
│  │  - DOM rendering                                │        │
│  │  - Form validation                              │        │
│  └──────┬────────────────────────────────────────────┘       │
│         │                                                    │
│  ┌──────▼─────────────────────────────────────────┐         │
│  │       CSS (style.css - Dark Sporty Theme)      │         │
│  │  - Responsive layouts (mobile/tablet/desktop)  │         │
│  │  - Dark colors (#0a0a0a, #1a1a1a)              │         │
│  │  - Neon accents (#00ff88, #0099ff)             │         │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ Fetch API (JSON)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              NETLIFY FUNCTIONS (Serverless)                  │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │ create-tournament│  │ get-tournaments│                      │
│  │                 │  │                 │                     │
│  │ • Validates data│  │ • Filter by ID  │                     │
│  │ • Generates      │  │ • Filter status │                     │
│  │   fixtures       │  │ • Aggregates    │                     │
│  │ • Init stats    │  │   counts        │                     │
│  └────────┬────────┘  └────────┬────────┘                     │
│           │                    │                              │
│  ┌────────▼────────┐  ┌────────▼────────┐                     │
│  │   get-stats     │  │   get-matches   │                     │
│  │                 │  │                 │                     │
│  │ • Tournament    │  │ • By tournament │                     │
│  │   leaderboard   │  │ • By status     │                     │
│  │ • All-time      │  │ • With limits   │                     │
│  │   aggregation   │  │                 │                     │
│  └────────┬────────┘  └────────┬────────┘                     │
│           │                    │                              │
│           │    ┌───────────────┘                              │
│           │    │                                              │
│  ┌────────▼────▼────────────────┐                             │
│  │    update-match              │                             │
│  │                              │                             │
│  │ • Records match result       │                             │
│  │ • Updates stats              │                             │
│  │ • Checks auto-completion     │                             │
│  │ • Marks winner               │                             │
│  └────────┬─────────────────────┘                             │
│           │                                                   │
└───────────┼──────────────────────────────────────────────────┘
            │ SQL Queries
            │
┌───────────▼──────────────────────────────────────────────────┐
│           NETLIFY DB (SQLite Database)                        │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐      │
│  │   players    │  │ tournaments  │  │tournament_     │      │
│  │              │  │              │  │players         │      │
│  │ • id         │  │ • id         │  │                │      │
│  │ • name       │  │ • name       │  │ • tournament_id│      │
│  │ • team_name  │  │ • status     │  │ • player_id    │      │
│  │ • photo_url  │  │ • matches_pp │  │                │      │
│  │ • created_at │  │ • created_at │  │                │      │
│  │              │  │ • completed  │  │                │      │
│  └──────────────┘  └──────────────┘  └────────────────┘      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐      │
│  │   matches    │  │tournament_   │  │ all_time_stats │      │
│  │              │  │stats         │  │                │      │
│  │ • id         │  │              │  │ • player_id    │      │
│  │ • tournament │  │ • tournament │  │ • total_goals  │      │
│  │   _id        │  │   _id        │  │ • total_pts    │      │
│  │ • player_a   │  │ • player_id  │  │ • tournaments_ │      │
│  │ • player_b   │  │ • games_     │  │   won          │      │
│  │ • goals_a    │  │   played     │  │ • biggest_win  │      │
│  │ • goals_b    │  │ • wins       │  │ • best_team    │      │
│  │ • status     │  │ • goals_     │  │                │      │
│  │ • match_date │  │   scored     │  │                │      │
│  │              │  │ • points     │  │                │      │
│  └──────────────┘  └──────────────┘  └────────────────┘      │
│                                                                 │
│  Relationships:                                                 │
│  ├─ tournament_players → tournaments + players                │
│  ├─ matches → tournaments + players                            │
│  ├─ tournament_stats → tournaments + players                   │
│  └─ all_time_stats → players                                   │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## User Interaction Flow

```
START
  │
  ├─► [Home Page]
  │    │
  │    ├─► View Ongoing Tournament
  │    │    └─► [Tournament View] ──────────┐
  │    │                                     │
  │    ├─► View Past Tournaments           │
  │    │    └─► [Past Tournaments Page]    │
  │    │         └─► Click tournament ─────┤
  │    │                                    ▼
  │    └─► Click "Create Tournament" ──► [Tournament Create]
  │                                       │
  │                                       ├─► Add Players (3+)
  │                                       │
  │                                       ├─► Select Matches per Player
  │                                       │
  │                                       └─► Create
  │                                           │
  │                                           ▼
  │                                       [Tournament View]
  │                                           │
  │                                           ├─► View Leaderboard
  │                                           │    ├─ Live Rankings
  │                                           │    ├─ Player Stats
  │                                           │    └─ Goal Difference
  │                                           │
  │                                           ├─► Click "Add Match"
  │                                           │    │
  │                                           │    ├─► Select Player A
  │                                           │    │
  │                                           │    ├─► Select Player B
  │                                           │    │
  │                                           │    ├─► Enter Goals
  │                                           │    │
  │                                           │    └─► Submit
  │                                           │        │
  │                                           │        ├─ Update Stats
  │                                           │        ├─ Refresh Leaderboard
  │                                           │        └─ Check Completion
  │                                           │
  │                                           ├─ All Matches Complete?
  │                                           │  YES ──► Mark Complete
  │                                           │          Record Winner
  │                                           │          Move to Past
  │                                           │
  │                                           └─► View Leaderboard Page
  │
  └─► [Leaderboard Page]
       │
       └─► View All-Time Stats
            ├─ Aggregate across tournaments
            ├─ Total wins/goals/tournaments
            ├─ Rankings
            └─ Head-to-head comparison

END
```

---

## Fixture Generation Algorithm

```
INPUT: playerCount, matchesPerPlayer

STEP 1: Calculate possible pairs
  pairs = (playerCount × (playerCount - 1)) / 2

STEP 2: Calculate matches per pair
  matchesPerPair = matchesPerPlayer / pairs

STEP 3: Generate fixtures (bidirectional)
  FOR each player i (0 to playerCount-1):
    FOR each player j (i+1 to playerCount-1):
      FOR each match k (0 to matchesPerPair-1):
        CREATE match: i vs j (Player A = i, Player B = j)
        CREATE match: j vs i (Player A = j, Player B = i)
        
TOTAL MATCHES = pairs × matchesPerPair × 2

EXAMPLE (3 players, 12 matches):
  pairs = 3 × 2 / 2 = 3
  matchesPerPair = 12 / 3 = 4
  Matches generated:
    P1 vs P2 (4 times)
    P1 vs P3 (4 times)
    P2 vs P3 (4 times)
    P2 vs P1 (4 times)
    P3 vs P1 (4 times)
    P3 vs P2 (4 times)
  Total = 24 matches
```

---

## Stats Calculation Flow

```
WHEN: Match submitted with scores

┌─ Match recorded as "completed"
│
├─ Determine result
│  ├─ IF goalsA > goalsB: Player A wins (3 pts)
│  ├─ IF goalsA = goalsB: Draw (1 pt each)
│  └─ IF goalsA < goalsB: Player B wins (3 pts)
│
├─ UPDATE tournament_stats for BOTH players
│  ├─ games_played + 1
│  ├─ wins / draws / losses
│  ├─ goals_scored + goalsA/B
│  ├─ goals_conceded + goalsB/A
│  └─ points + 3/1/0
│
├─ UPDATE all_time_stats for BOTH players
│  ├─ total_matches + 1
│  ├─ total_wins / draws / losses
│  ├─ total_goals + goalsA/B
│  ├─ total_points + 3/1/0
│  └─ biggest_win (if applicable)
│
├─ CALCULATE leaderboard ranks
│  ├─ Sort by points DESC
│  ├─ Tiebreak: goal difference DESC
│  └─ Tiebreak: goals scored DESC
│
└─ CHECK tournament completion
   ├─ Count remaining "scheduled" matches
   ├─ IF count = 0:
   │  ├─ Mark tournament as "completed"
   │  ├─ Find player with most points
   │  └─ Increment tournaments_won
   └─ Broadcast update to leaderboard
```

---

## Mobile Responsive Strategy

```
Desktop (>1200px)
┌──────────────────────────────────────────┐
│  NAVBAR (full menu)                      │
├──────────────────────────────────────────┤
│  HERO SECTION (2-column grid)            │
│  ┌────────────────┬─────────────┐        │
│  │ Title & Button │   Image     │        │
│  └────────────────┴─────────────┘        │
├──────────────────────────────────────────┤
│  LEADERBOARD (multiple columns)          │
│  Rank│Player│Team│W│L│G│Pts│...        │
├──────────────────────────────────────────┤
│  FOOTER                                  │
└──────────────────────────────────────────┘

Tablet (768-1199px)
┌──────────────────────────────────────────┐
│  NAVBAR (toggle button)                  │
├──────────────────────────────────────────┤
│  HERO SECTION (1-column, centered)       │
│  ┌────────────────────────────────────┐  │
│  │ Title & Button                     │  │
│  ├────────────────────────────────────┤  │
│  │ Image                              │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  LEADERBOARD (condensed)                 │
│  Rank│Player│Pts                        │
├──────────────────────────────────────────┤
│  FOOTER                                  │
└──────────────────────────────────────────┘

Mobile (iPhone 16 - 390-430px)
┌──────────────────────────────────────────┐
│  NAVBAR (icon-based)                     │
├──────────────────────────────────────────┤
│  HERO SECTION (stacked)                  │
│  ┌────────────────────────────────────┐  │
│  │ Title                              │  │
│  ├────────────────────────────────────┤  │
│  │ Subtitle                           │  │
│  ├────────────────────────────────────┤  │
│  │ Full-width Button                  │  │
│  ├────────────────────────────────────┤  │
│  │ Image (100% width)                 │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  LEADERBOARD (single column)             │
│  ┌────────────────────────────────────┐  │
│  │ #1 - Player Name (12pt)            │  │
│  │ Points: 15                         │  │
│  ├────────────────────────────────────┤  │
│  │ #2 - Player Name (12pt)            │  │
│  │ Points: 12                         │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  FOOTER                                  │
└──────────────────────────────────────────┘
```

---

## Color Theme Architecture

```
┌─ Primary Background
│  └─ #0a0a0a (Pure Black)
│     └─ Used: Body, Page backgrounds
│
├─ Secondary Background
│  └─ #1a1a1a (Dark Charcoal)
│     └─ Used: Cards, Containers
│
├─ Accent Colors
│  ├─ Primary: #00ff88 (Neon Green)
│  │  └─ Used: Buttons, Links, Highlights
│  │
│  ├─ Secondary: #0099ff (Electric Blue)
│  │  └─ Used: Secondary buttons, Accents
│  │
│  └─ Tertiary: #8a2be2 (Purple)
│     └─ Used: Special highlights
│
├─ Text Colors
│  ├─ Primary: #ffffff (White)
│  │  └─ Used: Main text
│  │
│  └─ Secondary: #b0b0b0 (Gray)
│     └─ Used: Secondary text, Labels
│
└─ Status Colors
   ├─ Success: #00ff88 (Green)
   ├─ Error: #ff4444 (Red)
   └─ Warning: #ffaa00 (Orange)
```

---

## Database Index Strategy

```
OPTIMIZED QUERIES:

Players Table:
  ├─ PRIMARY KEY: id
  └─ Used by: matches, tournament_players, stats

Tournaments Table:
  ├─ PRIMARY KEY: id
  ├─ INDEX: status (for filtering ongoing/completed)
  └─ INDEX: created_at (for ordering)

Matches Table:
  ├─ PRIMARY KEY: id
  ├─ INDEX: tournament_id (for filtering)
  ├─ INDEX: status (for counting remaining)
  └─ INDEX: (tournament_id, status) composite

Tournament Stats:
  ├─ PRIMARY KEY: (tournament_id, player_id)
  ├─ INDEX: (tournament_id, points) for ranking
  └─ Used by: leaderboard queries

All-Time Stats:
  ├─ PRIMARY KEY: player_id
  └─ INDEX: total_points (for all-time ranking)

AGGREGATE QUERIES (optimized):
  ├─ COUNT() matches by tournament/status
  ├─ SUM() goals, wins, etc.
  └─ GROUP BY player for rankings
```

---

## Error Handling Architecture

```
FRONTEND
└─ try/catch blocks
   ├─ Fetch errors → Toast notification
   ├─ Validation errors → Form feedback
   ├─ Data errors → Graceful fallback
   └─ Network errors → Retry message

BACKEND (Netlify Functions)
└─ try/catch blocks
   ├─ Database errors → 500 response
   ├─ Validation errors → 400 response
   ├─ Not found → 404 response
   ├─ All errors logged
   └─ User-friendly messages returned

DATABASE
└─ Constraints
   ├─ Foreign keys
   ├─ NOT NULL constraints
   ├─ Data type validation
   └─ Transaction rollback on error
```

---

## Deployment Architecture

```
GITHUB REPO
    ↓
    └─► (push) ──────────┐
                          ▼
                    NETLIFY HOOKS
                          │
                          ├─► Build (static site)
                          │
                          ├─► Deploy Functions
                          │    ├─ create-tournament.js
                          │    ├─ get-tournaments.js
                          │    ├─ get-stats.js
                          │    ├─ get-matches.js
                          │    └─ update-match.js
                          │
                          ├─► Deploy Static Assets
                          │    ├─ index.html
                          │    ├─ style.css
                          │    └─ app.js
                          │
                          └─► Link Database
                               └─ Execute schema.sql
                                  ├─ Create tables
                                  ├─ Set constraints
                                  └─ Build indexes

LIVE SITE
    ├─► FRONTEND
    │    ├─ Static HTML/CSS/JS
    │    └─ Cached globally (CDN)
    │
    └─► BACKEND
         ├─ Netlify Functions (serverless)
         ├─ Netlify DB (SQLite)
         └─ Auto-scaling (no server management)
```

---

## Security Architecture

```
FRONTEND
├─ No credentials in localStorage
├─ Form validation before submit
├─ XSS prevention (template literals)
└─ CSRF handled by Netlify

BACKEND
├─ No credentials in code
├─ Input validation on all endpoints
├─ SQL injection prevention (parameterized queries)
└─ Error messages don't expose internals

DATABASE
├─ Access via functions only
├─ No direct connections from browser
├─ Automatic backups
└─ Referential integrity constraints

DEPLOYMENT
├─ HTTPS enforced
├─ Environment variables managed by Netlify
├─ No hardcoded secrets
└─ Automatic security updates
```

---

**System Architecture Document**
**Version**: 1.0
**Status**: Production Ready
