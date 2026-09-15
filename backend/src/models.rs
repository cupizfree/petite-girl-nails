use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookingRequest {
    pub name: String,
    pub whatsapp: String,
    pub services: Vec<String>,
    pub design_inspo: Option<String>,
    pub appointment_date: String, // YYYY-MM-DD
    pub appointment_time: String, // "10:00", "13:00", etc.
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookingRecord {
    pub id: i64,
    pub booking_code: String,
    pub name: String,
    pub whatsapp: String,
    pub services: Vec<String>,
    pub design_inspo: String,
    pub appointment_date: String,
    pub appointment_time: String,
    pub notes: Option<String>,
    pub status: String, // PENDING, CONFIRMED, COMPLETED, CANCELLED
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlotOverride {
    pub date: String,
    pub time: Option<String>,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DayAvailability {
    pub date: String, // YYYY-MM-DD
    pub day_number: u32,
    pub total_slots: usize,
    pub available_slots: usize,
    pub is_full: bool,
    pub is_closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlotDetail {
    pub time: String,
    pub status: String, // AVAILABLE, BOOKED, BLOCKED
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateSlotResponse {
    pub date: String,
    pub formatted_date: String,
    pub total_available: usize,
    pub slots: Vec<SlotDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PonOrder {
    pub id: i64,
    pub order_id: String, // e.g. PON-001
    pub customer_name: String,
    pub deadline: String,
    pub status: String, // ANTRI, PROGRESS, READY_TO_PICK_UP, SENT, CANCELLED
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePonRequest {
    pub order_id: Option<String>,
    pub customer_name: String,
    pub deadline: String,
    pub status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePonRequest {
    pub status: Option<String>,
    pub deadline: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceItem {
    pub id: i64,
    pub name: String,
    pub category: String,
    pub estimated_duration_min: u32,
    pub price: i64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateServiceRequest {
    pub name: String,
    pub category: Option<String>,
    pub estimated_duration_min: u32,
    pub price: i64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateServiceRequest {
    pub name: Option<String>,
    pub category: Option<String>,
    pub estimated_duration_min: Option<u32>,
    pub price: Option<i64>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StudioInfo {
    pub name: String,
    pub tagline: String,
    pub est: String,
    pub whatsapp: String,
    pub address: String,
    pub maps_url: String,
    pub operational_hours: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookingResponse {
    pub success: bool,
    pub message: String,
    pub booking_code: String,
    pub whatsapp_url: String,
    pub booking: BookingRecord,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSlotRequest {
    pub date: String,
    pub time: Option<String>, // if None, block full day
    pub reason: Option<String>,
}
