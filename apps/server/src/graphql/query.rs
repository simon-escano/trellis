use async_graphql::{Context, Object, Result, ID};
use sqlx::PgPool;
use uuid::Uuid;

use crate::graphql::types::{DocumentGql, SystemMetricsGql};
use crate::models::Document;

#[derive(Default)]
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn get_documents(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<DocumentGql>> {
        let pool = ctx.data::<PgPool>()?;
        let limit = limit.clamp(1, 100) as i64;
        let offset = offset.max(0) as i64;

        let docs = sqlx::query_as::<_, Document>(
            "SELECT id, title, raw_content, summary, status, error_message, created_at, updated_at
             FROM documents
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(docs.into_iter().map(DocumentGql).collect())
    }

    async fn get_document(&self, ctx: &Context<'_>, id: ID) -> Result<Option<DocumentGql>> {
        let pool = ctx.data::<PgPool>()?;
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let doc = sqlx::query_as::<_, Document>(
            "SELECT id, title, raw_content, summary, status, error_message, created_at, updated_at
             FROM documents
             WHERE id = $1",
        )
        .bind(doc_id)
        .fetch_optional(pool)
        .await?;

        Ok(doc.map(DocumentGql))
    }

    async fn get_metrics(&self, ctx: &Context<'_>) -> Result<SystemMetricsGql> {
        let pool = ctx.data::<PgPool>()?;

        let row: (i64, i64, i64, i64) = sqlx::query_as(
            "SELECT
                COUNT(*)::BIGINT as total_documents,
                COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as processed_count,
                COUNT(*) FILTER (WHERE status = 'QUEUED')::BIGINT as queued_count,
                COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT as failed_count
             FROM documents",
        )
        .fetch_one(pool)
        .await?;

        Ok(SystemMetricsGql {
            total_documents: row.0 as i32,
            processed_count: row.1 as i32,
            queued_count: row.2 as i32,
            failed_count: row.3 as i32,
        })
    }
}
