mod config;

fn main() {
    let _config = config::Config::from_env();
    println!("Trellis server initialized");
}
