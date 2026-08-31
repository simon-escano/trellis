use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub jwt_secret: String,
    pub cors_origin: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        let _ = dotenvy::dotenv();
        let _ = dotenvy::from_filename("apps/server/.env");
        let _ = dotenvy::from_filename("../.env");

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/trellis".to_string());

        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(8080);

        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "trellis-super-secret-jwt-signing-key-production-hardening".to_string());

        let cors_origin = env::var("CORS_ORIGIN").ok();

        Self {
            database_url,
            port,
            jwt_secret,
            cors_origin,
        }
    }
}
