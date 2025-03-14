export interface WorkerEnv {
  DB: D1Database;
  PLAYER_CACHE?: KVNamespace;
  BUCKET: R2Bucket; // S3-compatible R2 bucket
  ANALYTICS_API_URL: string;
  WORKER_KEY: string;
  WORKER_NAME?: string;
}

export interface GameAnalytics {
  id: string;
  env: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  number_turns: number;
  game_mode: string;
  winner: string;
  difficulty: string;
  mapType: string;
  players: GamePlayer[];
}

export interface GamePlayer {
  username: string;
  ip: string;
  persistentID: string;
  clientID: string;
}

export interface PlayerStats {
  playerId: string;
  lastActive: number;
  totalPlayTime: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}
