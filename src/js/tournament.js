class TournamentManager {
    constructor() {
        this.players = [];
        this.minPlayers = 3;
        this.baseUrl = '/.netlify/functions';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.addPlayerForm(); // Add first player form
        this.updateTournamentName();
        this.checkUrlParams();
    }

    setupEventListeners() {
        document.getElementById('addPlayerBtn').addEventListener('click', () => {
            this.addPlayerForm();
        });

        document.getElementById('createTournamentFinalBtn').addEventListener('click', () => {
            this.createTournament();
        });

        // Modal handling
        const modal = document.getElementById('addMatchModal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.getElementById('matchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitMatchResult();
        });
    }

    addPlayerForm() {
        const container = document.getElementById('playersContainer');
        const playerIndex = this.players.length;
        
        const playerHtml = `
            <div class="player-form" data-index="${playerIndex}">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Player Name</label>
                        <input type="text" class="form-input player-name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Team Name</label>
                        <input type="text" class="form-input team-name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Photo URL</label>
                        <input type="url" class="form-input photo-url" 
                               placeholder="https://example.com/photo.jpg">
                    </div>
                    <button type="button" class="btn-remove" onclick="tournamentManager.removePlayerForm(${playerIndex})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', playerHtml);
        this.updateMatchesOptions();
    }

    removePlayerForm(index) {
        const form = document.querySelector(`[data-index="${index}"]`);
        if (form) {
            form.remove();
            this.updateMatchesOptions();
        }
    }

    updateMatchesOptions() {
        const playerCount = document.querySelectorAll('.player-form').length;
        const select = document.getElementById('matchesPerPlayer');
        
        select.innerHTML = '<option value="">Select based on player count</option>';
        
        if (playerCount >= 3) {
            const options = this.getMatchesOptions(playerCount);
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = `${option} matches per player`;
                select.appendChild(opt);
            });
        }
    }

    getMatchesOptions(playerCount) {
        // Calculate total possible pairs: n * (n-1) / 2
        const totalPairs = (playerCount * (playerCount - 1)) / 2;
        const options = [];
        
        // Each pair plays N times: 2, 4, 6, 8, 10, 12... up to 24 total matches per player
        for (let multiplier = 2; multiplier <= 12; multiplier += 2) {
            const totalMatches = totalPairs * multiplier;
            // Cap at 24 matches per player
            if (totalMatches <= playerCount * 24) {
                options.push(totalMatches);
            } else {
                break;
            }
        }
        
        return options.length > 0 ? options : [totalPairs * 2];
    }

    async createTournament() {
        const players = this.collectPlayers();
        const matchesPerPlayer = document.getElementById('matchesPerPlayer').value;
        
        if (players.length < this.minPlayers) {
            alert(`Minimum ${this.minPlayers} players required`);
            return;
        }
        
        if (!matchesPerPlayer) {
            alert('Please select matches per player');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/create-tournament`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, matchesPerPlayer: parseInt(matchesPerPlayer) })
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Tournament created successfully!');
                window.location.href = `tournament.html?id=${result.tournamentId}`;
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Error creating tournament: ' + error.message);
        }
    }

    collectPlayers() {
        const forms = document.querySelectorAll('.player-form');
        const players = [];
        
        forms.forEach((form, index) => {
            const name = form.querySelector('.player-name').value;
            const teamName = form.querySelector('.team-name').value;
            const photoUrl = form.querySelector('.photo-url').value;
            
            if (name && teamName) {
                players.push({
                    id: `player_${Date.now()}_${index}`,
                    name: name,
                    teamName: teamName,
                    photoUrl: photoUrl || 'src/images/default-avatar.jpg'
                });
            }
        });
        
        return players;
    }

    updateTournamentName() {
        // This would typically fetch the next tournament number from the server
        document.getElementById('tournamentName').value = 'WEEK (auto-generated)';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tournamentId = urlParams.get('id');
        
        if (tournamentId) {
            this.loadTournament(tournamentId);
        }
    }

    async loadTournament(tournamentId) {
        // Hide create form, show tournament view
        document.getElementById('tournamentCreate').style.display = 'none';
        document.getElementById('tournamentView').style.display = 'block';
        
        // Load tournament data
        await this.loadTournamentData(tournamentId);
    }

    async loadTournamentData(tournamentId) {
        try {
            // Load tournament info
            const tourResponse = await fetch(`${this.baseUrl}/get-tournaments?id=${tournamentId}`);
            const tournaments = await tourResponse.json();
            const tournament = tournaments[0];
            
            if (!tournament) {
                console.error('Tournament not found');
                return;
            }
            
            document.getElementById('tournamentTitle').textContent = tournament.name;
            
            // Load leaderboard
            const statsResponse = await fetch(`${this.baseUrl}/get-stats?type=tournament&tournament_id=${tournamentId}`);
            const stats = await statsResponse.json();
            this.renderTournamentLeaderboard(stats);
            
            // Load upcoming matches for this pair
            await this.loadMatchesForTournament(tournamentId);
            
            // Setup match submission
            this.setupMatchModal(tournament, stats);
            
        } catch (error) {
            console.error('Error loading tournament data:', error);
        }
    }
    
    renderTournamentLeaderboard(stats) {
        const container = document.getElementById('tournamentLeaderboard');
        
        if (!stats || stats.length === 0) {
            container.innerHTML = '<p>No leaderboard data available</p>';
            return;
        }
        
        const tableHtml = `
            <div class="leaderboard-table">
                <div class="table-header">
                    <div class="table-row">
                        <div>Player</div>
                        <div>Team</div>
                        <div>P</div>
                        <div>W</div>
                        <div>D</div>
                        <div>L</div>
                        <div>GF</div>
                        <div>GA</div>
                        <div>Pts</div>
                    </div>
                </div>
                <div class="table-body">
                    ${stats.map((player, idx) => `
                        <div class="table-row">
                            <div class="player-info">
                                <img src="${player.photo_url || 'src/images/default-avatar.jpg'}" 
                                     alt="${player.name}" class="player-avatar">
                                <span>${player.name}</span>
                            </div>
                            <div>${player.team_name}</div>
                            <div>${player.games_played}</div>
                            <div>${player.wins}</div>
                            <div>${player.draws}</div>
                            <div>${player.losses}</div>
                            <div>${player.goals_scored}</div>
                            <div>${player.goals_conceded}</div>
                            <div class="points">${player.points}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = tableHtml;
    }
    
    async loadMatchesForTournament(tournamentId) {
        try {
            const response = await fetch(`${this.baseUrl}/get-matches?tournament_id=${tournamentId}&status=scheduled&limit=5`);
            const matches = await response.json();
            
            const container = document.getElementById('recentMatches');
            
            if (!matches || matches.length === 0) {
                container.innerHTML = '<p>No scheduled matches</p>';
                return;
            }
            
            container.innerHTML = matches.map(match => `
                <div class="match-card">
                    <div class="match-players">
                        <span>${match.player_a_name}</span>
                        <span>vs</span>
                        <span>${match.player_b_name}</span>
                    </div>
                    <div class="match-status">Scheduled</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }
    
    setupMatchModal(tournament, stats) {
        const playerASelect = document.getElementById('playerASelect');
        const playerBSelect = document.getElementById('playerBSelect');
        
        playerASelect.innerHTML = stats.map(p => 
            `<option value="${p.id}">${p.name} (${p.team_name})</option>`
        ).join('');
        
        playerBSelect.innerHTML = stats.map(p => 
            `<option value="${p.id}">${p.name} (${p.team_name})</option>`
        ).join('');
        
        // Setup match button
        const addMatchBtn = document.getElementById('addMatchBtn');
        if (addMatchBtn) {
            addMatchBtn.addEventListener('click', () => {
                document.getElementById('addMatchModal').style.display = 'block';
            });
        }
    }
    
    async submitMatchResult() {
        try {
            const playerAId = document.getElementById('playerASelect').value;
            const playerBId = document.getElementById('playerBSelect').value;
            const goalsA = parseInt(document.getElementById('goalsA').value);
            const goalsB = parseInt(document.getElementById('goalsB').value);
            
            if (!playerAId || !playerBId) {
                Utils.showNotification('Please select both players', 'error');
                return;
            }
            
            if (playerAId === playerBId) {
                Utils.showNotification('Players must be different', 'error');
                return;
            }
            
            if (isNaN(goalsA) || isNaN(goalsB)) {
                Utils.showNotification('Please enter valid goals', 'error');
                return;
            }
            
            // TODO: Get the actual match ID for this pair from upcoming matches
            // For now, we need to implement a function to get next scheduled match
            const urlParams = new URLSearchParams(window.location.search);
            const tournamentId = urlParams.get('id');
            
            // In production, you'd get the next unplayed match ID between these players
            // This is a placeholder - needs to be linked to actual match selection
            const matchId = `match_${tournamentId}_${playerAId}_${playerBId}_0`;
            
            const response = await fetch(`${this.baseUrl}/update-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: matchId,
                    goalsA: goalsA,
                    goalsB: goalsB
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                Utils.showNotification('Match recorded successfully!', 'success');
                document.getElementById('addMatchModal').style.display = 'none';
                document.getElementById('matchForm').reset();
                
                // Reload tournament data to update leaderboard
                await this.loadTournamentData(tournamentId);
            } else {
                Utils.showNotification('Error: ' + (result.error || 'Failed to record match'), 'error');
            }
            
        } catch (error) {
            console.error('Error submitting match:', error);
            Utils.showNotification('Error: ' + error.message, 'error');
        }
    }
}

// Initialize tournament manager
const tournamentManager = new TournamentManager();