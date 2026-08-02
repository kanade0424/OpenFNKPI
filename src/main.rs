use serde::{Deserialize,Serialize};
use axum::{routing::get, Router};
use tower_http::services::ServeDir;

// ファイルパスを定義
const PUBLIC_PATH: &str = "/var/www/openfnkpi/";

#[tokio::main]
async fn main() {
    println!("Hello, world!");
    println!("Public Path:{}", PUBLIC_PATH);

    let app = Router::new()
        .nest_service("/",ServeDir::new(PUBLIC_PATH))

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("failed to bind");

    println!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app)
        .await
        .expect("server error");
}
