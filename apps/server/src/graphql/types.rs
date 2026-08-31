use async_graphql::dataloader::DataLoader;
use async_graphql::{Context, InputObject, Object, SimpleObject, ID};

use crate::graphql::dataloaders::{EntityLoader, RelationshipLoader, SingleEntityLoader};
use crate::models::{
    Document as DocumentModel, Entity as EntityModel,
    EntityCategory, EntityRelationship as EntityRelationshipModel, ProcessingStatus,
};

#[derive(Clone, Debug)]
pub struct EntityGql(pub EntityModel);

#[Object]
impl EntityGql {
    async fn id(&self) -> ID {
        ID(self.0.id.to_string())
    }

    async fn document_id(&self) -> ID {
        ID(self.0.document_id.to_string())
    }

    async fn name(&self) -> &str {
        &self.0.name
    }

    async fn category(&self) -> EntityCategory {
        self.0.category
    }

    async fn confidence_score(&self) -> f32 {
        self.0.confidence_score
    }

    async fn metadata(&self) -> String {
        serde_json::to_string(&self.0.metadata).unwrap_or_else(|_| "{}".to_string())
    }

    async fn created_at(&self) -> String {
        self.0.created_at.to_rfc3339()
    }
}

#[derive(Clone, Debug)]
pub struct EntityRelationshipGql(pub EntityRelationshipModel);

#[Object]
impl EntityRelationshipGql {
    async fn id(&self) -> ID {
        ID(self.0.id.to_string())
    }

    async fn document_id(&self) -> ID {
        ID(self.0.document_id.to_string())
    }

    async fn source_entity(&self, ctx: &Context<'_>) -> async_graphql::Result<EntityGql> {
        let loader = ctx.data::<DataLoader<SingleEntityLoader>>()?;
        let entity = loader
            .load_one(self.0.source_entity_id)
            .await?
            .ok_or_else(|| async_graphql::Error::new("Source entity not found"))?;
        Ok(EntityGql(entity))
    }

    async fn target_entity(&self, ctx: &Context<'_>) -> async_graphql::Result<EntityGql> {
        let loader = ctx.data::<DataLoader<SingleEntityLoader>>()?;
        let entity = loader
            .load_one(self.0.target_entity_id)
            .await?
            .ok_or_else(|| async_graphql::Error::new("Target entity not found"))?;
        Ok(EntityGql(entity))
    }

    async fn relation_type(&self) -> &str {
        &self.0.relation_type
    }

    async fn confidence_score(&self) -> f32 {
        self.0.confidence_score
    }

    async fn created_at(&self) -> String {
        self.0.created_at.to_rfc3339()
    }
}

#[derive(Clone, Debug)]
pub struct DocumentGql(pub DocumentModel);

#[Object]
impl DocumentGql {
    async fn id(&self) -> ID {
        ID(self.0.id.to_string())
    }

    async fn title(&self) -> &str {
        &self.0.title
    }

    async fn raw_content(&self) -> &str {
        &self.0.raw_content
    }

    async fn summary(&self) -> Option<&str> {
        self.0.summary.as_deref()
    }

    async fn status(&self) -> ProcessingStatus {
        self.0.status
    }

    async fn error_message(&self) -> Option<&str> {
        self.0.error_message.as_deref()
    }

    async fn created_at(&self) -> String {
        self.0.created_at.to_rfc3339()
    }

    async fn updated_at(&self) -> String {
        self.0.updated_at.to_rfc3339()
    }

    async fn entities(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<EntityGql>> {
        let loader = ctx.data::<DataLoader<EntityLoader>>()?;
        let entities = loader
            .load_one(self.0.id)
            .await?
            .unwrap_or_default();
        Ok(entities.into_iter().map(EntityGql).collect())
    }

    async fn relationships(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<EntityRelationshipGql>> {
        let loader = ctx.data::<DataLoader<RelationshipLoader>>()?;
        let rels = loader
            .load_one(self.0.id)
            .await?
            .unwrap_or_default();
        Ok(rels.into_iter().map(EntityRelationshipGql).collect())
    }
}

#[derive(InputObject)]
pub struct IngestDocumentInput {
    pub title: String,
    pub raw_content: String,
}

#[derive(SimpleObject)]
pub struct IngestPayloadGql {
    pub document: DocumentGql,
    pub queue_job_id: String,
}

#[derive(SimpleObject, Default)]
pub struct SystemMetricsGql {
    pub total_documents: i32,
    pub processed_count: i32,
    pub queued_count: i32,
    pub failed_count: i32,
}
