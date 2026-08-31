use async_graphql::dataloader::Loader;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::{Entity, EntityRelationship};

pub struct EntityLoader {
    pool: PgPool,
}

impl EntityLoader {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl Loader<Uuid> for EntityLoader {
    type Value = Vec<Entity>;
    type Error = Arc<sqlx::Error>;

    async fn load(&self, keys: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let entities = sqlx::query_as::<_, Entity>(
            "SELECT id, document_id, name, category, confidence_score, metadata, created_at FROM entities WHERE document_id = ANY($1)"
        )
        .bind(keys)
        .fetch_all(&self.pool)
        .await
        .map_err(Arc::new)?;

        let mut map: HashMap<Uuid, Vec<Entity>> = HashMap::new();
        for key in keys {
            map.insert(*key, Vec::new());
        }
        for entity in entities {
            map.entry(entity.document_id).or_default().push(entity);
        }

        Ok(map)
    }
}

pub struct RelationshipLoader {
    pool: PgPool,
}

impl RelationshipLoader {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl Loader<Uuid> for RelationshipLoader {
    type Value = Vec<EntityRelationship>;
    type Error = Arc<sqlx::Error>;

    async fn load(&self, keys: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let relationships = sqlx::query_as::<_, EntityRelationship>(
            "SELECT id, document_id, source_entity_id, target_entity_id, relation_type, confidence_score, created_at FROM entity_relationships WHERE document_id = ANY($1)"
        )
        .bind(keys)
        .fetch_all(&self.pool)
        .await
        .map_err(Arc::new)?;

        let mut map: HashMap<Uuid, Vec<EntityRelationship>> = HashMap::new();
        for key in keys {
            map.insert(*key, Vec::new());
        }
        for rel in relationships {
            map.entry(rel.document_id).or_default().push(rel);
        }

        Ok(map)
    }
}

pub struct SingleEntityLoader {
    pool: PgPool,
}

impl SingleEntityLoader {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl Loader<Uuid> for SingleEntityLoader {
    type Value = Entity;
    type Error = Arc<sqlx::Error>;

    async fn load(&self, keys: &[Uuid]) -> Result<HashMap<Uuid, Self::Value>, Self::Error> {
        let entities = sqlx::query_as::<_, Entity>(
            "SELECT id, document_id, name, category, confidence_score, metadata, created_at FROM entities WHERE id = ANY($1)"
        )
        .bind(keys)
        .fetch_all(&self.pool)
        .await
        .map_err(Arc::new)?;

        let mut map: HashMap<Uuid, Entity> = HashMap::new();
        for entity in entities {
            map.insert(entity.id, entity);
        }

        Ok(map)
    }
}
