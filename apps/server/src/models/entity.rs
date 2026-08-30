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
#[sqlx(type_name = "entity_category", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EntityCategory {
    System,
    Service,
    DataModel,
    Infrastructure,
    SecurityPolicy,
    ApiEndpoint,
    Concept,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Entity {
    pub id: Uuid,
    pub document_id: Uuid,
    pub name: String,
    pub category: EntityCategory,
    pub confidence_score: f32,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}
