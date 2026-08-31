use async_graphql::dataloader::DataLoader;
use async_graphql::http::GraphiQLSource;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::Extension,
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
pub mod graphql;
pub mod models;
pub mod queue;

use config::Config;
use db::init_db_pool;
use graphql::dataloaders::{EntityLoader, RelationshipLoader, SingleEntityLoader};
use graphql::{build_schema, AppSchema};
use queue::QueueDispatcher;

async fn graphql_handler(schema: Extension<AppSchema>, req: GraphQLRequest) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphiql() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/graphql").finish())
}

async fn health_check() -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(json!({
            "service": "trellis-server",
            "status": "healthy"
        })),
    )
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    eprintln!("[Server] Starting Trellis GraphQL Gateway on port {}...", config.port);
    eprintln!("[Server] Connecting to database: {}", config.database_url);

    let pool = match init_db_pool(&config.database_url).await {
        Ok(p) => {
            eprintln!("[Server] Database connection pool established successfully.");
            p
        }
        Err(e) => {
            eprintln!("[Server Error] Database connection failed: {:#?}", e);
            return Err(e.into());
        }
    };

    let entity_loader = DataLoader::new(EntityLoader::new(pool.clone()), tokio::spawn);
    let relationship_loader = DataLoader::new(RelationshipLoader::new(pool.clone()), tokio::spawn);
    let single_entity_loader = DataLoader::new(SingleEntityLoader::new(pool.clone()), tokio::spawn);

    let (dispatcher, mut job_receiver) = QueueDispatcher::new(100);

    // Background job receiver task (logging dispatched jobs)
    tokio::spawn(async move {
        while let Some(job) = job_receiver.recv().await {
            tracing::info!(
                job_id = %job.job_id,
                document_id = %job.document_id,
                title = %job.title,
                "Job queued in memory for worker pipeline"
            );
        }
    });

    let schema: AppSchema = build_schema()
        .data(pool)
        .data(dispatcher)
        .data(entity_loader)
        .data(relationship_loader)
        .data(single_entity_loader)
        .finish();

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/graphql", get(graphiql).post(graphql_handler))
        .layer(Extension(schema))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    eprintln!("[Server] Server running on http://localhost:{} (GraphiQL IDE at /graphql)", config.port);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
