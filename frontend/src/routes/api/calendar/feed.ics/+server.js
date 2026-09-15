import { generateIcalFeed } from '$lib/calendar';
import { pool } from '$lib/server/db';
import { supabase } from '$lib/supabase';
import { env } from '$env/dynamic/public';

export async function GET() {
  try {
    let bookings = [];
    let ponOrders = [];

    const isLocalPostgres = (typeof env !== 'undefined' && env.PUBLIC_USE_LOCAL_POSTGRES === 'true')
      || (typeof process !== 'undefined' && process.env && process.env.PUBLIC_USE_LOCAL_POSTGRES === 'true');

    if (isLocalPostgres) {
      try {
        const [bRes, pRes] = await Promise.all([
          pool.query("SELECT * FROM bookings WHERE status != 'CANCELLED' ORDER BY appointment_date ASC"),
          pool.query("SELECT * FROM pon_orders WHERE status NOT IN ('SENT', 'CANCELLED') ORDER BY id ASC")
        ]);
        bookings = bRes.rows;
        ponOrders = pRes.rows;
      } catch (dbErr) {
        console.warn('Local DB error in iCal feed, trying Supabase fallback:', dbErr.message);
      }
    }

    if (bookings.length === 0 && ponOrders.length === 0) {
      // Fetch from Supabase (Production / fallback)
      const [{ data: bData }, { data: pData }] = await Promise.all([
        supabase.from('bookings').select('*').neq('status', 'CANCELLED').order('appointment_date', { ascending: true }),
        supabase.from('pon_orders').select('*').not('status', 'in', '("SENT","CANCELLED")').order('id', { ascending: true })
      ]);
      bookings = bData || [];
      ponOrders = pData || [];
    }

    const icsContent = generateIcalFeed(bookings, ponOrders);

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="petite-girl-nails-schedule.ics"',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    console.error('Error generating iCal feed:', err);
    return new Response('Error generating calendar feed', { status: 500 });
  }
}
