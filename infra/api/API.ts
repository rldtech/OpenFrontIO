import { Database } from "../lib/Database";
import type { WorkerEnv } from "../Types";
import type { GameAnalytics } from "../Types";

// Common CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type HandlerFunction = (request: Request, db: Database) => Promise<Response>;

class Handler {
  private handlers: Map<
    string,
    { handler: HandlerFunction; method: HttpMethod; useAuth: boolean }
  > = new Map();

  register(
    path: string,
    method: HttpMethod,
    handler: HandlerFunction,
    useAuth: boolean = false,
  ): void {
    this.handlers.set(path, { handler, method, useAuth });
  }

  async handle(request: Request, env: WorkerEnv): Promise<Response> {
    // Check if WORKER_TOKEN is set
    if (!env.WORKER_KEY) {
      return new Response(
        JSON.stringify({
          error: "WORKER_KEY environment variable is not set",
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const route = this.handlers.get(path);
    if (!route) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          available_endpoints: Array.from(this.handlers.keys()),
        }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Check HTTP method
    if (request.method !== route.method) {
      return new Response(
        JSON.stringify({ error: `Method ${request.method} not allowed` }),
        { status: 405, headers: corsHeaders },
      );
    }

    // Check authentication if required
    if (route.useAuth) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      const token = authHeader.split(" ")[1];
      if (token !== env.WORKER_KEY) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    try {
      const db = new Database(env.DB);
      return await route.handler(request, db);
    } catch (error) {
      console.error(`Error handling ${path}:`, error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
}

// Create and configure the handler
const handler = new Handler();

handler.register("/ping", "GET", async () => {
  return new Response(JSON.stringify({ message: "pong" }), {
    headers: corsHeaders,
  });
});

handler.register(
  "/analytics",
  "POST",
  async (request, db) => {
    const gameData = (await request.json()) as GameAnalytics;
    await db.saveGameAnalytics(gameData);
    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  },
  true,
);

handler.register("/api/games", "GET", async (request, db) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const timeRange = searchParams.get("timeRange") || "24h";
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const now = new Date();
  let startTime = new Date();

  switch (timeRange) {
    case "1h":
      startTime.setHours(now.getHours() - 1);
      break;
    case "24h":
      startTime.setHours(now.getHours() - 24);
      break;
    case "7d":
      startTime.setDate(now.getDate() - 7);
      break;
    default:
      return new Response(JSON.stringify({ error: "Invalid time range" }), {
        status: 400,
        headers: corsHeaders,
      });
  }

  const games = await db.getGamesInTimeRange(startTime, now, limit, offset);

  return new Response(JSON.stringify(games), {
    headers: corsHeaders,
  });
});

handler.register("/player", "GET", async (request, db) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const playerId = searchParams.get("id");

  if (!playerId) {
    return new Response(JSON.stringify({ error: "Player ID is required" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const [playerStats, playerGames] = await Promise.all([
    db.getPlayerStats(playerId),
    db.getPlayerGames(playerId),
  ]);

  return new Response(
    JSON.stringify({
      stats: playerStats,
      games: playerGames,
    }),
    { headers: corsHeaders },
  );
});

handler.register("/stats", "GET", async (request, db) => {
  const stats = await db.getGameStats();
  return new Response(JSON.stringify(stats), {
    headers: corsHeaders,
  });
});

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    return handler.handle(request, env);
  },
};
