use async_graphql::{Context, Object, Result, ID};
use sqlx::PgPool;
use uuid::Uuid;

use crate::graphql::types::{DocumentGql, IngestDocumentInput, IngestPayloadGql};
use crate::models::{Document, ProcessingStatus};
use crate::queue::{QueueDispatcher, QueueJob};

#[derive(Default)]
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn ingest_document(
        &self,
        ctx: &Context<'_>,
        input: IngestDocumentInput,
    ) -> Result<IngestPayloadGql> {
        let pool = ctx.data::<PgPool>()?;
        let dispatcher = ctx.data::<QueueDispatcher>()?;

        let doc_id = Uuid::new_v4();
        let doc = sqlx::query_as::<_, Document>(
            "INSERT INTO documents (id, title, raw_content, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id, title, raw_content, summary, status, error_message, created_at, updated_at",
        )
        .bind(doc_id)
        .bind(&input.title)
        .bind(&input.raw_content)
        .bind(ProcessingStatus::Queued)
        .fetch_one(pool)
        .await?;

        let job = QueueJob::new(doc.id, doc.title.clone(), doc.raw_content.clone());
        let queue_job_id = job.job_id.to_string();

        let _ = dispatcher.dispatch(job);

        Ok(IngestPayloadGql {
            document: DocumentGql(doc),
            queue_job_id,
        })
    }

    async fn reprocess_document(&self, ctx: &Context<'_>, id: ID) -> Result<DocumentGql> {
        let pool = ctx.data::<PgPool>()?;
        let dispatcher = ctx.data::<QueueDispatcher>()?;
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let doc = sqlx::query_as::<_, Document>(
            "UPDATE documents
             SET status = $2, summary = NULL, error_message = NULL, updated_at = NOW()
             WHERE id = $1
             RETURNING id, title, raw_content, summary, status, error_message, created_at, updated_at",
        )
        .bind(doc_id)
        .bind(ProcessingStatus::Queued)
        .fetch_one(pool)
        .await?;

        let job = QueueJob::new(doc.id, doc.title.clone(), doc.raw_content.clone());
        let _ = dispatcher.dispatch(job);

        Ok(DocumentGql(doc))
    }

    async fn delete_document(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let pool = ctx.data::<PgPool>()?;
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let result = sqlx::query("DELETE FROM documents WHERE id = $1")
            .bind(doc_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
