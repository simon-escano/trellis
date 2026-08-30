use async_graphql::dataloader::DataLoader;
use async_graphql::{Context, InputObject, SimpleObject, ID};

use crate::graphql::dataloaders::{EntityLoader, RelationshipLoader, SingleEntityLoader};
use crate::models::{
    Document as DocumentModel, Entity as EntityModel,
    EntityCategory, EntityRelationship as EntityRelationshipModel, ProcessingStatus,
};

#[derive(Clone, Debug)]
pub struct EntityGql {
    pub inner: EntityModel,
}

impl From<EntityModel> for EntityGql {
    fn from(inner: EntityModel) -> Self {
        Self { inner }
    }
}

#[async_graphql::Object(name = "Entity")]
impl EntityGql {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn document_id(&self) -> ID {
        ID(self.inner.document_id.to_string())
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn category(&self) -> EntityCategory {
        self.inner.category
    }

    async fn confidence_score(&self) -> f64 {
        self.inner.confidence_score as f64
    }

    async fn metadata(&self) -> String {
        self.inner.metadata.to_string()
    }

    async fn created_at(&self) -> String {
        self.inner.created_at.to_rfc3339()
    }
}

#[derive(Clone, Debug)]
pub struct EntityRelationshipGql {
    pub inner: EntityRelationshipModel,
}

impl From<EntityRelationshipModel> for EntityRelationshipGql {
    fn from(inner: EntityRelationshipModel) -> Self {
        Self { inner }
    }
}

#[async_graphql::Object(name = "EntityRelationship")]
impl EntityRelationshipGql {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn document_id(&self) -> ID {
        ID(self.inner.document_id.to_string())
    }

    async fn source_entity(&self, ctx: &Context<'_>) -> async_graphql::Result<EntityGql> {
        let loader = ctx.data_unchecked::<DataLoader<SingleEntityLoader>>();
        let entity = loader
            .load_one(self.inner.source_entity_id)
            .await?
            .ok_or_else(|| {
                async_graphql::Error::new(format!(
                    "Source entity {} not found",
                    self.inner.source_entity_id
                ))
            })?;
        Ok(EntityGql::from(entity))
    }

    async fn target_entity(&self, ctx: &Context<'_>) -> async_graphql::Result<EntityGql> {
        let loader = ctx.data_unchecked::<DataLoader<SingleEntityLoader>>();
        let entity = loader
            .load_one(self.inner.target_entity_id)
            .await?
            .ok_or_else(|| {
                async_graphql::Error::new(format!(
                    "Target entity {} not found",
                    self.inner.target_entity_id
                ))
            })?;
        Ok(EntityGql::from(entity))
    }

    async fn relation_type(&self) -> &str {
        &self.inner.relation_type
    }

    async fn confidence_score(&self) -> f64 {
        self.inner.confidence_score as f64
    }

    async fn created_at(&self) -> String {
        self.inner.created_at.to_rfc3339()
    }
}

#[derive(Clone, Debug)]
pub struct DocumentGql {
    pub inner: DocumentModel,
}

impl From<DocumentModel> for DocumentGql {
    fn from(inner: DocumentModel) -> Self {
        Self { inner }
    }
}

#[async_graphql::Object(name = "Document")]
impl DocumentGql {
    async fn id(&self) -> ID {
        ID(self.inner.id.to_string())
    }

    async fn title(&self) -> &str {
        &self.inner.title
    }

    async fn raw_content(&self) -> &str {
        &self.inner.raw_content
    }

    async fn summary(&self) -> Option<&str> {
        self.inner.summary.as_deref()
    }

    async fn status(&self) -> ProcessingStatus {
        self.inner.status
    }

    async fn error_message(&self) -> Option<&str> {
        self.inner.error_message.as_deref()
    }

    async fn created_at(&self) -> String {
        self.inner.created_at.to_rfc3339()
    }

    async fn updated_at(&self) -> String {
        self.inner.updated_at.to_rfc3339()
    }

    async fn entities(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<EntityGql>> {
        let loader = ctx.data_unchecked::<DataLoader<EntityLoader>>();
        let entities = loader
            .load_one(self.inner.id)
            .await?
            .unwrap_or_default()
            .into_iter()
            .map(EntityGql::from)
            .collect();
        Ok(entities)
    }

    async fn relationships(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<EntityRelationshipGql>> {
        let loader = ctx.data_unchecked::<DataLoader<RelationshipLoader>>();
        let relationships = loader
            .load_one(self.inner.id)
            .await?
            .unwrap_or_default()
            .into_iter()
            .map(EntityRelationshipGql::from)
            .collect();
        Ok(relationships)
    }
}

#[derive(SimpleObject, Clone, Debug)]
#[graphql(name = "SystemMetrics")]
pub struct SystemMetricsGql {
    pub total_documents: i32,
    pub processed_count: i32,
    pub queued_count: i32,
    pub failed_count: i32,
}

#[derive(SimpleObject, Clone, Debug)]
#[graphql(name = "IngestPayload")]
pub struct IngestPayloadGql {
    pub document: DocumentGql,
    pub queue_job_id: String,
}

#[derive(InputObject, Clone, Debug)]
#[graphql(name = "IngestDocumentInput")]
pub struct IngestDocumentInput {
    pub title: String,
    pub raw_content: String,
}
