use async_graphql::{Context, Object, Result, ID};
use regex::Regex;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{create_jwt, hash_password, verify_password, AuthUser};
use crate::config::Config;
use crate::graphql::types::{
    AuthPayloadGql, DocumentGql, IngestDocumentInput, IngestPayloadGql, LoginInput, RegisterInput,
    UserGql,
};
use crate::models::{Document, ProcessingStatus, User};
use crate::queue::{QueueDispatcher, QueueJob};

#[derive(Default)]
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn register(&self, ctx: &Context<'_>, input: RegisterInput) -> Result<AuthPayloadGql> {
        let pool = ctx.data::<PgPool>()?;
        let config = ctx.data::<Config>()?;

        let email = input.email.trim().to_lowercase();
        let password = input.password;

        let email_regex = Regex::new(r"^[\w\.\+-]+@[\w\.-]+\.\w+$")
            .map_err(|e| async_graphql::Error::new(format!("Regex error: {}", e)))?;
        if !email_regex.is_match(&email) {
            return Err(async_graphql::Error::new("Please provide a valid email address."));
        }

        if password.len() < 6 {
            return Err(async_graphql::Error::new("Password must be at least 6 characters long."));
        }

        let existing_user = sqlx::query_as::<_, User>("SELECT id, email, password_hash, created_at FROM users WHERE email = $1")
            .bind(&email)
            .fetch_optional(pool)
            .await?;

        if existing_user.is_some() {
            return Err(async_graphql::Error::new("An account with this email already exists."));
        }

        let password_hash = hash_password(&password)
            .map_err(|e| async_graphql::Error::new(format!("Failed to hash password: {}", e)))?;

        let user_id = Uuid::new_v4();
        let user = sqlx::query_as::<_, User>(
            "INSERT INTO users (id, email, password_hash, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, email, password_hash, created_at",
        )
        .bind(user_id)
        .bind(&email)
        .bind(&password_hash)
        .fetch_one(pool)
        .await?;

        let token = create_jwt(user.id, &user.email, false, &config.jwt_secret)
            .map_err(|e| async_graphql::Error::new(format!("Failed to issue token: {}", e)))?;

        Ok(AuthPayloadGql {
            token,
            user: UserGql {
                id: ID(user.id.to_string()),
                email: user.email,
                created_at: user.created_at.to_rfc3339(),
                is_guest: false,
            },
        })
    }

    async fn login(&self, ctx: &Context<'_>, input: LoginInput) -> Result<AuthPayloadGql> {
        let pool = ctx.data::<PgPool>()?;
        let config = ctx.data::<Config>()?;

        let email = input.email.trim().to_lowercase();
        let password = input.password;

        let user = sqlx::query_as::<_, User>(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
        )
        .bind(&email)
        .fetch_optional(pool)
        .await?;

        let user = match user {
            Some(u) => u,
            None => return Err(async_graphql::Error::new("Invalid email or password.")),
        };

        if !verify_password(&password, &user.password_hash) {
            return Err(async_graphql::Error::new("Invalid email or password."));
        }

        let token = create_jwt(user.id, &user.email, false, &config.jwt_secret)
            .map_err(|e| async_graphql::Error::new(format!("Failed to issue token: {}", e)))?;

        Ok(AuthPayloadGql {
            token,
            user: UserGql {
                id: ID(user.id.to_string()),
                email: user.email,
                created_at: user.created_at.to_rfc3339(),
                is_guest: false,
            },
        })
    }

    async fn guest_session(&self, ctx: &Context<'_>) -> Result<AuthPayloadGql> {
        let config = ctx.data::<Config>()?;
        let guest_id = Uuid::nil();
        let guest_email = "guest@trellis.local".to_string();

        let token = create_jwt(guest_id, &guest_email, true, &config.jwt_secret)
            .map_err(|e| async_graphql::Error::new(format!("Failed to issue guest token: {}", e)))?;

        Ok(AuthPayloadGql {
            token,
            user: UserGql {
                id: ID(guest_id.to_string()),
                email: guest_email,
                created_at: chrono::Utc::now().to_rfc3339(),
                is_guest: true,
            },
        })
    }

    async fn ingest_document(
        &self,
        ctx: &Context<'_>,
        input: IngestDocumentInput,
    ) -> Result<IngestPayloadGql> {
        let pool = ctx.data::<PgPool>()?;
        let dispatcher = ctx.data::<QueueDispatcher>()?;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());

        // Cost & DoS Protection Limits
        let raw_trimmed = input.raw_content.trim();
        if raw_trimmed.is_empty() {
            return Err(async_graphql::Error::new("Document content cannot be empty."));
        }
        if raw_trimmed.chars().count() > 50_000 {
            return Err(async_graphql::Error::new(
                "Document exceeds the maximum limit of 50,000 characters. Please split larger documents.",
            ));
        }

        let user_id = match auth_user_opt {
            Some(u) if !u.is_guest => Some(u.id),
            _ => None,
        };

        let doc_id = Uuid::new_v4();
        let safe_title = if input.title.chars().count() > 250 {
            let truncated: String = input.title.chars().take(247).collect();
            format!("{}...", truncated)
        } else {
            input.title
        };

        let doc = sqlx::query_as::<_, Document>(
            "INSERT INTO documents (id, user_id, title, raw_content, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at",
        )
        .bind(doc_id)
        .bind(user_id)
        .bind(&safe_title)
        .bind(raw_trimmed)
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
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let doc = if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                sqlx::query_as::<_, Document>(
                    "UPDATE documents
                     SET status = $2, summary = NULL, error_message = NULL, updated_at = NOW()
                     WHERE id = $1 AND user_id = $3
                     RETURNING id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at",
                )
                .bind(doc_id)
                .bind(ProcessingStatus::Queued)
                .bind(auth_user.id)
                .fetch_optional(pool)
                .await?
            } else {
                sqlx::query_as::<_, Document>(
                    "UPDATE documents
                     SET status = $2, summary = NULL, error_message = NULL, updated_at = NOW()
                     WHERE id = $1 AND user_id IS NULL
                     RETURNING id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at",
                )
                .bind(doc_id)
                .bind(ProcessingStatus::Queued)
                .fetch_optional(pool)
                .await?
            }
        } else {
            sqlx::query_as::<_, Document>(
                "UPDATE documents
                 SET status = $2, summary = NULL, error_message = NULL, updated_at = NOW()
                 WHERE id = $1 AND user_id IS NULL
                 RETURNING id, user_id, title, raw_content, summary, status, error_message, created_at, updated_at",
            )
            .bind(doc_id)
            .bind(ProcessingStatus::Queued)
            .fetch_optional(pool)
            .await?
        };

        let doc = doc.ok_or_else(|| async_graphql::Error::new("Document not found or permission denied."))?;

        let job = QueueJob::new(doc.id, doc.title.clone(), doc.raw_content.clone());
        let _ = dispatcher.dispatch(job);

        Ok(DocumentGql(doc))
    }

    async fn delete_document(&self, ctx: &Context<'_>, id: ID) -> Result<bool> {
        let pool = ctx.data::<PgPool>()?;
        let auth_user_opt = ctx.data_opt::<Option<AuthUser>>().and_then(|o| o.as_ref());
        let doc_id = Uuid::parse_str(&id.0)
            .map_err(|e| async_graphql::Error::new(format!("Invalid UUID: {}", e)))?;

        let result = if let Some(auth_user) = auth_user_opt {
            if !auth_user.is_guest {
                sqlx::query("DELETE FROM documents WHERE id = $1 AND user_id = $2")
                    .bind(doc_id)
                    .bind(auth_user.id)
                    .execute(pool)
                    .await?
            } else {
                sqlx::query("DELETE FROM documents WHERE id = $1 AND user_id IS NULL")
                    .bind(doc_id)
                    .execute(pool)
                    .await?
            }
        } else {
            sqlx::query("DELETE FROM documents WHERE id = $1 AND user_id IS NULL")
                .bind(doc_id)
                .execute(pool)
                .await?
        };

        Ok(result.rows_affected() > 0)
    }
}
