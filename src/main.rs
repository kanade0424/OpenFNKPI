use serde::{Deserialize,Serialize};
use axum::{routing::get, Router};

// ファイルパスを定義
const PUBLIC_PATH: &str = "/var/www/openfnkpi/";

#[tokio::main]
fn main() {
    println!("Hello, world!");
    println!("Public Path:{}", PUBLIC_PATH);
}
