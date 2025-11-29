# Quick Reference Guide

## File Locations & Purposes

```
📁 Root
├── 📄 index.html                    Home page (ongoing tournament, previews)
├── 📄 tournament.html               Create/view tournament
├── 📄 leaderboard.html              All-time leaderboard
├── 📄 past-tournaments.html         Completed tournaments
├── 📄 netlify.toml                  Netlify configuration
├── 📄 README.md                     Complete documentation
├── 📄 DEPLOY.md                     Deployment instructions
├── 📄 REFINEMENTS.md                All changes applied
├── 📄 CHECKLIST.md                  Implementation status
└── 📄 QUICK_REFERENCE.md            This file

📁 src/
├── 📁 css/
│   └── style.css                    All styling (dark theme, responsive)
├── 📁 js/
│   ├── app.js                       Home page logic & renders
│   ├── tournament.js                Tournament creation & viewing
│   └── utils.js                     Utility functions & storage
└── 📁 images/
    └── [placeholder for images]

📁 netlify/
├── 📁 db/
│   └── schema.sql                   Database schema (6 tables)
└── 📁 functions/
    ├── create-tournament.js         Create tournament + fixtures
    ├── get-tournaments.js           Fetch tournaments
    ├── get-stats.js                 Get leaderboard stats
    ├── get-matches.js               Get tournament matches
    └── update-match.js              Record match & auto-complete
```

---

## Common Tasks

### Create a Tournament
```
1. Click "Create Tournament" on home
2. Add 3+ players (name, team, photo URL)
3. Select matches per player
4. Click "Create Tournament"
```

### Record a Match
```
1. Go to ongoing tournament
2. Click "Add Match Result"
3. Select Player A and Player B
4. Enter goals for each
5. Click "Submit Result"
6. Leaderboard updates automatically
```

### View Leaderboards
```
Tournament:  Tournament page → Leaderboard section
All-time:    Click "Leaderboard" in nav
```

### Deploy to Netlify
```
1. git add . && git commit -m "message"
2. git push
3. Netlify auto-deploys
4. Enable DB in Dashboard
5. Push schema: netlify db push netlify/db/schema.sql
```

---

## Key Calculations

### Matches Per Player Options
```
Formula: (n × (n-1) / 2) × multiplier

Example (3 players):
- Pairs = 3 × 2 / 2 = 3
- Options: 6, 12, 18, 24 matches

Example (4 players):
- Pairs = 4 × 3 / 2 = 6
- Options: 12, 24 matches
```

### Points System
```
Win:  3 points
Draw: 1 point
Loss: 0 points

Example: Player wins 3-1, gets 3 points
```

### Ranking Logic
```
1st: Highest points
2nd: (if tie) Goal difference (GF - GA)
3rd: (if tie) Goals scored
```

---

## Database Query Examples

### Get Ongoing Tournament
```sql
SELECT * FROM tournaments WHERE status = 'ongoing' LIMIT 1;
```

### Get Tournament Leaderboard
```sql
SELECT p.*, ts.* 
FROM tournament_stats ts
JOIN players p ON ts.player_id = p.id
WHERE ts.tournament_id = 'tournament_id'
ORDER BY ts.points DESC;
```

### Get All-Time Top 5
```sql
SELECT p.*, ats.*
FROM all_time_stats ats
JOIN players p ON ats.player_id = p.id
ORDER BY ats.total_points DESC
LIMIT 5;
```

### Get Remaining Matches
```sql
SELECT COUNT(*) FROM matches 
WHERE tournament_id = 'tournament_id' 
AND status = 'scheduled';
```

---

## API Endpoints Quick Reference

### Create Tournament
```
POST /.netlify/functions/create-tournament
Body: { players: [...], matchesPerPlayer: number }
Returns: { tournamentId, name }
```

### Get Tournaments
```
GET /.netlify/functions/get-tournaments?status=ongoing&limit=5
GET /.netlify/functions/get-tournaments?id=tournament_id
Returns: Array of tournament objects
```

### Get Stats
```
GET /.netlify/functions/get-stats?type=tournament&tournament_id=xyz
GET /.netlify/functions/get-stats?type=all-time&limit=10
Returns: Array of player stats
```

### Get Matches
```
GET /.netlify/functions/get-matches?tournament_id=xyz&status=scheduled
Returns: Array of match objects
```

### Update Match
```
POST /.netlify/functions/update-match
Body: { matchId, goalsA, goalsB }
Returns: { success: true }
```

---

## CSS Color Scheme

| Purpose | Color | Hex |
|---------|-------|-----|
| Background | Black | #0a0a0a |
| Cards | Dark Gray | #1a1a1a |
| Text | White | #ffffff |
| Text Secondary | Gray | #b0b0b0 |
| Primary Accent | Neon Green | #00ff88 |
| Secondary Accent | Electric Blue | #0099ff |
| Accent Purple | Purple | #8a2be2 |
| Error | Red | #ff4444 |

---

## Responsive Breakpoints

```
Mobile:  < 480px  (iPhone 16)
Tablet:  480px - 768px
Desktop: > 768px
```

Mobile-specific optimizations:
- Single-column layouts
- Full-width buttons
- Touch-friendly sizing (44px+)
- Reduced padding

---

## Component Hierarchy

```
Layout
├── Navbar
│   └── Nav Menu / Toggle
├── Main Content
│   ├── Hero Section (home only)
│   ├── Ongoing Tournament (home)
│   ├── Tournaments Grid (cards)
│   ├── Leaderboard Table
│   │   ├── Table Header
│   │   └── Table Body (rows)
│   └── Modals
│       └── Add Match Form
└── Footer
```

---

## Troubleshooting Quick Fixes

| Issue | Fix | 
|-------|-----|
| No tournaments showing | Create tournament first |
| Leaderboard empty | Check tournament_stats table populated |
| Mobile layout broken | Clear cache, hard refresh |
| Function 404 error | Check netlify.toml, redeploy |
| Database connection fails | Enable DB in Netlify Dashboard |
| Points not updating | Check match status = 'completed' |
| Images not showing | Use valid URLs or fallback avatar |

---

## Performance Tips

- CSS: Already minified, use CDN for Font Awesome
- JS: Vanilla (no dependencies), no heavy loops
- DB: Queries optimized with aggregations
- Images: Use copyright-free sources (Unsplash, Pexels)

---

## Security Notes

- No sensitive data in localStorage
- No credentials in code
- Netlify handles CORS automatically
- Database access through functions only
- No direct DB queries from frontend

---

## Common Code Patterns

### Fetch Data
```javascript
const response = await fetch(`${this.baseUrl}/get-tournaments?status=ongoing`);
const data = await response.json();
```

### Update Leaderboard
```javascript
this.renderLeaderboard(stats);
Utils.showNotification('Updated!', 'success');
```

### Handle Errors
```javascript
try {
    // code
} catch (error) {
    Utils.showNotification('Error: ' + error.message, 'error');
}
```

---

## Browser DevTools

### Check Database
```javascript
// In browser console after deploying
fetch('/.netlify/functions/get-tournaments')
  .then(r => r.json())
  .then(d => console.log(d))
```

### View Network Requests
- F12 → Network tab
- Filter by XHR for API calls
- Check response payload

### View Local Storage
- F12 → Application → Local Storage
- Check for cached tournament data

---

## Git Workflow

```bash
# Make changes
git add .
git commit -m "Fix: match submission"
git push

# Netlify auto-deploys
# Check deployment status in Dashboard

# Rollback if needed
git revert HEAD
git push
```

---

## Mobile Testing Checklist

- [ ] iPhone 16 Pro (390×844)
- [ ] iPhone 16 Pro Max (430×932)
- [ ] iPad (768×1024)
- [ ] Android phone (360×800)
- [ ] Test touch interactions
- [ ] Check button sizes (44px+)
- [ ] Verify text readability
- [ ] Test form inputs
- [ ] Check modal display

---

## Next Release Ideas

1. **Player photo upload** (Netlify Blob storage)
2. **Edit/delete matches** (with stats recalc)
3. **Team leaderboards** (aggregate by team)
4. **Search & filter** (leaderboard search)
5. **Export data** (CSV/PDF)
6. **Authentication** (admin access)
7. **Notifications** (match reminders)
8. **Head-to-head stats** (vs specific player)
9. **Seasonal tournaments** (group by date)
10. **Mobile app** (PWA or React Native)

---

## Support

- **Docs**: See README.md
- **Deploy**: See DEPLOY.md
- **Changes**: See REFINEMENTS.md
- **Status**: See CHECKLIST.md

---

**Last Updated**: 2024
**Version**: 1.0 (Production Ready)
**Status**: ✅ Live on Netlify
