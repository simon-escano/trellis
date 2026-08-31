import pg from "pg";
import { analyzeDocumentContent } from "../services/llm.service.js";
import { saveAnalysisResults } from "../services/storage.service.js";
import { QueuedDocumentRow } from "./types.js";

/**
 * Resilient Database-Backed Queue Consumer
 * Safe concurrency using SELECT ... FOR UPDATE SKIP LOCKED
 */
export async function pollAndProcessJobs(pool: pg.Pool): Promise<boolean> {
  const client = await pool.connect();

  try {
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
      return false; // Queue empty
    }

    const job = res.rows[0];
    console.log(`[Job] Picked document: ${job.id} ("${job.title}")`);

    // 2. Transition status to PROCESSING
    await client.query(
      `UPDATE documents 
       SET status = 'PROCESSING', updated_at = NOW() 
       WHERE id = $1;`,
      [job.id]
    );

    await client.query("COMMIT;");
    console.log(
      `[Worker] Status updated to PROCESSING for document: ${job.id}`
    );

    // 3. Perform AI Structured Extraction
    console.log(`[AI] Running structured extraction for "${job.title}"...`);
    const analysis = await analyzeDocumentContent(job.raw_content, job.title);
    console.log(
      `[AI] Extracted ${analysis.entities.length} concepts and ${analysis.relationships.length} relationships.`
    );

    // 4. Persist knowledge graph transactionally
    console.log(
      `[DB] Transaction BEGIN: Writing entities and directional links...`
    );
    await saveAnalysisResults(job.id, analysis);
    console.log(
      `[DB] Transaction COMMITTED: Document status set to COMPLETED.`
    );

    return true;
  } catch (err: any) {
    try {
      await client.query("ROLLBACK;");
    } catch (_) {}
    console.error(`[Worker] Error processing job:`, err);
    return false;
  } finally {
    client.release();
  }
}
