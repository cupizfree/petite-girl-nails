import { JWT } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import fs from 'fs';
import path from 'path';

const STUDIO_ADDRESS = "Petite Girl Nails, Jl. Gabusan No.120, RT.08, Gabusan, Timbulharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188";
const MAPS_URL = "https://maps.app.goo.gl/Z18udNHLahhP1ehv5";

/**
 * Load Google Service Account credentials from .env string or google-key.json
 */
function getCredentials() {
  try {
    if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
    }
    const keyPath = path.resolve('google-key.json');
    if (fs.existsSync(keyPath)) {
      const content = fs.readFileSync(keyPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('getCredentials error:', err);
  }
  return null;
}

/**
 * Get target Google Calendar ID (from env or fallback)
 */
export function getCalendarId() {
  return env.GOOGLE_CALENDAR_ID || 'primary';
}

/**
 * Get authorized JWT client
 */
export function getGoogleAuthClient() {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('Google Service Account credentials not found (google-key.json or GOOGLE_SERVICE_ACCOUNT_KEY missing)');
  }

  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });
}

/**
 * Format local Date to RFC3339 string with +07:00 timezone offset (Asia/Jakarta)
 */
function toRfc3339Jakarta(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day}T${h}:${min}:${s}+07:00`;
}

/**
 * Parse date and time into local Date object (WIB)
 */
function parseBookingDateTime(dateStr, timeStr) {
  try {
    if (!dateStr) return new Date();

    let year = 2026, month = 1, day = 1;
    const cleanDate = String(dateStr).trim();

    if (cleanDate.includes('T')) {
      const datePart = cleanDate.split('T')[0];
      const parts = datePart.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/').map(Number);
      day = parts[0];
      month = parts[1];
      year = parts[2];
    } else if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-').map(Number);
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

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

    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch (e) {
    return new Date();
  }
}

/**
 * Parse PON deadline into local Date object (WIB)
 */
function parseDeadlineDate(deadlineStr) {
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
 * Insert event to Google Calendar API v3
 */
export async function createGoogleCalendarEvent(calendarId, eventBody) {
  const client = getGoogleAuthClient();
  const token = await client.getAccessToken();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('createGoogleCalendarEvent failed:', data);
    throw new Error(data.error?.message || 'Failed to create Google Calendar event');
  }

  return data;
}

/**
 * Delete event from Google Calendar API v3
 */
export async function deleteGoogleCalendarEvent(calendarId, eventId) {
  if (!eventId) return;
  try {
    const client = getGoogleAuthClient();
    const token = await client.getAccessToken();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.token}`
      }
    });
  } catch (err) {
    console.error('deleteGoogleCalendarEvent error:', err);
  }
}

/**
 * Sync a studio booking to Google Calendar with exact hour + reminders
 */
export async function syncBookingToGoogleCalendar(booking, calendarId = getCalendarId()) {
  const startDate = parseBookingDateTime(booking.appointment_date, booking.appointment_time);
  const endDate = new Date(startDate.getTime() + 90 * 60 * 1000); // 90 min duration

  const servicesList = Array.isArray(booking.services) 
    ? booking.services.join(', ') 
    : (booking.services || '-');
  const cleanWa = (booking.whatsapp || '').replace(/\D/g, '');

  const eventBody = {
    summary: `💅 Nail Art: ${booking.name || 'Customer'} (${booking.booking_code || 'PGN'})`,
    location: STUDIO_ADDRESS,
    description: `💅 RESERVASI STUDIO PETITE GIRL NAILS\n` +
      `• Kode Booking: ${booking.booking_code || '-'}\n` +
      `• Pelanggan: ${booking.name}\n` +
      `• WhatsApp: ${booking.whatsapp} (https://wa.me/${cleanWa})\n` +
      `• Layanan: ${servicesList}\n` +
      `• Inspo Desain: ${booking.design_inspo || '-'}\n` +
      `• Catatan Khusus: ${booking.notes || '-'}\n` +
      `• Status: ${booking.status || 'CONFIRMED'}\n\n` +
      `📍 Lokasi: ${STUDIO_ADDRESS}\n` +
      `🗺️ Google Maps: ${MAPS_URL}\n\n` +
      `⏰ REMINDER: Siapkan meja & alat steril 15 menit sebelum customer tiba! 💕`,
    start: {
      dateTime: toRfc3339Jakarta(startDate),
      timeZone: 'Asia/Jakarta'
    },
    end: {
      dateTime: toRfc3339Jakarta(endDate),
      timeZone: 'Asia/Jakarta'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 120 }, // H-2 jam
        { method: 'popup', minutes: 30 }   // H-30 menit
      ]
    }
  };

  const created = await createGoogleCalendarEvent(calendarId, eventBody);
  return {
    success: true,
    eventId: created.id,
    htmlLink: created.htmlLink
  };
}

/**
 * Sync a PON deadline to Google Calendar with exact deadline hour + alerts
 */
export async function syncPonToGoogleCalendar(order, calendarId = getCalendarId()) {
  const deadlineDate = parseDeadlineDate(order.deadline);
  deadlineDate.setHours(17, 0, 0, 0); // Jam 17:00 WIB
  const endDate = new Date(deadlineDate.getTime() + 60 * 60 * 1000); // 1 jam blok

  const eventBody = {
    summary: `📦 DEADLINE PON: ${order.order_id} - ${order.customer_name}`,
    description: `📦 TARGET DEADLINE PRESS ON NAILS (PON)\n` +
      `• Order ID: ${order.order_id}\n` +
      `• Nama Customer: ${order.customer_name}\n` +
      `• Deadline: ${order.deadline}\n` +
      `• Status: ${order.status}\n` +
      `• Catatan / Ukuran: ${order.notes || '-'}\n\n` +
      `⚠️ PERINGATAN DEADLINE MEPET!\n` +
      `Pastikan kuku custom sudah selesai di-finishing, top gel, dan dipacking rapi! ✨`,
    start: {
      dateTime: toRfc3339Jakarta(deadlineDate),
      timeZone: 'Asia/Jakarta'
    },
    end: {
      dateTime: toRfc3339Jakarta(endDate),
      timeZone: 'Asia/Jakarta'
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // H-1 hari (1440 menit)
        { method: 'popup', minutes: 240 }   // H-4 jam (240 menit)
      ]
    }
  };

  const created = await createGoogleCalendarEvent(calendarId, eventBody);
  return {
    success: true,
    eventId: created.id,
    htmlLink: created.htmlLink
  };
}
