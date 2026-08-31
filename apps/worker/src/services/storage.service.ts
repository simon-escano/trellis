import { pool } from "../db.js";
import { DocumentAnalysisOutput } from "../contracts/extraction.js";

/**
 * Transactional Knowledge Graph Persistence Service
 * Safely persists document summaries, entities, and directional relationships with full rollback guarantees.
 */
export async function saveAnalysisResults(
  documentId: string,
  data: DocumentAnalysisOutput
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // 1. Update document status and summary
    await client.query(
      `UPDATE documents
       SET summary = $1,
           status = 'COMPLETED',
           error_message = NULL,
           updated_at = NOW()
       WHERE id = $2;`,
      [data.summary, documentId]
    );

    // 2. Clear existing child records for idempotency (e.g. reprocessing)
    await client.query("DELETE FROM entities WHERE document_id = $1;", [
      documentId,
    ]);

    // 3. Batch-insert entities and build name-to-UUID lookup map
    const nameToIdMap = new Map<string, string>();

    for (const entity of data.entities) {
      const res = await client.query<{ id: string; name: string }>(
        `INSERT INTO entities (document_id, name, category, confidence_score, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, name;`,
        [
          documentId,
          entity.name,
          entity.category,
          entity.confidenceScore,
          JSON.stringify(entity.metadata || {}),
        ]
      );

      if (res.rows.length > 0) {
        nameToIdMap.set(entity.name.trim().toLowerCase(), res.rows[0].id);
      }
    }

    // 4. Resolve foreign keys and insert relationships
    for (const rel of data.relationships) {
      const sourceId = nameToIdMap.get(
        rel.sourceEntityName.trim().toLowerCase()
      );
      const targetId = nameToIdMap.get(
        rel.targetEntityName.trim().toLowerCase()
      );

      if (!sourceId || !targetId) {
        console.warn(
          `[Storage] Skipping unresolvable relationship edge: "${rel.sourceEntityName}" -> "${rel.targetEntityName}"`
        );
        continue;
      }

      await client.query(
        `INSERT INTO entity_relationships (document_id, source_entity_id, target_entity_id, relation_type, confidence_score, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW());`,
        [documentId, sourceId, targetId, rel.relationType, rel.confidenceScore]
      );
    }

    await client.query("COMMIT;");
    console.log(
      `[Storage] Successfully persisted analysis for document ${documentId} (${data.entities.length} concepts, ${data.relationships.length} connections).`
    );
  } catch (err: any) {
    await client.query("ROLLBACK;");
    console.error(
      `[Storage] Transaction rolled back for document ${documentId}:`,
      err
    );

    // Update document with failed state
    try {
      await pool.query(
        `UPDATE documents
         SET status = 'FAILED',
             error_message = $1,
             updated_at = NOW()
         WHERE id = $2;`,
        [err?.message || "Unknown processing failure", documentId]
      );
    } catch (updateErr) {
      console.error(
        `[Storage] Failed to record error status for document ${documentId}:`,
        updateErr
      );
    }

    throw err;
  } finally {
    client.release();
  }
}
