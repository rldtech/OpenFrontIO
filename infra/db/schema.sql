CREATE TABLE IF NOT EXISTS player_stats (
  playerId TEXT PRIMARY KEY,
  lastActive INTEGER NOT NULL,
  totalPlayTime INTEGER NOT NULL DEFAULT 0,
  gamesPlayed INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_analytics (
  id TEXT PRIMARY KEY,
  env INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  number_turns INTEGER NOT NULL,
  game_mode TEXT NOT NULL,
  winner TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  map_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_game_analytics_start_time ON game_analytics(start_time);
CREATE INDEX IF NOT EXISTS idx_game_analytics_game_mode ON game_analytics(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_analytics_difficulty ON game_analytics(difficulty);
CREATE INDEX IF NOT EXISTS idx_game_analytics_map_type ON game_analytics(map_type);

-- Table for game players (many-to-many relationship)
CREATE TABLE IF NOT EXISTS game_players (
  game_id TEXT NOT NULL,
  username TEXT NOT NULL,
  ip TEXT NOT NULL,
  persistent_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES game_analytics(id),
  PRIMARY KEY (game_id, client_id)
);

