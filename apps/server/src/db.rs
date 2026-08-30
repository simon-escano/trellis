use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

pub async fn init_db_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
}
