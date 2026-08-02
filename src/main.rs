use serde::{Deserialize,Serialize};
use axum::{routing::get, Router};
use tower_http::services::ServeDir;

// ファイルパスを定義
const PUBLIC_PATH: &str = "/var/www/openfnkpi/";

#[tokio::main]
async fn main() {
    println!("Hello, world!");
    println!("Public Path:{}", PUBLIC_PATH);
    let s = "/media/ubuntu/3088977088973378/ss/OpenFNKPI/Dashboard/src";

    let app = Router::new()
        .fallback_service(ServeDir::new(s));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("failed to bind");

    println!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app)
        .await
        .expect("server error");
}
