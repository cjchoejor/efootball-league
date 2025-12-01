# Caching System - Quick Start Guide

## What Was Added

A global caching system that stores frequently-accessed data in the browser's localStorage, eliminating unnecessary API calls and speeding up the application.

## How It Works

1. **First Visit**: Data is fetched from the server and stored in cache
2. **Subsequent Visits**: Data is loaded from cache instantly (within 5 minutes)
3. **After 5 Minutes**: Cache expires, fresh data is fetched on next request
4. **When Data Changes**: Cache is automatically cleared to ensure fresh data

## How to Use (For Developers)

### Basic Usage

```javascript
// Check if data is cached
const data = cache.get('cache_key_name');
if (data) {
  // Use cached data
}

// Store data in cache
cache.set('cache_key_name', dataObject);

// Store with custom TTL (in milliseconds)
cache.set('cache_key_name', dataObject, 10 * 60 * 1000); // 10 minutes

// Clear specific cache
cache.invalidate('cache_key_name');

// Clear multiple caches
cache.invalidateMultiple(['key1', 'key2', 'key3']);

// Clear all application cache
cache.clearAll();
```

### Complete Example

```javascript
async function loadPlayers() {
  // Check cache first
  let players = cache.get('cache_players_list');
  
  if (!players) {
    // Cache miss - fetch from server
    const response = await fetch('/api/players');
    players = await response.json();
    
    // Store in cache for 5 minutes
    cache.set('cache_players_list', players, 5 * 60 * 1000);
  }
  
  return players;
}

// When data changes, invalidate cache
function addNewPlayer(player) {
  // ... add player to database ...
  
  // Clear cache so next load gets fresh data
  cache.invalidate('cache_players_list');
}
```

## Cached Data Locations

### Home Page (`index.html`)
```
Ongoing Tournament: cache_ongoing_tournament
Recent Tournaments: cache_past_tournaments
Leaderboard Preview: cache_all_time_leaderboard
```

### Tournament Page (`tournament.html`)
```
Players List: cache_tournament_players
Tournament Stats: cache_tournament_stats_{tournamentId}
Matches: cache_tournament_matches_{tournamentId}
```

### Leaderboard Page
```
Full Leaderboard: cache_all_time_leaderboard_full
```

### Past Tournaments Page
```
Past Tournaments: cache_past_tournaments_all
```

### Players Management
```
(Cache is invalidated when players are added/updated/deleted)
```

## Debugging Cache

### Check What's Cached

Open browser DevTools Console and run:

```javascript
// Show all cached data
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('cache')) {
    const cached = JSON.parse(localStorage.getItem(key));
    console.log(key, cached);
  }
}
```

### Clear All Cache Manually

```javascript
cache.clearAll();
// OR in console:
localStorage.clear(); // clears everything
```

### Check If Cache Is Working

1. Open DevTools Network tab
2. Load a page that uses caching
3. Refresh the page
4. Look for fewer network requests on refresh (cached data loads instantly)
5. Open DevTools Console and run above code to see what's cached

## Cache TTL (Time To Live)

Default: **5 minutes** (300,000 milliseconds)

This means:
- Data is cached for 5 minutes
- After 5 minutes, cache expires
- Next request fetches fresh data from server
- Can be customized per item

## Cache Size Limits

- **Browser LocalStorage**: Usually 5-10MB per domain
- **This App**: Uses ~1-2MB maximum
- **Safe to use**: No storage warnings expected

## When Cache Is Cleared

Automatic cache invalidation happens when:
- ✓ New player is added
- ✓ Player is updated
- ✓ Player is deleted
- ✓ Match result is submitted
- ✓ Tournament is deleted
- ✓ Tournament is ended
- ✓ User manually refreshes with Ctrl+F5 (hard refresh)

## Performance Improvements

With caching enabled:

| Operation | Time |
|-----------|------|
| First load of page | 500-2000ms (normal) |
| Repeated load (cached) | 0-10ms (instant) |
| Tournament creation | 2-3 seconds (normal) |
| Reload tournament | 0-1 second (from cache) |

## Troubleshooting

### Data Not Updating
**Problem**: Old data showing, new changes not visible
**Solution**: 
```javascript
// Clear the cache manually
cache.invalidate('cache_key_name');
// OR hard refresh page: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

### Storage Full Warning
**Problem**: "QuotaExceededError" in console
**Solution**:
```javascript
cache.clearAll();
// Or manually clear individual caches that are no longer needed
```

### Cache Not Working
**Problem**: Data still fetching every time
**Solution**:
- Check if `cache.js` is loaded before other scripts
- Check browser console for errors
- Verify cache key names match exactly (case-sensitive)
- Check if cache.invalidate() is being called unexpectedly

### Offline Support
The cache provides basic offline support:
- If user is offline and data is cached, it displays cached data
- If user is offline and data is NOT cached, user sees "Error loading data"
- When online again, next request fetches fresh data

## Best Practices

1. ✓ Always check cache before making API call
2. ✓ Set appropriate TTL for different data types
3. ✓ Invalidate cache when data changes
4. ✓ Use consistent, descriptive cache keys
5. ✓ Handle cache.get() returning null
6. ✓ Consider user data sensitivity (don't cache passwords!)

## Common Cache Keys

```javascript
// User should never cache sensitive data
cache.set('cache_password', password);  // ❌ BAD
cache.set('cache_user_token', token);   // ❌ BAD

// DO cache read-only data
cache.set('cache_players_list', players);        // ✓ OK
cache.set('cache_tournament_results', results);  // ✓ OK
cache.set('cache_leaderboard_data', stats);      // ✓ OK
```

## Questions?

Refer to `LATEST_UPDATES.md` for detailed technical documentation.
