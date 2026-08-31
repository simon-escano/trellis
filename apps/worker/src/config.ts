import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export interface WorkerConfig {
  databaseUrl: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  aiModel: string;
  geminiApiKey?: string;
  geminiModel: string;
  pollIntervalMs: number;
}

export const config: WorkerConfig = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/trellis",
  openaiApiKey: process.env.OPENAI_API_KEY || undefined,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
  aiModel: process.env.AI_MODEL || "gpt-4o-mini",
  geminiApiKey: process.env.GEMINI_API_KEY || undefined,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "3000", 10),
};
