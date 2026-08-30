import dotenv from "dotenv";

dotenv.config();

export interface WorkerConfig {
  databaseUrl: string;
  openaiApiKey?: string;
  pollIntervalMs: number;
}

export const config: WorkerConfig = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/trellis",
  openaiApiKey: process.env.OPENAI_API_KEY,
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "2000", 10),
};
