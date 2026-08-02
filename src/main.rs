use serde::{Deserialize,Serialize};
use axum::{
    routing::{get, post, put, delete},
    Router,
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use tower_http::services::ServeDir;

mod endpoints;

// ファイルパスを定義
const PUBLIC_PATH: &str = "/var/www/openfnkpi/";
const DB_PATH: &str = "/var/opt/openfnkpi/data.db";
const LOG_PATH: &str = "/var/log/openfnkpi/";

#[tokio::main]
async fn main() {
    println!("Hello, world!");
    println!("Public Path:{}", PUBLIC_PATH);
    let s = "/media/ubuntu/3088977088973378/ss/OpenFNKPI/Dashboard/src";

    let app = Router::new()
        .fallback_service(ServeDir::new(s));//現在はテストのため、直接プロジェクトのパスを使用していますが、実際にはPUBLIC_PATHを使うので置き換えてください。

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("failed to bind");

    println!("listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app)
        .await
        .expect("server error");
}
