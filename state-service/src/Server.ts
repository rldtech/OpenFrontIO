import express, { Request, Response } from "express";
import pool, { initDB } from "./db/Index";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Create or update session
app.post("/api/sessions", async (req: Request, res: Response) => {
  const { discord_id, session_id, metadata = {} } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO player_sessions (discord_id, session_id, metadata)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) 
       DO UPDATE SET 
         last_active = CURRENT_TIMESTAMP,
         metadata = player_sessions.metadata || $3::jsonb
       RETURNING *`,
      [discord_id, session_id, metadata]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by session ID
app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player_sessions WHERE session_id = $1',
      [req.params.sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Get all sessions for a Discord user
app.get("/api/sessions/discord/:discordId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player_sessions WHERE discord_id = $1 ORDER BY last_active DESC',
      [req.params.discordId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete session
app.delete("/api/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM player_sessions WHERE session_id = $1 RETURNING *',
      [req.params.sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default app;