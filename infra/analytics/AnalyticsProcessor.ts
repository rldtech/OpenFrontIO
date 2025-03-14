// src/workers/analytics-worker/index.ts

import { GameAnalytics } from "Types";

export interface WorkerEnv {
  BUCKET: any;
  // D1 Database binding
  DB: D1Database;
  API_ENDPOINT: string;
  WORKER_TOKEN: string;
}

export interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

export default {
  // This function will be triggered by the cron
  async scheduled(
    event: ScheduledEvent,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ) {
    console.log("=== Analytics Worker Started (Scheduled) ===");
    return this.processAnalytics(env);
  },

  // Add a fetch handler for manual triggering
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    console.log("=== Analytics Worker Started (HTTP) ===");
    return this.processAnalytics(env);
  },

  // Shared processing logic
  async processAnalytics(env: WorkerEnv) {
    console.log(
      "Event received:",
      JSON.stringify({ type: "analytics-processing" }, null, 2),
    );
    console.log("Environment:", {
      API_ENDPOINT: env.API_ENDPOINT,
      BUCKET: env.BUCKET ? "Available" : "Not Available",
      WORKER_TOKEN: env.WORKER_TOKEN ? "Available" : "Not Available",
    });
    console.log(
      "Analytics processing job running at:",
      new Date().toISOString(),
    );
    console.log("=================================");

    try {
      // List all analytics files from the S3 bucket
      console.log("Attempting to list bucket contents...");
      const objects = await env.BUCKET.list({
        prefix: "/analytics",
        limit: 1000, // Adjust based on your needs
      });
      console.log(`Found ${objects.objects.length} objects to process`);

      let processedCount = 0;
      let errorCount = 0;

      // Process each analytics file
      for (const object of objects.objects) {
        try {
          // Get the file content
          const file = await env.BUCKET.get(object.key);
          if (!file) continue;

          // Parse the analytics data
          const analyticsData = (await file.json()) as GameAnalytics;

          // Send analytics data to API endpoint
          const response = await fetch(
            `https://${env.API_ENDPOINT}/analytics`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.WORKER_TOKEN}`,
              },
              body: JSON.stringify(analyticsData),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to save analytics: ${response.statusText}`);
          }

          processedCount++;

          // Move file to archive folder
          const archiveKey = object.key.replace("/analytics", "/archive");
          await env.BUCKET.put(archiveKey, file.body);
          await env.BUCKET.delete(object.key);

          console.log(`Processed and archived: ${object.key}`);
        } catch (error) {
          console.error(`Error processing file ${object.key}:`, error);
          errorCount++;
        }
      }

      console.log(
        `Successfully processed ${processedCount} files (${errorCount} errors)`,
      );
      return new Response(
        JSON.stringify({
          processed: processedCount,
          errors: errorCount,
        }),
        { status: 200 },
      );
    } catch (error) {
      console.error("Error in analytics processing job:", error);
      return new Response(
        "Error in analytics processing job: " + (error as Error).message,
        { status: 500 },
      );
    }
  },
};
