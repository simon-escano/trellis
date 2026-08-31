use std::time::Duration;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Error, PgPool};

pub async fn init_db_pool(database_url: &str) -> Result<PgPool, Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(600))
        .connect(database_url)
        .await
}
