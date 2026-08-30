pub mod dataloaders;
pub mod mutation;
pub mod query;
pub mod types;

pub use dataloaders::{EntityLoader, RelationshipLoader, SingleEntityLoader};
pub use mutation::MutationRoot;
pub use query::QueryRoot;
pub use types::{
    DocumentGql, EntityGql, EntityRelationshipGql, IngestDocumentInput, IngestPayloadGql,
    SystemMetricsGql,
};

use async_graphql::dataloader::DataLoader;
use async_graphql::{EmptySubscription, Schema};
use sqlx::PgPool;

use crate::queue::QueueDispatcher;

pub type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub fn build_schema(pool: PgPool, queue_dispatcher: QueueDispatcher) -> AppSchema {
    let entity_loader = DataLoader::new(EntityLoader::new(pool.clone()), tokio::spawn);
    let relationship_loader =
        DataLoader::new(RelationshipLoader::new(pool.clone()), tokio::spawn);
    let single_entity_loader =
        DataLoader::new(SingleEntityLoader::new(pool.clone()), tokio::spawn);

    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(pool)
        .data(queue_dispatcher)
        .data(entity_loader)
        .data(relationship_loader)
        .data(single_entity_loader)
        .finish()
}
