import { json } from '@sveltejs/kit';
import {
  getGoogleAuthClient,
  getCalendarId,
  syncBookingToGoogleCalendar,
  syncPonToGoogleCalendar,
  deleteGoogleCalendarEvent
} from '$lib/server/googleCalendar.js';
import { getPool } from '$lib/server/db.js';

/**
 * GET: Test Google Calendar connection and list accessible calendars
 */
export async function GET() {
  try {
    const client = getGoogleAuthClient();
    const token = await client.getAccessToken();

    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${token.token}` }
    });
    const data = await res.json();

    const configuredCalendarId = getCalendarId();

    return json({
      success: true,
      serviceAccount: client.email,
      configuredCalendarId,
      calendarsFound: data.items || [],
      instructions: data.items?.length === 0
        ? `Kalender belum dibagikan ke ${client.email}. Silakan buka Google Calendar -> Settings -> Share with specific people -> masukkan ${client.email} dengan izin "Make changes to events".`
        : 'Google Calendar API terhubung dan siap digunakan!'
    });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

/**
 * POST: Sync a booking or PON deadline to Google Calendar
 */
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { type, booking, order, calendarId } = body;

    const targetCalId = calendarId || getCalendarId();

    if (type === 'booking' && booking) {
      const result = await syncBookingToGoogleCalendar(booking, targetCalId);

      // Update database if id exists
      if (booking.id && result.eventId) {
        try {
          const pool = getPool();
          await pool.query(
            'UPDATE bookings SET calendar_event_id = $1 WHERE id = $2',
            [result.eventId, booking.id]
          );
        } catch (dbErr) {
          console.warn('Could not save calendar_event_id to local DB:', dbErr.message);
        }
      }

      return json({ success: true, ...result });
    }

    if (type === 'pon' && order) {
      const result = await syncPonToGoogleCalendar(order, targetCalId);

      // Update database if id exists
      if (order.id && result.eventId) {
        try {
          const pool = getPool();
          await pool.query(
            'UPDATE pon_orders SET calendar_event_id = $1 WHERE id = $2',
            [result.eventId, order.id]
          );
        } catch (dbErr) {
          console.warn('Could not save calendar_event_id to local DB:', dbErr.message);
        }
      }

      return json({ success: true, ...result });
    }

    return json({ success: false, error: 'Tipe sync tidak valid atau data kosong' }, { status: 400 });
  } catch (err) {
    console.error('API /calendar/sync error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
