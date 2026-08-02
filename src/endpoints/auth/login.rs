pub async fn login() -> Result<Json<LoginResponse>, StatusCode> {
    // ログイン処理の実装
    // ここでは仮のレスポンスを返す
    let response = LoginResponse {
        message: "Login successful".to_string(),
        token: "dummy_token".to_string(),
    };
    Ok(Json(response))
}