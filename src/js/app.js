class FootballLeague {
     constructor() {
         this.baseUrl = '/.netlify/functions';
         this.cacheKeys = {
             ongoing: 'cache_ongoing_tournament',
             pastTournaments: 'cache_past_tournaments',
             leaderboard: 'cache_all_time_leaderboard'
         };
         this.init();
     }

     async init() {
         await this.loadHomePageData();
         this.setupEventListeners();
     }

     async loadHomePageData() {
         try {
             // Load ongoing tournament
             const ongoingData = await this.fetchWithCache(
                 `${this.baseUrl}/get-tournaments?status=ongoing`,
                 this.cacheKeys.ongoing
             );
             this.renderOngoingTournament(Array.isArray(ongoingData) ? ongoingData[0] : ongoingData);

             // Load recent tournaments (finished status)
             const pastData = await this.fetchWithCache(
                 `${this.baseUrl}/get-tournaments?status=finished&limit=3`,
                 this.cacheKeys.pastTournaments
             );
             this.renderPastTournamentsPreview(Array.isArray(pastData) ? pastData : pastData);

             // Load leaderboard preview
             const leaderboardData = await this.fetchWithCache(
                 `${this.baseUrl}/get-stats?type=all-time&limit=5`,
                 this.cacheKeys.leaderboard
             );
             this.renderLeaderboardPreview(Array.isArray(leaderboardData) ? leaderboardData : leaderboardData);

         } catch (error) {
             console.error('Error loading home page data:', error);
         }
     }

     async fetchWithCache(url, cacheKey, ttl = 5 * 60 * 1000) {
         // Check cache first
         const cached = cache.get(cacheKey);
         if (cached) {
             console.log(`Using cached data for ${cacheKey}`);
             return cached;
         }

         // Fetch from API
         const response = await fetch(url);
         let data = await response.json();
         
         // Handle nested body property
         if (data && data.body && typeof data.body === 'string') {
             data = JSON.parse(data.body);
         }

         // Cache the result
         cache.set(cacheKey, data, ttl);
         return data;
     }

    renderOngoingTournament(tournament) {
        const container = document.getElementById('ongoingTournament');
        
        if (!tournament) {
            container.innerHTML = `
                <div class="no-tournament">
                    <h2 class="section-title">No Ongoing Tournament</h2>
                    <p>Create a new tournament to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h2 class="section-title">Ongoing Tournament: ${tournament.name}</h2>
            <div class="tournament-card">
                <div class="tournament-info">
                    <h3>${tournament.name}</h3>
                    <p>Matches per player: ${tournament.matches_per_player}</p>
                    <p>Started: ${new Date(tournament.created_at).toLocaleDateString()}</p>
                </div>
                <button class="btn-primary" onclick="location.href='tournament.html?id=${tournament.id}'">
                    View Tournament
                </button>
            </div>
        `;
    }

    renderPastTournamentsPreview(tournaments) {
        const container = document.getElementById('pastTournamentsGrid');
        
        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = '<p class="no-data">No past tournaments yet</p>';
            return;
        }
        
        container.innerHTML = tournaments.map(tournament => `
            <div class="tournament-card" onclick="location.href='past-tournaments.html?id=${tournament.id}'">
                <h3>${tournament.name}</h3>
                <div class="tournament-meta">
                    <span><i class="fas fa-users"></i> ${tournament.player_count} players</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(tournament.created_at).toLocaleDateString()}</span>
                </div>
                <div class="tournament-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(tournament.completed_matches / tournament.total_matches) * 100}%"></div>
                    </div>
                    <span>${tournament.completed_matches}/${tournament.total_matches} matches</span>
                </div>
            </div>
        `).join('');
    }

    renderLeaderboardPreview(stats) {
        const container = document.getElementById('leaderboardPreview');
        
        if (!stats || stats.length === 0) {
            container.innerHTML = '<p class="no-data">No leaderboard data yet</p>';
            return;
        }
        
        const tableHtml = `
            <div class="table-header">
                <div class="table-row">
                    <div>Player</div>
                    <div>Matches</div>
                    <div>Wins</div>
                    <div>Goals</div>
                    <div>Win %</div>
                    <div>Pts</div>
                </div>
            </div>
            <div class="table-body">
                ${stats.map((player, index) => `
                    <div class="table-row" data-label="Player | Matches | Wins | Goals | Win % | Points">
                        <div class="player-info" data-label="Player">
                            <img src="${player.photo_url || 'src/images/default-avatar.jpg'}" 
                                 alt="${player.name}" class="player-avatar">
                            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                                <span style="font-weight: 500;">${player.name}</span>
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">${player.team_name}</span>
                            </div>
                        </div>
                        <div data-label="Matches">${player.total_matches || 0}</div>
                        <div data-label="Wins">${player.total_wins || 0}</div>
                        <div data-label="Goals">${player.total_goals || 0}</div>
                        <div data-label="Win %">${player.win_percentage ? player.win_percentage.toFixed(1) + '%' : '0%'}</div>
                        <div class="points" data-label="Points">${player.total_points || 0}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = tableHtml;
    }

    setupEventListeners() {
        const createBtn = document.getElementById('createTournamentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                window.location.href = 'tournament.html?create=new';
            });
        }

        // Mobile hamburger menu
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
            });

            // Close menu when a link is clicked
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('open');
                });
            });
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new FootballLeague();
});

// Utility functions
class TournamentUtils {
    static generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static calculateWinRate(wins, totalGames) {
        return totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';
    }

    static getMatchesPerPlayerOptions(playerCount) {
        const baseMatches = (playerCount * (playerCount - 1));
        const options = [];
        
        for (let i = 1; i <= 4; i++) {
            const matches = baseMatches * i;
            if (matches <= 24) {
                options.push(matches);
            }
        }
        
        return options;
    }
}