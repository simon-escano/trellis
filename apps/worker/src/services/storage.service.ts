import { getClient, query } from "../db.js";
import { DocumentAnalysisOutput } from "../contracts/extraction.js";

export async function saveAnalysisResults(
  documentId: string,
  data: DocumentAnalysisOutput
): Promise<void> {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // 1. Update parent document record
    await client.query(
      `
      UPDATE documents
      SET summary = $1, status = 'COMPLETED', updated_at = NOW(), error_message = NULL
      WHERE id = $2
      `,
      [data.summary, documentId]
    );

    // 2. Clear existing entities for idempotency on re-processing (cascades to relationships)
    await client.query("DELETE FROM entities WHERE document_id = $1", [
      documentId,
    ]);

    // 3. Batch insert entities and map entity names to newly created UUIDs
    const entityMap = new Map<string, string>();

    for (const entity of data.entities) {
      const res = await client.query(
        `
        INSERT INTO entities (document_id, name, category, confidence_score, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, name
        `,
        [
          documentId,
          entity.name,
          entity.category,
          entity.confidenceScore,
          JSON.stringify(entity.metadata || {}),
        ]
      );

      const inserted = res.rows[0];
      entityMap.set(inserted.name.toLowerCase().trim(), inserted.id);
    }

    // 4. Resolve source and target entities and batch insert relationships
    for (const rel of data.relationships) {
      const sourceId = entityMap.get(rel.sourceEntityName.toLowerCase().trim());
      const targetId = entityMap.get(rel.targetEntityName.toLowerCase().trim());

      if (!sourceId || !targetId) {
        console.warn(
          `[WORKER STORAGE] Skipping unresolvable relationship: "${rel.sourceEntityName}" -> "${rel.targetEntityName}"`
        );
        continue;
      }

      await client.query(
        `
        INSERT INTO entity_relationships (document_id, source_entity_id, target_entity_id, relation_type, confidence_score, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [documentId, sourceId, targetId, rel.relationType, rel.confidenceScore]
      );
    }

    await client.query("COMMIT");
    console.log(
      `[WORKER STORAGE] Successfully persisted analysis for document ${documentId}: ${data.entities.length} entities, ${data.relationships.length} relationships.`
    );
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(
      `[WORKER STORAGE] Transaction failed for document ${documentId}:`,
      error.message
    );

    // Persist failure status to document
    try {
      await query(
        `
        UPDATE documents
        SET status = 'FAILED', error_message = $1, updated_at = NOW()
        WHERE id = $2
        `,
        [error.message || "Unknown extraction error", documentId]
      );
    } catch (updateErr: any) {
      console.error(
        `[WORKER STORAGE] Failed to record FAILED status for document ${documentId}:`,
        updateErr.message
      );
    }

    throw error;
  } finally {
    client.release();
  }
}
