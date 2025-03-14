import type { GameAnalytics, PlayerStats } from "../Types";

export class Database {
  constructor(private db: D1Database) {}

  async savePlayerStats(stats: PlayerStats): Promise<void> {
    await this.db
      .prepare(
        `
    INSERT INTO player_stats (
      playerId, lastActive, totalPlayTime, gamesPlayed, wins, losses
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(playerId) DO UPDATE SET
      lastActive = excluded.lastActive,
      totalPlayTime = excluded.totalPlayTime,
      gamesPlayed = excluded.gamesPlayed,
      wins = excluded.wins,
      losses = excluded.losses
  `,
      )
      .bind(
        stats.playerId,
        stats.lastActive,
        stats.totalPlayTime,
        stats.gamesPlayed,
        stats.wins,
        stats.losses,
      )
      .run();
  }

  async getPlayerStats(playerId: string): Promise<PlayerStats | null> {
    const result = await this.db
      .prepare(
        `
    SELECT * FROM player_stats WHERE playerId = ?
  `,
      )
      .bind(playerId)
      .first();

    return result as PlayerStats | null;
  }

  async getGamesInTimeRange(
    startTime: Date,
    endTime: Date,
    limit: number = 100,
    offset: number = 0,
  ) {
    return await this.db
      .prepare(
        `
    SELECT ga.*, GROUP_CONCAT(
      json_object(
        'username', gp.username,
        'client_id', gp.client_id
      )
    ) as players
    FROM game_analytics ga
    LEFT JOIN game_players gp ON ga.id = gp.game_id
    WHERE ga.start_time BETWEEN ? AND ?
    GROUP BY ga.id
    ORDER BY ga.start_time DESC
    LIMIT ? OFFSET ?
  `,
      )
      .bind(startTime.toISOString(), endTime.toISOString(), limit, offset)
      .all();
  }

  async getPlayerGames(
    playerId: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    return await this.db
      .prepare(
        `
    SELECT ga.*, GROUP_CONCAT(
      json_object(
        'username', gp.username,
        'client_id', gp.client_id
      )
    ) as players
    FROM game_analytics ga
    LEFT JOIN game_players gp ON ga.id = gp.game_id
    WHERE gp.client_id = ?
    GROUP BY ga.id
    ORDER BY ga.start_time DESC
    LIMIT ? OFFSET ?
  `,
      )
      .bind(playerId, limit, offset)
      .all();
  }

  async getGameStats() {
    return await this.db
      .prepare(
        `
    SELECT 
      COUNT(*) as total_games,
      AVG(duration_seconds) as avg_duration,
      AVG(number_turns) as avg_turns,
      COUNT(DISTINCT game_mode) as unique_game_modes,
      COUNT(DISTINCT difficulty) as unique_difficulties,
      COUNT(DISTINCT map_type) as unique_maps
    FROM game_analytics
  `,
      )
      .first();
  }

  async saveGameAnalytics(gameData: GameAnalytics) {
    const {
      id,
      env,
      start_time,
      end_time,
      duration_seconds,
      number_turns,
      game_mode,
      winner,
      difficulty,
      mapType,
      players,
    } = gameData;

    // Insert game analytics
    await this.db
      .prepare(
        `
    INSERT INTO game_analytics (
      id, env, start_time, end_time, duration_seconds, 
      number_turns, game_mode, winner, difficulty, map_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      )
      .bind(
        id,
        env,
        start_time,
        end_time,
        duration_seconds,
        number_turns,
        game_mode,
        winner,
        difficulty,
        mapType,
      )
      .run();

    // Insert players
    for (const player of players) {
      await this.db
        .prepare(
          `
    INSERT INTO game_players (
      game_id, username, ip, persistent_id, client_id
    ) VALUES (?, ?, ?, ?, ?)
  `,
        )
        .bind(
          id,
          player.username,
          player.ip,
          player.persistentID,
          player.clientID,
        )
        .run();
    }
  }
}
