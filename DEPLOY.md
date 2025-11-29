# Deployment Guide

## Quick Start - Deploy to Netlify in 5 Minutes

### Step 1: Prepare for Deployment

1. **Ensure all files are committed**
   ```bash
   git status
   git add .
   git commit -m "Initial eFootball League setup"
   ```

2. **Verify project structure**
   ```
   ✓ netlify/functions/ (4 .js files + 1 for get-matches)
   ✓ netlify/db/schema.sql
   ✓ src/css/style.css
   ✓ src/js/ (app.js, tournament.js, utils.js)
   ✓ *.html files (index, tournament, leaderboard, past-tournaments)
   ✓ netlify.toml
   ```

### Step 2: Connect to Netlify

#### Option A: Via Netlify UI (Recommended for beginners)

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Select Git provider (GitHub/GitLab/Bitbucket)
4. Authorize and select your repository
5. Build settings should auto-fill:
   - **Base directory**: leave empty
   - **Build command**: leave empty
   - **Publish directory**: `.`
6. Click **Deploy site**

#### Option B: Via Netlify CLI

1. Install CLI (if not already)
   ```bash
   npm install -g netlify-cli
   ```

2. Authenticate
   ```bash
   netlify login
   ```

3. Create and deploy
   ```bash
   netlify init
   ```
   
   When prompted:
   - **Team**: Select your team
   - **Site name**: `efootball-league` (or your choice)
   - **Build command**: Leave empty
   - **Publish directory**: `.`

4. Deploy
   ```bash
   netlify deploy --prod
   ```

### Step 3: Set Up Database

Once site is deployed:

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Go to **Storage** tab (or **Database**)

2. **Enable Netlify DB**
   - Click **Enable Netlify DB**
   - Confirm the region

3. **Apply Schema**
   ```bash
   # Via CLI
   netlify db push netlify/db/schema.sql
   
   # Or manually via Dashboard
   # - Dashboard → Storage → SQL Console
   # - Copy & paste contents of netlify/db/schema.sql
   # - Execute
   ```

4. **Verify Tables**
   ```bash
   netlify db shell
   .tables
   ```
   You should see: `players`, `tournaments`, `tournament_players`, `matches`, `tournament_stats`, `all_time_stats`

### Step 4: Test Live Site

1. **Get site URL** from Netlify Dashboard (e.g., `https://efootball-league.netlify.app`)

2. **Test functionality**
   - [ ] Home page loads
   - [ ] Create Tournament button works
   - [ ] Can add players
   - [ ] Can select matches per player
   - [ ] Submit creates tournament (check DB)
   - [ ] Leaderboard updates after match

3. **Check Netlify Functions**
   - Dashboard → **Functions** tab
   - Should show all 5 functions deployed

4. **Monitor Logs**
   - Dashboard → **Functions** → Click a function
   - View real-time logs for debugging

---

## Environment Configuration

### Automatic Environment Variables

Netlify automatically provides:
```
NETLIFY_DB_PUSH_URL  (for database)
DATABASE_URL         (connection string)
```

Your functions automatically get access to `@netlify/functions` module.

### No Additional Configuration Needed
- ✅ Database credentials auto-managed
- ✅ Function routing auto-configured
- ✅ CORS headers auto-set

---

## Local Development Testing Before Deployment

```bash
# 1. Install dependencies
npm install

# 2. Initialize local DB
netlify db init

# 3. Apply schema to local DB
netlify db push netlify/db/schema.sql

# 4. Start dev server
netlify dev

# 5. Open http://localhost:8888
# Test all features before deploying
```

---

## Troubleshooting Deployment

### Issue: Functions returning 404
**Solution**: 
- Check `netlify.toml` has:
  ```toml
  [functions]
    directory = "netlify/functions"
  ```
- Redeploy after fixing

### Issue: Database connection error
**Solution**:
- Verify DB enabled in Dashboard
- Re-push schema: `netlify db push netlify/db/schema.sql`
- Check function logs for specific error

### Issue: Site loads but no data
**Solution**:
- Open **Dashboard → Storage → SQL Console**
- Run: `SELECT COUNT(*) FROM tournaments;`
- If 0, database is connected but empty (expected on first deploy)

### Issue: Functions slow/timing out
**Solution**:
- Check **Dashboard → Functions** logs
- Optimize queries in backend functions
- Consider database indexing for large datasets

### Issue: CORS errors on API calls
**Solution**:
- Netlify handles CORS automatically for same-origin
- If calling from different domain, headers auto-included
- No additional configuration needed

---

## Monitoring & Maintenance

### View Logs
```bash
# Live logs from CLI
netlify logs function

# Or via Dashboard → Functions → [function name]
```

### Database Backups
Netlify automatically backs up your database. To export:
```bash
netlify db pull
```

### Scale Considerations
- Netlify DB can handle 1000+ concurrent users
- No rate limiting for internal DB calls
- Monitor function execution times in Dashboard

---

## Post-Deployment Checklist

- [ ] Site loads at custom domain or Netlify URL
- [ ] All pages accessible (home, tournament, leaderboard, past)
- [ ] Can create tournament
- [ ] Players persist after page reload
- [ ] Can submit match results
- [ ] Leaderboard updates correctly
- [ ] Past tournaments show
- [ ] All-time leaderboard shows
- [ ] Mobile layout works (test on iPhone size)
- [ ] Functions have no errors in logs
- [ ] Database has data after creating tournament

---

## Custom Domain Setup (Optional)

1. **Buy domain** from provider (GoDaddy, Namecheap, etc.)

2. **Add to Netlify**
   - Dashboard → **Domain settings**
   - Click **Add domain**
   - Enter your domain

3. **Update DNS**
   - Netlify provides DNS records to add
   - Add them to your domain registrar
   - Wait 24-48 hours for propagation

4. **Enable HTTPS**
   - Netlify auto-generates SSL certificate
   - Should be automatic once DNS updated

---

## Performance Tips

### Frontend
- Images: Use copyright-free sources (Unsplash, Pexels)
- CSS: Already optimized with minimal animations
- JS: Vanilla JS, no heavy libraries

### Backend
- Database queries optimized with aggregations
- Functions cache-friendly (no state)
- Respond with minimal data

### Content Delivery
- Netlify CDN caches static assets globally
- Database on same infrastructure (low latency)
- No additional cache busting needed

---

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Functions 404 | Check netlify.toml, redeploy |
| No database | Enable DB in Dashboard, push schema |
| Empty leaderboard | Create a tournament first (initialize data) |
| Mobile layout broken | Clear browser cache, hard refresh |
| Slow loads | Check function logs, optimize queries |
| CORS errors | Already handled by Netlify |

---

## Support & Resources

- **Netlify Docs**: https://docs.netlify.com
- **Netlify DB Guide**: https://docs.netlify.com/netlify-db/overview
- **Functions Docs**: https://docs.netlify.com/functions/overview
- **CLI Docs**: https://docs.netlify.com/cli/get-started

---

## Rollback Procedure

If deployment breaks:

```bash
# Revert to previous commit
git revert HEAD
git push

# Netlify auto-deploys latest commit
# Or manually trigger from Dashboard → Deploys
```

The Database is separate and won't be affected by code rollbacks.
