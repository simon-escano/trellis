pub mod config;
pub mod db;
pub mod models;

fn main() {
    let _config = config::Config::from_env();
    println!("Trellis server initialized");
}
