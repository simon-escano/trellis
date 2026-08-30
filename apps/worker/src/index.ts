import { config } from "./config.js";
import { pool } from "./db.js";
import { DocumentQueueConsumer } from "./queue/consumer.js";

async function main() {
  console.log("=========================================");
  console.log("  🌿 Trellis AI Extraction Worker v0.1.0  ");
  console.log("=========================================");
  console.log(`[WORKER] Database: ${config.databaseUrl}`);
  console.log(
    `[WORKER] AI Provider: ${
      config.openaiApiKey ? "OpenAI SDK" : "Deterministic Fallback"
    }`
  );
  console.log(`[WORKER] Polling Interval: ${config.pollIntervalMs}ms`);

  const consumer = new DocumentQueueConsumer(config.pollIntervalMs);
  consumer.start();

  let isShuttingDown = false;
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[WORKER] Received ${signal}. Initiating graceful shutdown...`);

    try {
      await consumer.stop();
      await pool.end();
      console.log("[WORKER] PostgreSQL pool closed. Goodbye.");
      process.exit(0);
    } catch (err: any) {
      console.error("[WORKER] Error during shutdown:", err.message);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[WORKER FATAL] Unhandled startup error:", err);
  process.exit(1);
});
