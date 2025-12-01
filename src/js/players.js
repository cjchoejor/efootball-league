class PlayerManager {
    constructor() {
        this.baseUrl = '/.netlify/functions';
        this.players = [];
        this.currentEditingPlayerId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPlayers();
    }

    toggleAddPlayerForm() {
        const form = document.getElementById('addPlayerForm');
        const toggle = document.getElementById('addPlayerToggle');
        
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block';
            toggle.classList.add('open');
        } else {
            form.style.display = 'none';
            toggle.classList.remove('open');
        }
    }

    setupEventListeners() {
        // Add player form submission
        const addPlayerForm = document.getElementById('addPlayerForm');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddPlayer();
            });
        }

        // Edit player form submission
        const editPlayerForm = document.getElementById('editPlayerForm');
        if (editPlayerForm) {
            editPlayerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdatePlayer();
            });
        }

        // Edit modal close button
        const modal = document.getElementById('editPlayerModal');
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Close modal on outside click
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Delete player button
        const deletePlayerBtn = document.getElementById('deletePlayerBtn');
        if (deletePlayerBtn) {
            deletePlayerBtn.addEventListener('click', () => {
                this.handleDeletePlayer();
            });
        }
    }

    async loadPlayers() {
        try {
            const response = await fetch(`${this.baseUrl}/get-players`);
            const players = await response.json();
            this.players = players;
            this.renderPlayers(players);
        } catch (error) {
            console.error('Error loading players:', error);
            document.getElementById('playersGrid').innerHTML =
                '<p class="error">Error loading players</p>';
        }
    }

    renderPlayers(players) {
        const container = document.getElementById('playersGrid');

        if (!players || players.length === 0) {
            container.innerHTML = '<p class="no-data">No players added yet. Create your first player!</p>';
            return;
        }

        container.innerHTML = players.map(player => `
            <div class="player-card">
                <div class="player-card-header">
                    <img src="${player.photo_url || 'src/images/default-avatar.jpg'}" 
                         alt="${player.name}" class="player-card-photo">
                    <button class="btn-edit" onclick="playerManager.openEditModal('${player.id}')" title="Edit player">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="player-card-body">
                    <h4>${player.name}</h4>
                    <div class="player-info-row">
                        <span class="info-label">Team:</span>
                        <span class="info-value">${player.team_name}</span>
                    </div>
                    <div class="player-info-row">
                        <span class="info-label">Account:</span>
                        <span class="info-value">${player.account_number}</span>
                    </div>
                    <div class="player-info-row">
                        <span class="info-label">ID:</span>
                        <span class="info-value" style="font-size: 0.8rem; font-family: monospace;">${player.id}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleAddPlayer() {
         const name = document.getElementById('playerName').value;
         const teamName = document.getElementById('teamName').value;
         const accountNumber = document.getElementById('accountNumber').value;
         const photoFile = document.getElementById('playerPhoto');

         if (!name || !teamName || !accountNumber) {
             Utils.showNotification('Please fill in all required fields', 'error');
             return;
         }

         try {
             let photoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';

             // Convert photo to base64 if provided
             if (photoFile && photoFile.files && photoFile.files[0]) {
                 try {
                     photoUrl = await this.fileToBase64(photoFile.files[0]);
                 } catch (error) {
                     console.error('Error converting image:', error);
                 }
             }

             const response = await fetch(`${this.baseUrl}/add-player`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     name,
                     teamName,
                     accountNumber,
                     photoUrl
                 })
             });

             const result = await response.json();

             if (response.ok) {
                 Utils.showNotification('Player added successfully!', 'success');
                 document.getElementById('addPlayerForm').reset();
                 // Collapse the form after successful add
                 const form = document.getElementById('addPlayerForm');
                 const toggle = document.getElementById('addPlayerToggle');
                 form.style.display = 'none';
                 toggle.classList.remove('open');
                 // Invalidate player cache
                 localStorage.removeItem('tournament_players_cache');
                 await this.loadPlayers();
             } else {
                 Utils.showNotification('Error: ' + (result.error || 'Failed to add player'), 'error');
             }
         } catch (error) {
             console.error('Error adding player:', error);
             Utils.showNotification('Error: ' + error.message, 'error');
         }
     }

    openEditModal(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        this.currentEditingPlayerId = playerId;
        document.getElementById('editPlayerId').value = player.id;
        document.getElementById('editPlayerName').value = player.name;
        document.getElementById('editTeamName').value = player.team_name;
        document.getElementById('editAccountNumber').value = player.account_number;
        document.getElementById('editPlayerPhoto').value = '';

        document.getElementById('editPlayerModal').style.display = 'block';
    }

    async handleUpdatePlayer() {
        const playerId = document.getElementById('editPlayerId').value;
        const name = document.getElementById('editPlayerName').value;
        const teamName = document.getElementById('editTeamName').value;
        const accountNumber = document.getElementById('editAccountNumber').value;
        const photoFile = document.getElementById('editPlayerPhoto');

        if (!name || !teamName || !accountNumber) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            let photoUrl = null;

            // Convert photo to base64 if a new one is provided
            if (photoFile && photoFile.files && photoFile.files[0]) {
                try {
                    photoUrl = await this.fileToBase64(photoFile.files[0]);
                } catch (error) {
                    console.error('Error converting image:', error);
                }
            }

            const response = await fetch(`${this.baseUrl}/update-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId,
                    name,
                    teamName,
                    accountNumber,
                    photoUrl
                })
            });

            const result = await response.json();

            if (response.ok) {
                Utils.showNotification('Player updated successfully!', 'success');
                document.getElementById('editPlayerModal').style.display = 'none';
                // Reset form for next use
                document.getElementById('editPlayerForm').reset();
                // Invalidate player cache
                localStorage.removeItem('tournament_players_cache');
                await this.loadPlayers();
            } else {
                Utils.showNotification('Error: ' + (result.error || 'Failed to update player'), 'error');
            }
        } catch (error) {
            console.error('Error updating player:', error);
            Utils.showNotification('Error: ' + error.message, 'error');
        }
    }

    async handleDeletePlayer() {
        const playerId = document.getElementById('editPlayerId').value;
        const confirmed = confirm('Are you sure you want to delete this player? This action cannot be undone.');

        if (!confirmed) return;

        try {
            const response = await fetch(`${this.baseUrl}/delete-player`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId })
            });

            const result = await response.json();

            if (response.ok) {
                Utils.showNotification('Player deleted successfully!', 'success');
                document.getElementById('editPlayerModal').style.display = 'none';
                // Invalidate player cache
                localStorage.removeItem('tournament_players_cache');
                await this.loadPlayers();
            } else {
                Utils.showNotification('Error: ' + (result.error || 'Failed to delete player'), 'error');
            }
        } catch (error) {
            console.error('Error deleting player:', error);
            Utils.showNotification('Error: ' + error.message, 'error');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Initialize player manager
const playerManager = new PlayerManager();
