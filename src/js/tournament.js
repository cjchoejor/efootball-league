class TournamentManager {
  constructor() {
    this.players = [];
    this.minPlayers = 3;
    this.baseUrl = "/.netlify/functions";
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.addPlayerForm(); // Add first player form
    this.updateTournamentName();
    this.checkUrlParams();
  }

  setupEventListeners() {
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener("click", () => {
        this.addPlayerForm();
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

  addPlayerForm() {
    const container = document.getElementById("playersContainer");
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
                        <label class="form-label">Photo (Optional)</label>
                        <input type="file" class="form-input photo-file" accept="image/*">
                        <small style="color: #b0b0b0; display: block; margin-top: 0.3rem;">Square image recommended</small>
                    </div>
                    <button type="button" class="btn-remove" onclick="tournamentManager.removePlayerForm(${playerIndex})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

    container.insertAdjacentHTML("beforeend", playerHtml);
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
    const playerCount = document.querySelectorAll(".player-form").length;
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
    const players = await this.collectPlayers();
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
          players,
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

  async collectPlayers() {
    const forms = document.querySelectorAll(".player-form");
    const players = [];

    for (let index = 0; index < forms.length; index++) {
      const form = forms[index];
      const name = form.querySelector(".player-name").value;
      const teamName = form.querySelector(".team-name").value;
      const photoFile = form.querySelector(".photo-file");

      if (name && teamName) {
        let photoUrl =
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"; // Default avatar

        // If file is selected, convert to base64
        if (photoFile && photoFile.files && photoFile.files[0]) {
          try {
            photoUrl = await this.fileToBase64(photoFile.files[0]);
          } catch (error) {
            console.error("Error converting image:", error);
            // Use default if conversion fails
          }
        }

        players.push({
          id: `player_${Date.now()}_${index}`,
          name: name,
          teamName: teamName,
          photoUrl: photoUrl,
        });
      }
    }

    return players;
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
      let tournaments = await tourResponse.json();
      
      // Handle wrapped response if needed
      if (tournaments && tournaments.body && typeof tournaments.body === "string") {
        tournaments = JSON.parse(tournaments.body);
      }
      
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
      let stats = await statsResponse.json();
      console.log("Stats raw response:", stats);
      
      // Handle wrapped response if needed
      if (stats && stats.body && typeof stats.body === "string") {
        stats = JSON.parse(stats.body);
      }
      
      console.log("Stats loaded:", stats);
      console.log("Stats type:", typeof stats);
      console.log("Stats is array:", Array.isArray(stats));
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
      let matches = await response.json();
      
      // Handle wrapped response if needed
      if (matches && matches.body && typeof matches.body === "string") {
        matches = JSON.parse(matches.body);
      }

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
