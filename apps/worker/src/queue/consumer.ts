import { getClient } from "../db.js";
import { analyzeDocumentContent } from "../services/llm.service.js";
import { saveAnalysisResults } from "../services/storage.service.js";
import { QueuedDocumentRecord } from "./types.js";

export class DocumentQueueConsumer {
  private isRunning = false;
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private pollIntervalMs: number = 2000) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(
      `[WORKER QUEUE] Starting document polling consumer (interval: ${this.pollIntervalMs}ms)...`
    );
    this.poll();
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    console.log("[WORKER QUEUE] Stopping consumer, draining active tasks...");
    while (this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log("[WORKER QUEUE] Consumer stopped cleanly.");
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.processNextBatch();
    } catch (error: any) {
      console.error("[WORKER QUEUE] Polling error:", error.message);
    } finally {
      if (this.isRunning) {
        this.timer = setTimeout(() => this.poll(), this.pollIntervalMs);
      }
    }
  }

  public async processNextBatch(): Promise<number> {
    const client = await getClient();
    this.isProcessing = true;

    try {
      await client.query("BEGIN");

      // 1. Lock available QUEUED documents
      const selectRes = await client.query<QueuedDocumentRecord>(
        `
        SELECT id, title, raw_content, status
        FROM documents
        WHERE status = 'QUEUED'
        ORDER BY created_at ASC
        LIMIT 5
        FOR UPDATE SKIP LOCKED
        `
      );

      const docs = selectRes.rows;
      if (docs.length === 0) {
        await client.query("COMMIT");
        return 0;
      }

      // 2. Mark as PROCESSING in bulk
      const docIds = docs.map((d) => d.id);
      await client.query(
        `
        UPDATE documents
        SET status = 'PROCESSING', updated_at = NOW()
        WHERE id = ANY($1)
        `,
        [docIds]
      );

      await client.query("COMMIT");

      console.log(
        `[WORKER QUEUE] Claimed ${docs.length} document(s) for extraction:`,
        docIds
      );

      // 3. Process each document through LLM & storage services
      for (const doc of docs) {
        console.log(
          `[WORKER QUEUE] Processing document "${doc.title}" (${doc.id})...`
        );
        try {
          const analysis = await analyzeDocumentContent(
            doc.raw_content,
            doc.title
          );
          await saveAnalysisResults(doc.id, analysis);
        } catch (err: any) {
          console.error(
            `[WORKER QUEUE] Failed processing document ${doc.id}:`,
            err.message
          );
        }
      }

      return docs.length;
    } catch (err: any) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
      this.isProcessing = false;
    }
  }
}
