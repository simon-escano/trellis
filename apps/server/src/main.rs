use async_graphql::dataloader::DataLoader;
use async_graphql::http::GraphiQLSource;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    body::Body,
    extract::Extension,
    http::{header, HeaderMap, HeaderValue, Method, Request, StatusCode},
    middleware::{self, Next},
    response::{Html, IntoResponse, Json, Response},
    routing::get,
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod auth;
mod config;
mod db;
pub mod graphql;
pub mod models;
pub mod queue;

use auth::extract_auth_user;
use config::Config;
use db::init_db_pool;
use graphql::dataloaders::{EntityLoader, RelationshipLoader, SingleEntityLoader};
use graphql::{build_schema, AppSchema};
use queue::QueueDispatcher;

async fn graphql_handler(
    schema: Extension<AppSchema>,
    config: Extension<Config>,
    headers: HeaderMap,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let auth_header = headers
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    let auth_user = extract_auth_user(auth_header, &config.jwt_secret);

    let mut request = req.into_inner();
    request = request.data(auth_user);

    schema.execute(request).await.into()
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

async fn security_headers_middleware(req: Request<Body>, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();

    headers.insert(
        header::STRICT_TRANSPORT_SECURITY,
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    response
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
            eprintln!("[Server] Database connection pool & migrations established successfully.");
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
        .data(config.clone())
        .data(dispatcher)
        .data(entity_loader)
        .data(relationship_loader)
        .data(single_entity_loader)
        .finish();

    // Production-hardened CORS
    let configured_cors = config.cors_origin.clone();
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |origin: &HeaderValue, _| {
            if let Ok(s) = origin.to_str() {
                // If custom CORS_ORIGIN is set and matches
                if let Some(ref custom_origin) = configured_cors {
                    if custom_origin.split(',').any(|co| co.trim() == s) {
                        return true;
                    }
                }
                // Allowed local dev and vercel domains
                s == "http://localhost:4200"
                    || s == "http://localhost:8080"
                    || s == "http://127.0.0.1:4200"
                    || s == "http://127.0.0.1:8080"
                    || s.ends_with(".vercel.app")
                    || s.ends_with(".onrender.com")
                    || s.starts_with("https://trellis")
            } else {
                false
            }
        }))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT])
        .allow_credentials(true);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/graphql", get(graphiql).post(graphql_handler))
        .layer(Extension(schema))
        .layer(Extension(config.clone()))
        .layer(cors)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(RequestBodyLimitLayer::new(2 * 1024 * 1024)); // 2MB max payload

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    eprintln!(
        "[Server] Server running on http://localhost:{} (GraphiQL IDE at /graphql)",
        config.port
    );

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
