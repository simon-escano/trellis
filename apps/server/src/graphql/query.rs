use async_graphql::{Context, Object, Result, ID};
use sqlx::PgPool;
use uuid::Uuid;

use crate::graphql::types::{DocumentGql, SystemMetricsGql};
use crate::models::Document as DocumentModel;

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
        let pool = ctx.data_unchecked::<PgPool>();
        let limit = limit.max(1).min(100) as i64;
        let offset = offset.max(0) as i64;

        let docs = sqlx::query_as::<_, DocumentModel>(
            "SELECT * FROM documents ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(docs.into_iter().map(DocumentGql::from).collect())
    }

    async fn get_document(&self, ctx: &Context<'_>, id: ID) -> Result<Option<DocumentGql>> {
        let pool = ctx.data_unchecked::<PgPool>();
        let uuid = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let doc = sqlx::query_as::<_, DocumentModel>("SELECT * FROM documents WHERE id = $1")
            .bind(uuid)
            .fetch_optional(pool)
            .await?;

        Ok(doc.map(DocumentGql::from))
    }

    async fn get_metrics(&self, ctx: &Context<'_>) -> Result<SystemMetricsGql> {
        let pool = ctx.data_unchecked::<PgPool>();

        let row: (i64, i64, i64, i64) = sqlx::query_as(
            r#"
            SELECT
                COUNT(*)::bigint AS total_documents,
                COUNT(*) FILTER (WHERE status = 'COMPLETED')::bigint AS processed_count,
                COUNT(*) FILTER (WHERE status = 'QUEUED')::bigint AS queued_count,
                COUNT(*) FILTER (WHERE status = 'FAILED')::bigint AS failed_count
            FROM documents
            "#,
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
