mod models;
mod db;

use std::sync::{Arc, Mutex};
use std::net::SocketAddr;
use axum::{
    extract::{Path, Query, State},
    http::{Method, StatusCode},
    response::IntoResponse,
    routing::{get, post, patch},
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use serde::Deserialize;
use serde_json::json;

use models::{
    BookingRequest, CreatePonRequest, UpdatePonRequest, BlockSlotRequest, BookingResponse
};

type AppState = Arc<Mutex<db::DatabaseData>>;

#[derive(Debug, Deserialize)]
struct MonthQuery {
    month: Option<String>, // e.g. "2026-09"
}

#[derive(Debug, Deserialize)]
struct SearchQuery {
    q: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UpdateStatusRequest {
    status: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let initial_data = db::DatabaseData::load_or_init();
    println!("💅 Database loaded successfully (petite_nails_data.json)");

    let state: AppState = Arc::new(Mutex::new(initial_data));

    // Configure CORS for SvelteKit (localhost:5173 or any origin)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        // Public API
        .route("/api/studio", get(get_studio))
        .route("/api/services", get(get_services))
        .route("/api/availability", get(get_availability))
        .route("/api/availability/{date}", get(get_date_slots))
        .route("/api/bookings", post(create_booking))
        .route("/api/pon", get(get_pon_orders))
        // Admin API
        .route("/api/admin/bookings", get(get_all_bookings))
        .route("/api/admin/bookings/{id}/status", patch(update_booking_status))
        .route("/api/admin/pon", post(create_pon_order))
        .route("/api/admin/pon/{id}", patch(update_pon_order))
        .route("/api/admin/slots/block", post(block_slot))
        .route("/api/admin/slots/unblock", post(unblock_slot))
        .route("/api/admin/services", post(create_service))
        .route("/api/admin/services/{id}", patch(update_service).delete(delete_service))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("💅 Petite Girl Nails Backend running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind port");
    axum::serve(listener, app).await.expect("Axum server failed to start");
}

async fn get_studio() -> impl IntoResponse {
    let info = db::get_studio_info();
    Json(json!({ "success": true, "data": info }))
}

async fn get_services(State(state): State<AppState>) -> impl IntoResponse {
    let data = state.lock().unwrap();
    let services = db::get_services(&data);
    Json(json!({ "success": true, "data": services }))
}

async fn get_availability(
    State(state): State<AppState>,
    Query(params): Query<MonthQuery>,
) -> impl IntoResponse {
    let data = state.lock().unwrap();
    let now = chrono::Local::now();
    let (year, month) = match params.month {
        Some(ref m) => {
            let parts: Vec<&str> = m.split('-').collect();
            if parts.len() == 2 {
                let y = parts[0].parse::<i32>().unwrap_or(now.format("%Y").to_string().parse().unwrap());
                let m = parts[1].parse::<u32>().unwrap_or(now.format("%m").to_string().parse().unwrap());
                (y, m)
            } else {
                (now.format("%Y").to_string().parse().unwrap(), now.format("%m").to_string().parse().unwrap())
            }
        }
        None => (now.format("%Y").to_string().parse().unwrap(), now.format("%m").to_string().parse().unwrap()),
    };

    let days = db::get_month_availability(&data, year, month);
    Json(json!({ "success": true, "year": year, "month": month, "data": days }))
}

async fn get_date_slots(
    State(state): State<AppState>,
    Path(date): Path<String>,
) -> impl IntoResponse {
    let data = state.lock().unwrap();
    let slots_resp = db::get_slots_for_date(&data, &date);
    Json(json!({ "success": true, "data": slots_resp }))
}

async fn create_booking(
    State(state): State<AppState>,
    Json(payload): Json<BookingRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::create_booking(&mut data, payload) {
        Ok((record, wa_url)) => (
            StatusCode::CREATED,
            Json(BookingResponse {
                success: true,
                message: "Booking berhasil dibuat! Silahkan konfirmasi ke WhatsApp.".to_string(),
                booking_code: record.booking_code.clone(),
                whatsapp_url: wa_url,
                booking: record,
            }),
        ).into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({ "success": false, "error": e })),
        ).into_response(),
    }
}

async fn get_all_bookings(State(state): State<AppState>) -> impl IntoResponse {
    let data = state.lock().unwrap();
    let bookings = db::get_all_bookings(&data);
    Json(json!({ "success": true, "data": bookings }))
}

async fn update_booking_status(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateStatusRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::update_booking_status(&mut data, id, &payload.status) {
        Ok(_) => Json(json!({ "success": true, "message": "Status booking berhasil diperbarui" })).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn get_pon_orders(
    State(state): State<AppState>,
    Query(params): Query<SearchQuery>,
) -> impl IntoResponse {
    let data = state.lock().unwrap();
    let orders = db::get_all_pon_orders(&data, params.q.as_deref());
    Json(json!({ "success": true, "data": orders }))
}

async fn create_pon_order(
    State(state): State<AppState>,
    Json(payload): Json<CreatePonRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::create_pon_order(&mut data, payload) {
        Ok(order) => (StatusCode::CREATED, Json(json!({ "success": true, "data": order }))).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn update_pon_order(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdatePonRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::update_pon_order(&mut data, id, payload) {
        Ok(_) => Json(json!({ "success": true, "message": "Status pesanan PON berhasil diperbarui" })).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn block_slot(
    State(state): State<AppState>,
    Json(payload): Json<BlockSlotRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::block_slot(&mut data, &payload.date, payload.time.as_deref(), payload.reason.as_deref()) {
        Ok(_) => Json(json!({ "success": true, "message": "Slot berhasil diblokir" })).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn unblock_slot(
    State(state): State<AppState>,
    Json(payload): Json<BlockSlotRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::unblock_slot(&mut data, &payload.date, payload.time.as_deref()) {
        Ok(_) => Json(json!({ "success": true, "message": "Slot berhasil dibuka kembali" })).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn create_service(
    State(state): State<AppState>,
    Json(payload): Json<models::CreateServiceRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::create_service(&mut data, payload) {
        Ok(item) => (StatusCode::CREATED, Json(json!({ "success": true, "data": item }))).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn update_service(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Json(payload): Json<models::UpdateServiceRequest>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::update_service(&mut data, id, payload) {
        Ok(item) => (StatusCode::OK, Json(json!({ "success": true, "data": item }))).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

async fn delete_service(
    State(state): State<AppState>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let mut data = state.lock().unwrap();
    match db::delete_service(&mut data, id) {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true, "message": "Layanan berhasil dihapus" }))).into_response(),
        Err(e) => (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": e }))).into_response(),
    }
}

