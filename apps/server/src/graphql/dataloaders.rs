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
        let rows = sqlx::query_as::<_, Entity>(
            "SELECT * FROM entities WHERE document_id = ANY($1) ORDER BY created_at ASC",
        )
        .bind(keys)
        .fetch_all(&self.pool)
        .await
        .map_err(Arc::new)?;

        let mut map: HashMap<Uuid, Vec<Entity>> = HashMap::new();
        for key in keys {
            map.insert(*key, Vec::new());
        }
        for entity in rows {
            if let Some(list) = map.get_mut(&entity.document_id) {
                list.push(entity);
            }
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
        let rows = sqlx::query_as::<_, EntityRelationship>(
            "SELECT * FROM entity_relationships WHERE document_id = ANY($1) ORDER BY created_at ASC",
        )
        .bind(keys)
        .fetch_all(&self.pool)
        .await
        .map_err(Arc::new)?;

        let mut map: HashMap<Uuid, Vec<EntityRelationship>> = HashMap::new();
        for key in keys {
            map.insert(*key, Vec::new());
        }
        for rel in rows {
            if let Some(list) = map.get_mut(&rel.document_id) {
                list.push(rel);
            }
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
        let rows = sqlx::query_as::<_, Entity>("SELECT * FROM entities WHERE id = ANY($1)")
            .bind(keys)
            .fetch_all(&self.pool)
            .await
            .map_err(Arc::new)?;

        let mut map = HashMap::new();
        for entity in rows {
            map.insert(entity.id, entity);
        }
        Ok(map)
    }
}
