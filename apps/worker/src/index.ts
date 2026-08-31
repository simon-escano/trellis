import { config } from "./config.js";
import { pool } from "./db.js";
import { pollAndProcessJobs } from "./queue/consumer.js";

let isShuttingDown = false;
let isProcessing = false;

async function runLoop() {
  console.log(
    `[Worker] Connected to PostgreSQL. Polling for queued documents every ${config.pollIntervalMs}ms...`
  );

  while (!isShuttingDown) {
    try {
      isProcessing = true;
      let hasWork = true;

      // Drain all queued jobs before waiting
      while (hasWork && !isShuttingDown) {
        hasWork = await pollAndProcessJobs(pool);
      }
    } catch (err) {
      console.error("[Worker] Polling loop error:", err);
    } finally {
      isProcessing = false;
    }

    if (!isShuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
    }
  }

  console.log("[Worker] Polling loop exited cleanly.");
}

async function gracefulShutdown(signal: string) {
  console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);
  isShuttingDown = true;

  // Wait for any in-flight job to finish (up to 10 seconds)
  const maxWait = 10000;
  const start = Date.now();
  while (isProcessing && Date.now() - start < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  try {
    await pool.end();
    console.log("[Worker] Database connection pool closed.");
  } catch (err) {
    console.error("[Worker] Error closing database pool:", err);
  }

  console.log("[Worker] Process terminated cleanly.");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

runLoop().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});
