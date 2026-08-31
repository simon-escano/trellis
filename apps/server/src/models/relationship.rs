use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(sqlx::FromRow, Clone, Serialize, Deserialize, Debug, PartialEq)]
pub struct EntityRelationship {
    pub id: Uuid,
    pub document_id: Uuid,
    pub source_entity_id: Uuid,
    pub target_entity_id: Uuid,
    pub relation_type: String,
    pub confidence_score: f32,
    pub created_at: DateTime<Utc>,
}
