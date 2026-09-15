/**
 * Utility to generate Google Calendar URLs and RFC 5545 iCalendar (.ics) feeds
 * with automatic alarms and notifications for Petite Girl Nails studio & PON deadlines.
 */

const STUDIO_ADDRESS = "Petite Girl Nails, Jl. Gabusan No.120, RT.08, Gabusan, Timbulharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188";
const MAPS_URL = "https://maps.app.goo.gl/Z18udNHLahhP1ehv5";

/**
 * Format a Date object to Google Calendar UTC string (YYYYMMDDTHHmmssZ)
 */
function formatGCalUtc(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Format a Date object to YYYYMMDD for all-day events
 */
function formatGCalDateOnly(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/**
 * Parse date & time into Date object
 * Handles appointment_date (YYYY-MM-DD) and appointment_time ("10:00" or "10.00")
 */
/**
 * Parse date & time into Date object with timezone awareness for WIB (UTC+7)
 * Handles:
 * - dateStr: "2026-09-18", "2026-09-18T00:00:00.000Z", "18/09/2026", "18-09-2026"
 * - timeStr: "13", "13:00", "13.00", "13:00 WIB", "13.00 WIB"
 */
export function parseBookingDateTime(dateStr, timeStr) {
  try {
    if (!dateStr) return new Date();

    // 1. Parse Date
    let year = 2026, month = 1, day = 1;
    const cleanDate = String(dateStr).trim();

    if (cleanDate.includes('T')) {
      // ISO format e.g. "2026-09-18T00:00:00.000Z"
      const datePart = cleanDate.split('T')[0];
      const parts = datePart.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else if (cleanDate.includes('/')) {
      // Format DD/MM/YYYY
      const parts = cleanDate.split('/').map(Number);
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else if (cleanDate.includes('-')) {
      // Format YYYY-MM-DD
      const parts = cleanDate.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

    // 2. Parse Time
    let hours = 10;
    let minutes = 0;
    if (timeStr) {
      const cleanTime = String(timeStr).replace(/wib/i, '').trim();
      const match = cleanTime.match(/(\d{1,2})(?:[:.](\d{1,2}))?/);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = match[2] ? parseInt(match[2], 10) : 0;
      }
    }

    // Return Date object in local environment (WIB)
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch (e) {
    return new Date();
  }
}

/**
 * Format local Date components to YYYYMMDDTHHmmss for Google Calendar template with &ctz=Asia/Jakarta
 */
function formatGCalLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * Parse PON deadline into Date object
 * Handles formats like "2026-09-20", "20 September 2026", "20/09/2026", or ISO
 */
export function parseDeadlineDate(deadlineStr) {
  try {
    if (!deadlineStr) return new Date();
    const clean = String(deadlineStr).trim();

    if (clean.includes('T')) {
      const [y, m, d] = clean.split('T')[0].split('-').map(Number);
      return new Date(y, m - 1, d, 17, 0, 0);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-').map(Number);
      return new Date(y, m - 1, d, 17, 0, 0);
    }
    if (clean.includes('/')) {
      const [d, m, y] = clean.split('/').map(Number);
      return new Date(y, m - 1, d, 17, 0, 0);
    }

    const months = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
      juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    };
    const parts = clean.toLowerCase().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1];
      const year = parseInt(parts[2], 10);
      if (day && monthName in months && year) {
        return new Date(year, months[monthName], day, 17, 0, 0);
      }
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) {
    return new Date();
  }
}

/**
 * Generates 1-Click Google Calendar URL for Studio Booking with exact hour set in Asia/Jakarta
 */
export function getStudioCalendarUrl(booking) {
  const startDate = parseBookingDateTime(booking.appointment_date, booking.appointment_time);
  // Default duration 90 minutes (1.5 jam slot manicure + nail art)
  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);

  const title = `💅 Nail Art: ${booking.name || 'Customer'} (${booking.booking_code || 'PGN'})`;
  const cleanWa = (booking.whatsapp || '').replace(/\D/g, '');
  const servicesList = Array.isArray(booking.services) 
    ? booking.services.join(', ') 
    : (booking.services || '-');

  const details = `💅 RESERVASI STUDIO PETITE GIRL NAILS\n` +
    `• Kode Booking: ${booking.booking_code || '-'}\n` +
    `• Pelanggan: ${booking.name}\n` +
    `• WhatsApp: ${booking.whatsapp} (https://wa.me/${cleanWa})\n` +
    `• Layanan: ${servicesList}\n` +
    `• Inspo Desain: ${booking.design_inspo || '-'}\n` +
    `• Catatan Khusus: ${booking.notes || '-'}\n` +
    `• Status: ${booking.status || 'CONFIRMED'}\n\n` +
    `📍 Lokasi: ${STUDIO_ADDRESS}\n` +
    `🗺️ Google Maps: ${MAPS_URL}\n\n` +
    `⏰ REMINDER STUDIO: Pastikan peralatan steril & meja kerja siap 15 menit sebelum customer tiba! 💕`;

  // Explicitly lock to Asia/Jakarta (WIB) so the hour is 100% accurate on all devices!
  const dates = `${formatGCalLocal(startDate)}/${formatGCalLocal(endDate)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&ctz=Asia/Jakarta&details=${encodeURIComponent(details)}&location=${encodeURIComponent(STUDIO_ADDRESS)}`;
}

/**
 * Generates 1-Click Google Calendar URL for Press On Nails (PON) Deadline
 */
export function getPonCalendarUrl(order) {
  const deadlineDate = parseDeadlineDate(order.deadline);
  // Target deadline event jam 17:00 WIB (akhir jam operasional studio)
  const startDate = new Date(deadlineDate);
  startDate.setHours(17, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 jam blok

  const title = `📦 DEADLINE PON: ${order.order_id} - ${order.customer_name}`;
  const details = `📦 TARGET DEADLINE PRESS ON NAILS (PON)\n` +
    `• Order ID: ${order.order_id}\n` +
    `• Nama Customer: ${order.customer_name}\n` +
    `• Deadline: ${order.deadline}\n` +
    `• Status Pengerjaan: ${order.status}\n` +
    `• Catatan / Spesifikasi: ${order.notes || '-'}\n\n` +
    `⚠️ PERINGATAN DEADLINE MEPET!\n` +
    `Pastikan kuku palsu custom ini sudah selesai di-finishing, diberi top gel, dan dipacking rapi untuk diambil/dikirim! ✨`;

  const dates = `${formatGCalLocal(startDate)}/${formatGCalLocal(endDate)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&ctz=Asia/Jakarta&details=${encodeURIComponent(details)}`;
}

/**
 * Generates RFC 5545 iCalendar content (.ics) with embedded VALARM notifications
 */
export function generateIcalFeed(bookings = [], ponOrders = []) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Petite Girl Nails//Studio & PON Schedule//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:💅 Petite Girl Nails — Studio & PON',
    'X-WR-TIMEZONE:Asia/Jakarta',
    'X-WR-CALDESC:Jadwal Janji Temu Studio dan Deadline Press On Nails Petite Girl Nails Sewon Bantul'
  ];

  const now = new Date();
  const dtstamp = formatGCalUtc(now);

  // 1. Studio Bookings
  for (const b of bookings) {
    if (b.status === 'CANCELLED') continue;

    const start = parseBookingDateTime(b.appointment_date, b.appointment_time);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const uid = `pgn-booking-${b.id || b.booking_code}@petitegirlnails.com`;
    const summary = `💅 Nail Art: ${b.name} (${b.booking_code})`;
    const servicesText = Array.isArray(b.services) ? b.services.join(', ') : (b.services || '-');
    const desc = `Booking Code: ${b.booking_code}\\nNama: ${b.name}\\nWA: ${b.whatsapp}\\nLayanan: ${servicesText}\\nInspo: ${b.design_inspo || '-'}\\nCatatan: ${b.notes || '-'}\\nStatus: ${b.status}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatGCalUtc(start)}`,
      `DTEND:${formatGCalUtc(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${STUDIO_ADDRESS}`,
      'STATUS:CONFIRMED',
      // Alarm 1: 2 jam sebelum kedatangan customer
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Pengingat: 2 Jam Lagi Customer Datang ke Studio',
      'TRIGGER:-PT2H',
      'END:VALARM',
      // Alarm 2: 30 menit sebelum kedatangan customer
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Customer Tiba dalam 30 Menit!',
      'TRIGGER:-PT30M',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  // 2. PON Orders Deadlines
  for (const p of ponOrders) {
    if (p.status === 'SENT' || p.status === 'CANCELLED') continue;

    const deadline = parseDeadlineDate(p.deadline);
    const start = new Date(deadline);
    start.setHours(17, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const uid = `pgn-pon-${p.id || p.order_id}@petitegirlnails.com`;
    const summary = `📦 DEADLINE PON: ${p.order_id} - ${p.customer_name}`;
    const desc = `Order ID: ${p.order_id}\\nCustomer: ${p.customer_name}\\nDeadline: ${p.deadline}\\nStatus: ${p.status}\\nCatatan: ${p.notes || '-'}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatGCalUtc(start)}`,
      `DTEND:${formatGCalUtc(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      'STATUS:CONFIRMED',
      // Alarm 1: H-1 sebelum deadline pengerjaan kuku palsu (mepet!)
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:⚠️ DEDLEN MEPET! H-1 Deadline PON ${p.order_id} (${p.customer_name})`,
      'TRIGGER:-P1D',
      'END:VALARM',
      // Alarm 2: H-4 jam sebelum jam target 17:00
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:⚠️ Hari ini deadline PON ${p.order_id}! Siapkan packing kuku!`,
      'TRIGGER:-PT4H',
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
