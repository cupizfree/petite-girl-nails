use std::fs;
use std::path::Path;
use chrono::{Datelike, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::{
    BookingRecord, BookingRequest, DayAvailability, DateSlotResponse,
    PonOrder, CreatePonRequest, UpdatePonRequest, ServiceItem, SlotDetail, StudioInfo, SlotOverride,
    CreateServiceRequest, UpdateServiceRequest
};

pub const DEFAULT_SLOTS: &[&str] = &["10:00", "13:00", "16:00", "19:00", "21:00"];
const DB_FILE: &str = "petite_nails_data.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseData {
    pub bookings: Vec<BookingRecord>,
    pub slot_overrides: Vec<SlotOverride>,
    pub pon_orders: Vec<PonOrder>,
    pub services: Vec<ServiceItem>,
}

impl DatabaseData {
    pub fn save(&self) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(DB_FILE, json).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load_or_init() -> Self {
        if Path::new(DB_FILE).exists() {
            if let Ok(content) = fs::read_to_string(DB_FILE) {
                if let Ok(data) = serde_json::from_str::<DatabaseData>(&content) {
                    return data;
                }
            }
        }

        let default_services = vec![
            ServiceItem {
                id: 1,
                name: "Nail art di kuku asli".to_string(),
                category: "Nail Art".to_string(),
                estimated_duration_min: 90,
                price: 75000,
                description: "Manicure lengkap, buffing, kutek gel base & motif nail art manis pada kuku asli.".to_string(),
            },
            ServiceItem {
                id: 2,
                name: "Tambah extension".to_string(),
                category: "Extension".to_string(),
                estimated_duration_min: 60,
                price: 50000,
                description: "Tambahan perpanjangan kuku (soft gel tip / polygel) yang kuat dan natural.".to_string(),
            },
            ServiceItem {
                id: 3,
                name: "Remove ext".to_string(),
                category: "Removal".to_string(),
                estimated_duration_min: 45,
                price: 30000,
                description: "Pelepasan extension kuku lama dengan aman tanpa merusak kuku asli.".to_string(),
            },
            ServiceItem {
                id: 4,
                name: "Remove nail gel".to_string(),
                category: "Removal".to_string(),
                estimated_duration_min: 30,
                price: 20000,
                description: "Pembersihan dan pelepasan kutek gel lama menggunakan soaking lembut.".to_string(),
            },
            ServiceItem {
                id: 5,
                name: "Pasang press on nails".to_string(),
                category: "Press On".to_string(),
                estimated_duration_min: 40,
                price: 25000,
                description: "Pemasangan kuku palsu (PON) custom dengan lem khusus yang tahan lama dan rapi.".to_string(),
            },
        ];

        let now = Local::now().to_rfc3339();
        let initial_pons = vec![
            PonOrder { id: 1, order_id: "PON-001".into(), customer_name: "Bestie Sasa".into(), deadline: "10 September 2026".into(), status: "READY_TO_PICK_UP".into(), notes: Some("Almond shape, pastel floral".into()), created_at: now.clone() },
            PonOrder { id: 2, order_id: "PON-002".into(), customer_name: "Bestie Bella".into(), deadline: "20 September 2026".into(), status: "ANTRI".into(), notes: Some("Short coffin, chrome French".into()), created_at: now.clone() },
            PonOrder { id: 3, order_id: "PON-003".into(), customer_name: "Bestie Cindy".into(), deadline: "15 September 2026".into(), status: "PROGRESS".into(), notes: Some("Custom 3D charms ribbon".into()), created_at: now.clone() },
            PonOrder { id: 4, order_id: "PON-004".into(), customer_name: "Bestie Dinda".into(), deadline: "15 September 2026".into(), status: "ANTRI".into(), notes: Some("Square oval, jelly blush pink".into()), created_at: now.clone() },
            PonOrder { id: 5, order_id: "PON-005".into(), customer_name: "Bestie Eka".into(), deadline: "18 September 2026".into(), status: "ANTRI".into(), notes: Some("Cat eye magnetic lavender".into()), created_at: now.clone() },
            PonOrder { id: 6, order_id: "PON-006".into(), customer_name: "Bestie Fani".into(), deadline: "16 September 2026".into(), status: "ANTRI".into(), notes: Some("Cozy autumn earth tone".into()), created_at: now.clone() },
            PonOrder { id: 7, order_id: "PON-007".into(), customer_name: "Bestie Gita".into(), deadline: "16 September 2026".into(), status: "ANTRI".into(), notes: Some("Minimalist white pearls".into()), created_at: now.clone() },
            PonOrder { id: 8, order_id: "PON-008".into(), customer_name: "Bestie Hani".into(), deadline: "09 September 2026".into(), status: "SENT".into(), notes: Some("Resi JNE: JNE88291039".into()), created_at: now.clone() },
            PonOrder { id: 9, order_id: "PON-009".into(), customer_name: "Bestie Intan".into(), deadline: "09 September 2026".into(), status: "SENT".into(), notes: Some("Resi J&T: JNT99120482".into()), created_at: now.clone() },
            PonOrder { id: 10, order_id: "PON-010".into(), customer_name: "Bestie Jessica".into(), deadline: "10 September 2026".into(), status: "SENT".into(), notes: Some("Ambil di studio Sewon".into()), created_at: now.clone() },
            PonOrder { id: 11, order_id: "PON-011".into(), customer_name: "Bestie Karina".into(), deadline: "11 September 2026".into(), status: "SENT".into(), notes: Some("Resi SiCepat: 0041289912".into()), created_at: now.clone() },
            PonOrder { id: 12, order_id: "PON-012".into(), customer_name: "Bestie Laura".into(), deadline: "15 September 2026".into(), status: "READY_TO_PICK_UP".into(), notes: Some("Bisa diambil jam 10.00-19.00".into()), created_at: now.clone() },
            PonOrder { id: 13, order_id: "PON-013".into(), customer_name: "Bestie Maya".into(), deadline: "11 September 2026".into(), status: "SENT".into(), notes: Some("Resi J&T: JNT10293812".into()), created_at: now.clone() },
            PonOrder { id: 14, order_id: "PON-014".into(), customer_name: "Bestie Nadya".into(), deadline: "12 September 2026".into(), status: "SENT".into(), notes: Some("Resi JNE: JNE77381902".into()), created_at: now.clone() },
        ];

        let db = DatabaseData {
            bookings: Vec::new(),
            slot_overrides: Vec::new(),
            pon_orders: initial_pons,
            services: default_services,
        };
        let _ = db.save();
        db
    }
}

pub fn get_studio_info() -> StudioInfo {
    StudioInfo {
        name: "Petite Girl Nails".to_string(),
        tagline: "Silahkan diisi ya bestiee ✨".to_string(),
        est: "EST. 2025".to_string(),
        whatsapp: "6285179968311".to_string(),
        address: "Jl. Gabusan No.120, RT.08, Gabusan, Timbulharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188".to_string(),
        maps_url: "https://maps.app.goo.gl/Z18udNHLahhP1ehv5".to_string(),
        operational_hours: "Setiap Hari: 10.00 - 22.00 WIB".to_string(),
    }
}

pub fn get_services(data: &DatabaseData) -> Vec<ServiceItem> {
    data.services.clone()
}

pub fn get_slots_for_date(data: &DatabaseData, date_str: &str) -> DateSlotResponse {
    let whole_day_blocked = data.slot_overrides.iter().any(|s| s.date == date_str && s.time.is_none());

    let booked_times: Vec<String> = data.bookings.iter()
        .filter(|b| b.appointment_date == date_str && b.status != "CANCELLED")
        .map(|b| b.appointment_time.clone())
        .collect();

    let blocked_times: Vec<String> = data.slot_overrides.iter()
        .filter(|s| s.date == date_str && s.time.is_some())
        .filter_map(|s| s.time.clone())
        .collect();

    let mut slots = Vec::new();
    let mut total_available = 0;

    for &t in DEFAULT_SLOTS {
        let status = if whole_day_blocked || blocked_times.contains(&t.to_string()) {
            "BLOCKED"
        } else if booked_times.contains(&t.to_string()) {
            "BOOKED"
        } else {
            total_available += 1;
            "AVAILABLE"
        };

        slots.push(SlotDetail {
            time: t.to_string(),
            status: status.to_string(),
        });
    }

    let parsed_date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .unwrap_or_else(|_| Local::now().date_naive());
    let formatted_date = parsed_date.format("%A, %d %B %Y").to_string();

    DateSlotResponse {
        date: date_str.to_string(),
        formatted_date,
        total_available,
        slots,
    }
}

pub fn get_month_availability(data: &DatabaseData, year: i32, month: u32) -> Vec<DayAvailability> {
    let first_day = NaiveDate::from_ymd_opt(year, month, 1).unwrap_or_else(|| Local::now().date_naive());
    let next_month = if month == 12 { 1 } else { month + 1 };
    let next_month_year = if month == 12 { year + 1 } else { year };
    let last_day = NaiveDate::from_ymd_opt(next_month_year, next_month, 1)
        .unwrap_or(first_day)
        .pred_opt()
        .unwrap_or(first_day);

    let total_days = last_day.day();
    let mut res = Vec::new();

    for day in 1..=total_days {
        let cur_date = NaiveDate::from_ymd_opt(year, month, day).unwrap();
        let date_str = cur_date.format("%Y-%m-%d").to_string();

        let slots_resp = get_slots_for_date(data, &date_str);
        let total_slots = slots_resp.slots.len();
        let available_slots = slots_resp.total_available;
        let is_full = available_slots == 0;
        let is_closed = slots_resp.slots.iter().all(|s| s.status == "BLOCKED");

        res.push(DayAvailability {
            date: date_str,
            day_number: day,
            total_slots,
            available_slots,
            is_full,
            is_closed,
        });
    }

    res
}

pub fn create_booking(data: &mut DatabaseData, req: BookingRequest) -> Result<(BookingRecord, String), String> {
    // Validate slot availability
    let slots_resp = get_slots_for_date(data, &req.appointment_date);
    if let Some(s) = slots_resp.slots.iter().find(|s| s.time == req.appointment_time) {
        if s.status != "AVAILABLE" {
            return Err(format!("Slot {} pada tanggal {} sudah tidak tersedia", req.appointment_time, req.appointment_date));
        }
    }

    let short_id = Uuid::new_v4().to_string()[..6].to_uppercase();
    let booking_code = format!("PGN-{}", short_id);
    let now = Local::now().to_rfc3339();
    let next_id = (data.bookings.len() as i64) + 1;
    let design_inspo = req.design_inspo.clone().unwrap_or_else(|| "Kirim via WhatsApp".to_string());

    let record = BookingRecord {
        id: next_id,
        booking_code: booking_code.clone(),
        name: req.name.clone(),
        whatsapp: req.whatsapp.clone(),
        services: req.services.clone(),
        design_inspo: design_inspo.clone(),
        appointment_date: req.appointment_date.clone(),
        appointment_time: req.appointment_time.clone(),
        notes: req.notes.clone(),
        status: "PENDING".to_string(),
        created_at: now,
    };

    data.bookings.push(record.clone());
    data.save()?;

    // Construct formatted WhatsApp message
    let services_joined = req.services.join(", ");
    let wa_text = format!(
        "Halo Petite Girl Nails! 💅✨\n\nSaya ingin konfirmasi booking janji temu:\n• Kode Booking: *{}*\n• Nama: *{}*\n• WhatsApp: *{}*\n• Layanan: *{}*\n• Desain Inspo: *{}*\n• Tanggal: *{}*\n• Jam: *{}*\n• Catatan: {}\n\nMohon konfirmasi ya kak, terima kasih banyak! 💕",
        booking_code,
        req.name,
        req.whatsapp,
        services_joined,
        design_inspo,
        req.appointment_date,
        req.appointment_time,
        req.notes.unwrap_or_else(|| "-".to_string())
    );

    let wa_url = format!(
        "https://wa.me/6285179968311?text={}",
        urlencoding::encode(&wa_text)
    );

    Ok((record, wa_url))
}

pub fn get_all_bookings(data: &DatabaseData) -> Vec<BookingRecord> {
    let mut list = data.bookings.clone();
    list.sort_by(|a, b| b.appointment_date.cmp(&a.appointment_date));
    list
}

pub fn update_booking_status(data: &mut DatabaseData, id: i64, new_status: &str) -> Result<(), String> {
    if let Some(b) = data.bookings.iter_mut().find(|b| b.id == id) {
        b.status = new_status.to_string();
        data.save()?;
        Ok(())
    } else {
        Err("Booking ID tidak ditemukan".to_string())
    }
}

pub fn get_all_pon_orders(data: &DatabaseData, query: Option<&str>) -> Vec<PonOrder> {
    let mut list = data.pon_orders.clone();
    if let Some(q) = query {
        if !q.trim().is_empty() {
            let term = q.trim().to_lowercase();
            list.retain(|p| p.order_id.to_lowercase().contains(&term) || p.customer_name.to_lowercase().contains(&term));
        }
    }
    list
}

pub fn create_pon_order(data: &mut DatabaseData, req: CreatePonRequest) -> Result<PonOrder, String> {
    let order_id = match req.order_id {
        Some(oid) if !oid.trim().is_empty() => oid,
        _ => {
            let count = data.pon_orders.len() + 1;
            format!("PON-{:03}", count)
        }
    };

    let next_id = (data.pon_orders.len() as i64) + 1;
    let status = req.status.unwrap_or_else(|| "ANTRI".to_string());
    let now = Local::now().to_rfc3339();

    let order = PonOrder {
        id: next_id,
        order_id,
        customer_name: req.customer_name,
        deadline: req.deadline,
        status,
        notes: req.notes,
        created_at: now,
    };

    data.pon_orders.insert(0, order.clone());
    data.save()?;
    Ok(order)
}

pub fn update_pon_order(data: &mut DatabaseData, id: i64, req: UpdatePonRequest) -> Result<(), String> {
    if let Some(p) = data.pon_orders.iter_mut().find(|p| p.id == id) {
        if let Some(s) = req.status {
            p.status = s;
        }
        if let Some(d) = req.deadline {
            p.deadline = d;
        }
        if let Some(n) = req.notes {
            p.notes = Some(n);
        }
        data.save()?;
        Ok(())
    } else {
        Err("Pesanan PON tidak ditemukan".to_string())
    }
}

pub fn block_slot(data: &mut DatabaseData, date: &str, time: Option<&str>, reason: Option<&str>) -> Result<(), String> {
    data.slot_overrides.push(SlotOverride {
        date: date.to_string(),
        time: time.map(|t| t.to_string()),
        reason: reason.map(|r| r.to_string()),
    });
    data.save()?;
    Ok(())
}

pub fn unblock_slot(data: &mut DatabaseData, date: &str, time: Option<&str>) -> Result<(), String> {
    data.slot_overrides.retain(|s| {
        if s.date != date {
            return true;
        }
        if let Some(t) = time {
            s.time.as_deref() != Some(t)
        } else {
            false
        }
    });
    data.save()?;
    Ok(())
}

pub fn create_service(data: &mut DatabaseData, req: CreateServiceRequest) -> Result<ServiceItem, String> {
    let next_id = data.services.iter().map(|s| s.id).max().unwrap_or(0) + 1;
    let item = ServiceItem {
        id: next_id,
        name: req.name,
        category: req.category.unwrap_or_else(|| "Nail Treatment".to_string()),
        estimated_duration_min: req.estimated_duration_min,
        price: req.price,
        description: req.description,
    };
    data.services.push(item.clone());
    data.save()?;
    Ok(item)
}

pub fn update_service(data: &mut DatabaseData, id: i64, req: UpdateServiceRequest) -> Result<ServiceItem, String> {
    if let Some(s) = data.services.iter_mut().find(|s| s.id == id) {
        if let Some(name) = req.name { s.name = name; }
        if let Some(category) = req.category { s.category = category; }
        if let Some(dur) = req.estimated_duration_min { s.estimated_duration_min = dur; }
        if let Some(price) = req.price { s.price = price; }
        if let Some(desc) = req.description { s.description = desc; }
        let updated = s.clone();
        data.save()?;
        Ok(updated)
    } else {
        Err("Layanan tidak ditemukan".to_string())
    }
}

pub fn delete_service(data: &mut DatabaseData, id: i64) -> Result<(), String> {
    let initial_len = data.services.len();
    data.services.retain(|s| s.id != id);
    if data.services.len() < initial_len {
        data.save()?;
        Ok(())
    } else {
        Err("Layanan tidak ditemukan".to_string())
    }
}

