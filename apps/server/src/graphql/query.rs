use async_graphql::{Context, Object, Result, ID};
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::AuthUser;
use crate::graphql::types::{DocumentGql, SystemMetricsGql, UserGql};
use crate::models::{Document, User};

#[derive(Default)]
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn me(&self, ctx: &Context<'_>) -> Result<Option<UserGql>> {
        let pool = ctx.data::<PgPool>()?;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());

        if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                let user = sqlx::query_as::<_, User>(
                    "SELECT id, email, password_hash, created_at FROM users WHERE id = $1",
                )
                .bind(auth_user.id)
                .fetch_optional(pool)
                .await?;

                if let Some(u) = user {
                    return Ok(Some(UserGql {
                        id: ID(u.id.to_string()),
                        email: u.email,
                        created_at: u.created_at.to_rfc3339(),
                        is_guest: false,
                    }));
                }
            } else {
                return Ok(Some(UserGql {
                    id: ID(Uuid::nil().to_string()),
                    email: "guest@trellis.local".to_string(),
                    created_at: chrono::Utc::now().to_rfc3339(),
                    is_guest: true,
                }));
            }
        }

        Ok(None)
    }

    async fn get_documents(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 20)] limit: i32,
        #[graphql(default = 0)] offset: i32,
    ) -> Result<Vec<DocumentGql>> {
        let pool = ctx.data::<PgPool>()?;
        let limit = limit.clamp(1, 100) as i64;
        let offset = offset.max(0) as i64;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());

        let docs = if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                // Authenticated user: ONLY see their own documents
                sqlx::query_as::<_, Document>(
                    "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                     FROM documents
                     WHERE user_id = $1
                     ORDER BY created_at DESC
                     LIMIT $2 OFFSET $3",
                )
                .bind(auth_user.id)
                .bind(limit)
                .bind(offset)
                .fetch_all(pool)
                .await?
            } else {
                // Guest user: ONLY see guest/demo documents where user_id IS NULL
                sqlx::query_as::<_, Document>(
                    "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                     FROM documents
                     WHERE user_id IS NULL
                     ORDER BY created_at DESC
                     LIMIT $1 OFFSET $2",
                )
                .bind(limit)
                .bind(offset)
                .fetch_all(pool)
                .await?
            }
        } else {
            // Unauthenticated visitor: ONLY see guest/demo documents where user_id IS NULL
            sqlx::query_as::<_, Document>(
                "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                 FROM documents
                 WHERE user_id IS NULL
                 ORDER BY created_at DESC
                 LIMIT $1 OFFSET $2",
            )
            .bind(limit)
            .bind(offset)
            .fetch_all(pool)
            .await?
        };

        Ok(docs.into_iter().map(DocumentGql).collect())
    }

    async fn get_document(&self, ctx: &Context<'_>, id: ID) -> Result<Option<DocumentGql>> {
        let pool = ctx.data::<PgPool>()?;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let doc = if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                // Authenticated user: ONLY get their own document
                sqlx::query_as::<_, Document>(
                    "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                     FROM documents
                     WHERE id = $1 AND user_id = $2",
                )
                .bind(doc_id)
                .bind(auth_user.id)
                .fetch_optional(pool)
                .await?
            } else {
                // Guest: ONLY get unowned/demo document
                sqlx::query_as::<_, Document>(
                    "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                     FROM documents
                     WHERE id = $1 AND user_id IS NULL",
                )
                .bind(doc_id)
                .fetch_optional(pool)
                .await?
            }
        } else {
            // Unauthenticated: ONLY get unowned/demo document
            sqlx::query_as::<_, Document>(
                "SELECT id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at
                 FROM documents
                 WHERE id = $1 AND user_id IS NULL",
            )
            .bind(doc_id)
            .fetch_optional(pool)
            .await?
        };

        Ok(doc.map(DocumentGql))
    }

    async fn get_metrics(&self, ctx: &Context<'_>) -> Result<SystemMetricsGql> {
        let pool = ctx.data::<PgPool>()?;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());

        let row: (i64, i64, i64, i64) = if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                sqlx::query_as(
                    "SELECT
                        COUNT(*)::BIGINT as total_documents,
                        COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as processed_count,
                        COUNT(*) FILTER (WHERE status = 'QUEUED')::BIGINT as queued_count,
                        COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT as failed_count
                     FROM documents
                     WHERE user_id = $1",
                )
                .bind(auth_user.id)
                .fetch_one(pool)
                .await?
            } else {
                sqlx::query_as(
                    "SELECT
                        COUNT(*)::BIGINT as total_documents,
                        COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as processed_count,
                        COUNT(*) FILTER (WHERE status = 'QUEUED')::BIGINT as queued_count,
                        COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT as failed_count
                     FROM documents
                     WHERE user_id IS NULL",
                )
                .fetch_one(pool)
                .await?
            }
        } else {
            sqlx::query_as(
                "SELECT
                    COUNT(*)::BIGINT as total_documents,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED')::BIGINT as processed_count,
                    COUNT(*) FILTER (WHERE status = 'QUEUED')::BIGINT as queued_count,
                    COUNT(*) FILTER (WHERE status = 'FAILED')::BIGINT as failed_count
                 FROM documents
                 WHERE user_id IS NULL",
            )
            .fetch_one(pool)
            .await?
        };

        Ok(SystemMetricsGql {
            total_documents: row.0 as i32,
            processed_count: row.1 as i32,
            queued_count: row.2 as i32,
            failed_count: row.3 as i32,
        })
    }
}
