import pg from "pg";
import { analyzeDocumentContent } from "../services/llm.service.js";
import { saveAnalysisResults } from "../services/storage.service.js";
import { QueuedDocumentRow } from "./types.js";

/**
 * Resilient Database-Backed Queue Consumer
 * Safe concurrency using SELECT ... FOR UPDATE SKIP LOCKED
 */
export async function pollAndProcessJobs(pool: pg.Pool): Promise<boolean> {
  let client: pg.PoolClient | null = null;
  let currentJob: QueuedDocumentRow | null = null;

  try {
    client = await pool.connect();

    // 1. Transactionally lock the next available QUEUED job
    await client.query("BEGIN;");

    const res = await client.query<QueuedDocumentRow>(
      `SELECT id, title, raw_content 
       FROM documents 
       WHERE status = 'QUEUED' 
       ORDER BY created_at ASC 
       LIMIT 1 
       FOR UPDATE SKIP LOCKED;`
    );

    if (res.rows.length === 0) {
      await client.query("COMMIT;");
      client.release();
      client = null;
      return false; // Queue empty
    }

    currentJob = res.rows[0];
    console.log(`[Job] Picked document: ${currentJob.id} ("${currentJob.title}")`);

    // 2. Transition status to PROCESSING
    await client.query(
      `UPDATE documents 
       SET status = 'PROCESSING', updated_at = NOW() 
       WHERE id = $1;`,
      [currentJob.id]
    );

    await client.query("COMMIT;");
    client.release();
    client = null;

    console.log(
      `[Worker] Status updated to PROCESSING for document: ${currentJob.id}`
    );
  } catch (err: any) {
    if (client) {
      try {
        await client.query("ROLLBACK;");
      } catch (_) {}
      client.release(err);
      client = null;
    }
    console.error(`[Worker] Error picking job from queue:`, err);
    return false;
  }

  if (!currentJob) return false;

  // 3. Perform AI Structured Extraction (Outside DB lock)
  try {
    console.log(`[AI] Running structured extraction for "${currentJob.title}"...`);
    const analysis = await analyzeDocumentContent(currentJob.raw_content, currentJob.title);
    console.log(
      `[AI] Extracted ${analysis.entities.length} concepts and ${analysis.relationships.length} relationships.`
    );

    // 4. Persist knowledge graph transactionally
    console.log(`[DB] Writing entities and directional links...`);
    await saveAnalysisResults(currentJob.id, analysis);
    console.log(`[DB] Document status set to COMPLETED for ${currentJob.id}.`);
    return true;
  } catch (err: any) {
    console.error(`[Worker] Error processing extraction/storage for ${currentJob.id}:`, err);
    try {
      await pool.query(
        `UPDATE documents 
         SET status = 'FAILED', error_message = $1, updated_at = NOW() 
         WHERE id = $2;`,
        [err?.message || "Extraction or persistence failure", currentJob.id]
      );
    } catch (updateErr) {
      console.error(`[Worker] Failed to update error status for ${currentJob.id}:`, updateErr);
    }
    return false;
  }
}
