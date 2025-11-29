class FootballLeague {
    constructor() {
        this.baseUrl = '/.netlify/functions';
        this.init();
    }

    async init() {
        await this.loadHomePageData();
        this.setupEventListeners();
    }

    async loadHomePageData() {
        try {
            // Load ongoing tournament
            const ongoingResponse = await fetch(`${this.baseUrl}/get-tournaments?status=ongoing`);
            const ongoingData = await ongoingResponse.json();
            this.renderOngoingTournament(ongoingData[0]);

            // Load recent tournaments
            const pastResponse = await fetch(`${this.baseUrl}/get-tournaments?status=completed&limit=3`);
            const pastData = await pastResponse.json();
            this.renderPastTournamentsPreview(pastData);

            // Load leaderboard preview
            const leaderboardResponse = await fetch(`${this.baseUrl}/get-stats?type=all-time&limit=5`);
            const leaderboardData = await leaderboardResponse.json();
            this.renderLeaderboardPreview(leaderboardData);

        } catch (error) {
            console.error('Error loading home page data:', error);
        }
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
                    <div>Rank</div>
                    <div>Player</div>
                    <div>Team</div>
                    <div>Matches</div>
                    <div>Wins</div>
                    <div>Goals</div>
                    <div>Points</div>
                </div>
            </div>
            <div class="table-body">
                ${stats.map((player, index) => `
                    <div class="table-row">
                        <div>${index + 1}</div>
                        <div class="player-info">
                            <img src="${player.photo_url || 'src/images/default-avatar.jpg'}" 
                                 alt="${player.name}" class="player-avatar">
                            <span>${player.name}</span>
                        </div>
                        <div>${player.team_name}</div>
                        <div>${player.total_matches || 0}</div>
                        <div>${player.total_wins || 0}</div>
                        <div>${player.total_goals || 0}</div>
                        <div class="points">${player.total_points || 0}</div>
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