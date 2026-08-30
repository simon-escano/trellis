use async_graphql::{Context, Object, Result, ID};
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::graphql::types::{DocumentGql, IngestDocumentInput, IngestPayloadGql};
use crate::models::{Document as DocumentModel, ProcessingStatus};
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
        let pool = ctx.data_unchecked::<PgPool>();
        let queue_dispatcher = ctx.data_unchecked::<QueueDispatcher>();

        let doc_id = Uuid::new_v4();
        let job_id = Uuid::new_v4();
        let now = Utc::now();

        let doc = sqlx::query_as::<_, DocumentModel>(
            r#"
            INSERT INTO documents (id, title, raw_content, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $5)
            RETURNING *
            "#,
        )
        .bind(doc_id)
        .bind(&input.title)
        .bind(&input.raw_content)
        .bind(ProcessingStatus::Queued)
        .bind(now)
        .fetch_one(pool)
        .await?;

        let queue_job = QueueJob {
            job_id,
            document_id: doc_id,
            title: input.title,
            raw_content: input.raw_content,
            enqueued_at: now,
        };

        let queue_job_id = queue_dispatcher
            .dispatch_job(queue_job)
            .await
            .map_err(async_graphql::Error::new)?;

        Ok(IngestPayloadGql {
            document: DocumentGql::from(doc),
            queue_job_id,
        })
    }

    async fn reprocess_document(&self, ctx: &Context<'_>, id: ID) -> Result<DocumentGql> {
        let pool = ctx.data_unchecked::<PgPool>();
        let queue_dispatcher = ctx.data_unchecked::<QueueDispatcher>();
        let uuid = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let now = Utc::now();
        let job_id = Uuid::new_v4();

        let doc = sqlx::query_as::<_, DocumentModel>(
            r#"
            UPDATE documents
            SET status = $1, summary = NULL, error_message = NULL, updated_at = $2
            WHERE id = $3
            RETURNING *
            "#,
        )
        .bind(ProcessingStatus::Queued)
        .bind(now)
        .bind(uuid)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| async_graphql::Error::new(format!("Document {} not found", uuid)))?;

        let queue_job = QueueJob {
            job_id,
            document_id: doc.id,
            title: doc.title.clone(),
            raw_content: doc.raw_content.clone(),
            enqueued_at: now,
        };

        let _ = queue_dispatcher.dispatch_job(queue_job).await;

        Ok(DocumentGql::from(doc))
    }

    async fn delete_document(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let pool = ctx.data_unchecked::<PgPool>();
        let uuid = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let result = sqlx::query("DELETE FROM documents WHERE id = $1")
            .bind(uuid)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
