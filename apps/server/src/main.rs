pub mod config;
pub mod db;
pub mod graphql;
pub mod models;
pub mod queue;

fn main() {
    let _config = config::Config::from_env();
    let (_dispatcher, _rx) = queue::create_queue_dispatcher(100);
    println!("Trellis server initialized");
}
