use std::net::SocketAddr;

use async_graphql::http::GraphiQLSource;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::Extension,
    http::{header, Method},
    response::{Html, IntoResponse},
    routing::get,
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod config;
pub mod db;
pub mod graphql;
pub mod models;
pub mod queue;

use config::Config;
use graphql::{build_schema, AppSchema};
use queue::create_queue_dispatcher;

async fn graphql_handler(schema: Extension<AppSchema>, req: GraphQLRequest) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphiql() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/graphql").finish())
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "trellis-backend"
    }))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "trellis_server=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    tracing::info!("Initializing PostgreSQL pool at {}", config.database_url);

    let pool = db::init_db_pool(&config.database_url)
        .await
        .unwrap_or_else(|err| {
            tracing::warn!(
                "Could not connect to database immediately (creating lazy pool): {}",
                err
            );
            sqlx::postgres::PgPoolOptions::new()
                .max_connections(20)
                .connect_lazy(&config.database_url)
                .expect("Failed to create lazy pool")
        });

    let (queue_dispatcher, mut queue_rx) = create_queue_dispatcher(1000);

    // Spawn background queue logger for worker handoff tracing
    tokio::spawn(async move {
        while let Some(job) = queue_rx.recv().await {
            tracing::info!(
                job_id = %job.job_id,
                document_id = %job.document_id,
                title = %job.title,
                "Enqueued document processing job for worker"
            );
        }
    });

    let schema = build_schema(pool, queue_dispatcher);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/graphql", get(graphiql).post(graphql_handler))
        .route("/health", get(health_check))
        .layer(Extension(schema))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    tracing::info!("🚀 Trellis GraphQL Gateway running at http://{}", addr);
    tracing::info!("🎮 GraphiQL Playground accessible at http://{}/graphql", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
