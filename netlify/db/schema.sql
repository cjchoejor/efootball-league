-- Players table
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    team_name TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'ongoing',
    matches_per_player INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tournament players junction table
CREATE TABLE IF NOT EXISTS tournament_players (
    tournament_id TEXT,
    player_id TEXT,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    player_a_id TEXT NOT NULL,
    player_b_id TEXT NOT NULL,
    goals_a INTEGER DEFAULT 0,
    goals_b INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled',
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_a_id) REFERENCES players(id),
    FOREIGN KEY (player_b_id) REFERENCES players(id)
);

-- Tournament stats table
CREATE TABLE IF NOT EXISTS tournament_stats (
    tournament_id TEXT,
    player_id TEXT,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- All-time stats table
CREATE TABLE IF NOT EXISTS all_time_stats (
    player_id TEXT PRIMARY KEY,
    tournaments_played INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_draws INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    biggest_win TEXT,
    best_team TEXT,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_stats_tournament ON tournament_stats(tournament_id);
CREATE INDEX IF NOT EXISTS idx_all_time_stats_points ON all_time_stats(total_points);
