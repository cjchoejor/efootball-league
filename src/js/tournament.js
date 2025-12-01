class TournamentManager {
  constructor() {
    this.players = [];
    this.selectedPlayers = [];
    this.allAvailablePlayers = [];
    this.minPlayers = 3;
    this.baseUrl = "/.netlify/functions";
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadAvailablePlayers();
    this.updateTournamentName();
    this.checkUrlParams();
  }

  setupEventListeners() {
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener("click", () => {
        this.addPlayerDropdown();
      });
    }

    const createBtn = document.getElementById("createTournamentFinalBtn");
    if (createBtn) {
      createBtn.addEventListener("click", () => {
        this.createTournament();
      });
    }

    // Modal handling
    const modal = document.getElementById("addMatchModal");
    if (modal) {
      const closeBtn = modal.querySelector(".close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          modal.style.display = "none";
        });
      }

      window.addEventListener("click", (event) => {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });

      const matchForm = document.getElementById("matchForm");
      if (matchForm) {
        matchForm.addEventListener("submit", (e) => {
          e.preventDefault();
          this.submitMatchResult();
        });
      }
    }

    // Setup tournament view buttons
    const addMatchBtn = document.getElementById("addMatchBtn");
    if (addMatchBtn) {
      addMatchBtn.addEventListener("click", () => {
        document.getElementById("addMatchModal").style.display = "block";
      });
    }

    const backBtn = document.getElementById("backToHomeBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }

    const deleteBtn = document.getElementById("deleteTournamentBtn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.deleteTournament();
      });
    }
  }

  async loadAvailablePlayers() {
    try {
      const response = await fetch(`${this.baseUrl}/get-players`);
      this.allAvailablePlayers = await response.json();
      // Add first player dropdown
      this.addPlayerDropdown();
    } catch (error) {
      console.error('Error loading players:', error);
      Utils.showNotification('Error loading players. Make sure to create players first!', 'error');
    }
  }

  getAvailablePlayersForDropdown(excludeIndices = []) {
    // Filter out already selected players
    const selectedIds = this.selectedPlayers.map(p => p.id);
    return this.allAvailablePlayers.filter(
      p => !selectedIds.includes(p.id)
    );
  }

  addPlayerDropdown() {
    const container = document.getElementById("playersContainer");
    const playerIndex = this.selectedPlayers.length;
    const availablePlayers = this.getAvailablePlayersForDropdown();

    const playerHtml = `
            <div class="player-selection" data-index="${playerIndex}">
                <div class="form-group">
                    <label class="form-label">Player ${playerIndex + 1}</label>
                    <select class="form-input player-dropdown" data-index="${playerIndex}" required onchange="tournamentManager.handlePlayerChange(${playerIndex})">
                        <option value="">Select a player...</option>
                        ${availablePlayers.map(p => `
                            <option value="${p.id}" data-name="${p.name}" data-team="${p.team_name}" data-photo="${p.photo_url}">
                                ${p.name} (${p.team_name})
                            </option>
                        `).join('')}
                    </select>
                </div>
                ${playerIndex > 0 ? `
                    <button type="button" class="btn-remove" onclick="tournamentManager.removePlayerDropdown(${playerIndex})" style="margin-top: 1.5rem;">
                        <i class="fas fa-times"></i> Remove
                    </button>
                ` : ''}
            </div>
        `;

    container.insertAdjacentHTML("beforeend", playerHtml);
    this.updateMatchesOptions();
  }

  handlePlayerChange(index) {
    const select = document.querySelector(`[data-index="${index}"].player-dropdown`);
    const selectedValue = select.value;

    if (selectedValue) {
      const selectedOption = select.querySelector(`option[value="${selectedValue}"]`);
      const player = {
        id: selectedValue,
        name: selectedOption.dataset.name,
        teamName: selectedOption.dataset.team,
        photoUrl: selectedOption.dataset.photo
      };

      // Update or add player in selectedPlayers array
      if (this.selectedPlayers[index]) {
        this.selectedPlayers[index] = player;
      } else {
        this.selectedPlayers[index] = player;
      }

      // Refresh all dropdowns to exclude newly selected players
      this.refreshAllPlayerDropdowns();
    }
  }

  refreshAllPlayerDropdowns() {
    const dropdowns = document.querySelectorAll('.player-dropdown');
    dropdowns.forEach((dropdown, index) => {
      const currentValue = dropdown.value;
      const selectedIds = this.selectedPlayers.map((p, i) => i !== index ? p.id : null).filter(Boolean);

      // Build new options
      const newOptions = [
        '<option value="">Select a player...</option>'
      ];

      this.allAvailablePlayers.forEach(player => {
        if (!selectedIds.includes(player.id) || player.id === currentValue) {
          newOptions.push(`
            <option value="${player.id}" data-name="${player.name}" data-team="${player.team_name}" data-photo="${player.photo_url}">
                ${player.name} (${player.team_name})
            </option>
          `);
        }
      });

      dropdown.innerHTML = newOptions.join('');
      dropdown.value = currentValue;
    });

    this.updateMatchesOptions();
  }

  removePlayerDropdown(index) {
    const form = document.querySelector(`[data-index="${index}"]`);
    if (form) {
      form.remove();
      // Remove from selectedPlayers
      this.selectedPlayers.splice(index, 1);
      // Re-index all dropdowns
      this.reindexPlayerDropdowns();
      this.updateMatchesOptions();
    }
  }

  reindexPlayerDropdowns() {
    const container = document.getElementById("playersContainer");
    const forms = container.querySelectorAll('.player-selection');
    forms.forEach((form, index) => {
      form.setAttribute('data-index', index);
      const dropdown = form.querySelector('.player-dropdown');
      if (dropdown) {
        dropdown.setAttribute('data-index', index);
        dropdown.setAttribute('onchange', `tournamentManager.handlePlayerChange(${index})`);
      }
      const removeBtn = form.querySelector('.btn-remove');
      if (removeBtn) {
        removeBtn.setAttribute('onclick', `tournamentManager.removePlayerDropdown(${index})`);
        // Hide remove button for first player
        removeBtn.style.display = index > 0 ? 'block' : 'none';
      }
    });
  }

  updateMatchesOptions() {
    const playerCount = this.selectedPlayers.filter(p => p && p.id).length;
    const select = document.getElementById("matchesPerPlayer");

    select.innerHTML = '<option value="">Select based on player count</option>';

    if (playerCount >= 3) {
      const options = this.getMatchesOptions(playerCount);
      options.forEach((option) => {
        const opt = document.createElement("option");
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
    const players = this.selectedPlayers.filter(p => p && p.id);
    const matchesPerPlayer = document.getElementById("matchesPerPlayer").value;

    if (players.length < this.minPlayers) {
      alert(`Minimum ${this.minPlayers} players required`);
      return;
    }

    if (!matchesPerPlayer) {
      alert("Please select matches per player");
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/create-tournament`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds: players.map(p => p.id),
          matchesPerPlayer: parseInt(matchesPerPlayer),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Tournament created successfully!");
        window.location.href = `tournament.html?id=${result.tournamentId}`;
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error creating tournament: " + error.message);
    }
  }



  updateTournamentName() {
    // This would typically fetch the next tournament number from the server
    document.getElementById("tournamentName").value = "WEEK (auto-generated)";
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get("id");

    if (tournamentId) {
      this.loadTournament(tournamentId);
    }
  }

  async loadTournament(tournamentId) {
    // Hide create form, show tournament view
    document.getElementById("tournamentCreate").style.display = "none";
    document.getElementById("tournamentView").style.display = "block";

    // Load tournament data
    await this.loadTournamentData(tournamentId);
  }

  async loadTournamentData(tournamentId) {
    try {
      // Load tournament info
      const tourResponse = await fetch(
        `${this.baseUrl}/get-tournaments?id=${tournamentId}`
      );
      const tournaments = await tourResponse.json();
      const tournament = tournaments[0];

      if (!tournament) {
        console.error("Tournament not found");
        return;
      }

      document.getElementById("tournamentTitle").textContent = tournament.name;

      // Load leaderboard
      const statsResponse = await fetch(
        `${this.baseUrl}/get-stats?type=tournament&tournament_id=${tournamentId}`
      );
      const stats = await statsResponse.json();
      this.renderTournamentLeaderboard(stats);

      // Load upcoming matches for this pair
      await this.loadMatchesForTournament(tournamentId);

      // Setup match submission
      this.setupMatchModal(tournament, stats);
    } catch (error) {
      console.error("Error loading tournament data:", error);
    }
  }

  renderTournamentLeaderboard(stats) {
    const container = document.getElementById("tournamentLeaderboard");

    if (!stats || stats.length === 0) {
      container.innerHTML = "<p>No leaderboard data available</p>";
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
                    ${stats
                      .map(
                        (player, idx) => `
                        <div class="table-row">
                            <div class="player-info">
                                <img src="${
                                  player.photo_url ||
                                  "src/images/default-avatar.jpg"
                                }" 
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
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;

    container.innerHTML = tableHtml;
  }

  async loadMatchesForTournament(tournamentId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/get-matches?tournament_id=${tournamentId}&status=scheduled&limit=5`
      );
      const matches = await response.json();

      const container = document.getElementById("recentMatches");

      if (!matches || matches.length === 0) {
        container.innerHTML = "<p>No scheduled matches</p>";
        return;
      }

      container.innerHTML = matches
        .map(
          (match) => `
                <div class="match-card">
                    <div class="match-players">
                        <span>${match.player_a_name}</span>
                        <span>vs</span>
                        <span>${match.player_b_name}</span>
                    </div>
                    <div class="match-status">Scheduled</div>
                </div>
            `
        )
        .join("");
    } catch (error) {
      console.error("Error loading matches:", error);
    }
  }

  setupMatchModal(tournament, stats) {
    const playerASelect = document.getElementById("playerASelect");
    const playerBSelect = document.getElementById("playerBSelect");

    playerASelect.innerHTML = stats
      .map((p) => `<option value="${p.id}">${p.name} (${p.team_name})</option>`)
      .join("");

    playerBSelect.innerHTML = stats
      .map((p) => `<option value="${p.id}">${p.name} (${p.team_name})</option>`)
      .join("");
  }

  async deleteTournament() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get("id");

    if (!tournamentId) {
      Utils.showNotification("Tournament ID not found", "error");
      return;
    }

    // Confirm deletion
    const confirmed = confirm(
      "Are you sure you want to delete this tournament? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    try {
      // In a real app, you'd have a delete endpoint
      // For now, show success and go back
      Utils.showNotification(
        "Tournament deleted (feature coming soon)",
        "success"
      );
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      Utils.showNotification(
        "Error deleting tournament: " + error.message,
        "error"
      );
    }
  }

  async submitMatchResult() {
    try {
      const playerAId = document.getElementById("playerASelect").value;
      const playerBId = document.getElementById("playerBSelect").value;
      const goalsAInput = document.getElementById("goalsA");
      const goalsBInput = document.getElementById("goalsB");

      if (!playerAId || !playerBId) {
        Utils.showNotification("Please select both players", "error");
        return;
      }

      if (playerAId === playerBId) {
        Utils.showNotification("Players must be different", "error");
        return;
      }

      if (!goalsAInput || !goalsBInput) {
        Utils.showNotification("Goals input not found", "error");
        return;
      }

      const goalsA = parseInt(goalsAInput.value);
      const goalsB = parseInt(goalsBInput.value);

      if (isNaN(goalsA) || isNaN(goalsB) || goalsA < 0 || goalsB < 0) {
        Utils.showNotification(
          "Please enter valid goals (0 or higher)",
          "error"
        );
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const tournamentId = urlParams.get("id");

      if (!tournamentId) {
        Utils.showNotification("Tournament ID not found", "error");
        return;
      }

      // Create match ID following the same pattern as fixture generation
      // Try the primary direction first
      const matchId1 = `match_${tournamentId}_${playerAId}_${playerBId}_0`;

      const response = await fetch(`${this.baseUrl}/update-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: matchId1,
          goalsA: goalsA,
          goalsB: goalsB,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Utils.showNotification("Match recorded successfully!", "success");
        const modal = document.getElementById("addMatchModal");
        if (modal) {
          modal.style.display = "none";
        }
        const form = document.getElementById("matchForm");
        if (form) {
          form.reset();
        }

        // Reload tournament data to update leaderboard
        await this.loadTournamentData(tournamentId);
      } else {
        Utils.showNotification(
          "Error: " + (result.error || "Failed to record match"),
          "error"
        );
        console.error("Match submission error:", result);
      }
    } catch (error) {
      console.error("Error submitting match:", error);
      Utils.showNotification("Error: " + error.message, "error");
    }
  }
}

// Initialize tournament manager
const tournamentManager = new TournamentManager();
