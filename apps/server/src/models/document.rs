use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
    sqlx::Type,
    async_graphql::Enum,
)]
#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProcessingStatus {
    Queued,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: Uuid,
    pub title: String,
    pub raw_content: String,
    pub summary: Option<String>,
    pub status: ProcessingStatus,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
