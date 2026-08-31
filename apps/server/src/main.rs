mod config;
mod db;

#[tokio::main]
async fn main() {
    let config = config::Config::from_env();
    println!("trellis-server configured for port {}", config.port);
}
