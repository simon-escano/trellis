use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(
    sqlx::Type,
    async_graphql::Enum,
    Serialize,
    Deserialize,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Debug,
)]
#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]
pub enum ProcessingStatus {
    Queued,
    Processing,
    Completed,
    Failed,
}

#[derive(sqlx::FromRow, Clone, Serialize, Deserialize, Debug, PartialEq)]
pub struct Document {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub title: String,
    pub raw_content: String,
    pub summary: Option<String>,
    pub status: ProcessingStatus,
    pub error_message: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
