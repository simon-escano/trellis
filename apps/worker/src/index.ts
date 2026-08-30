import { config } from "./config.js";

console.log("[WORKER] Initialized with config:", {
  databaseUrl: config.databaseUrl,
  hasApiKey: Boolean(config.openaiApiKey),
  pollIntervalMs: config.pollIntervalMs,
});
