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
#[sqlx(type_name = "entity_category", rename_all = "SCREAMING_SNAKE_CASE")]
#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]
pub enum EntityCategory {
    System,
    Service,
    DataModel,
    Infrastructure,
    SecurityPolicy,
    ApiEndpoint,
    Concept,
}

#[derive(sqlx::FromRow, Clone, Serialize, Deserialize, Debug, PartialEq)]
pub struct Entity {
    pub id: Uuid,
    pub document_id: Uuid,
    pub name: String,
    pub category: EntityCategory,
    pub confidence_score: f32,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}
