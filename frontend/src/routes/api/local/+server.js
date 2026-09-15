import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';

const DEFAULT_SLOTS = ["10:00", "13:00", "16:00", "19:00", "21:00"];

export async function POST({ request }) {
  try {
    const { action, payload = {} } = await request.json();

    switch (action) {
      // 1. SERVICES
      case 'getServices': {
        const { rows } = await pool.query('SELECT * FROM services ORDER BY id ASC');
        return json({ success: true, data: rows });
      }

      case 'createService': {
        const { name, category = 'Nail Art', estimated_duration_min = 60, price = 50000, description = '' } = payload;
        const { rows } = await pool.query(
          `INSERT INTO services (name, category, estimated_duration_min, price, description)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [name, category, Number(estimated_duration_min) || 60, Number(price) || 50000, description]
        );
        return json({ success: true, data: rows[0] });
      }

      case 'updateService': {
        const { id, name, category, estimated_duration_min, price, description } = payload;
        const { rows } = await pool.query(
          `UPDATE services 
           SET name = COALESCE($1, name),
               category = COALESCE($2, category),
               estimated_duration_min = COALESCE($3, estimated_duration_min),
               price = COALESCE($4, price),
               description = COALESCE($5, description)
           WHERE id = $6 RETURNING *`,
          [name, category, estimated_duration_min ? Number(estimated_duration_min) : null, price ? Number(price) : null, description, id]
        );
        return json({ success: true, data: rows[0] });
      }

      case 'deleteService': {
        const { id } = payload;
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        return json({ success: true });
      }

      // 2. AVAILABILITY
      case 'getAvailability': {
        const { monthQuery } = payload;
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth() + 1;

        if (monthQuery && monthQuery.includes('-')) {
          const parts = monthQuery.split('-');
          year = parseInt(parts[0], 10) || year;
          month = parseInt(parts[1], 10) || month;
        }

        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        const totalDays = new Date(year, month, 0).getDate();

        const [bookingsRes, blockedRes] = await Promise.all([
          pool.query(
            "SELECT appointment_date, appointment_time FROM bookings WHERE appointment_date LIKE $1 AND status != 'CANCELLED'",
            [`${monthStr}-%`]
          ),
          pool.query(
            "SELECT date, time FROM blocked_slots WHERE date LIKE $1",
            [`${monthStr}-%`]
          )
        ]);

        const bookings = bookingsRes.rows;
        const blocked = blockedRes.rows;

        const days = [];
        for (let day = 1; day <= totalDays; day++) {
          const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
          const dayBookings = bookings.filter(b => b.appointment_date === dateStr);
          const dayBlocked = blocked.filter(s => s.date === dateStr);

          const wholeDayBlocked = dayBlocked.some(s => !s.time);
          const blockedTimes = dayBlocked.filter(s => !!s.time).map(s => s.time);
          const bookedTimes = dayBookings.map(b => b.appointment_time);

          let availableSlots = 0;
          for (const t of DEFAULT_SLOTS) {
            if (!wholeDayBlocked && !blockedTimes.includes(t) && !bookedTimes.includes(t)) {
              availableSlots++;
            }
          }

          days.push({
            date: dateStr,
            day_number: day,
            total_slots: DEFAULT_SLOTS.length,
            available_slots: availableSlots,
            is_full: availableSlots === 0,
            is_closed: wholeDayBlocked || availableSlots === 0
          });
        }

        return json({ success: true, year, month, data: days });
      }

      case 'getDateSlots': {
        const { dateStr } = payload;
        const [bookingsRes, blockedRes] = await Promise.all([
          pool.query(
            "SELECT appointment_time FROM bookings WHERE appointment_date = $1 AND status != 'CANCELLED'",
            [dateStr]
          ),
          pool.query(
            "SELECT time FROM blocked_slots WHERE date = $1",
            [dateStr]
          )
        ]);

        const bookedTimes = bookingsRes.rows.map(b => b.appointment_time);
        const dayBlocked = blockedRes.rows;
        const wholeDayBlocked = dayBlocked.some(s => !s.time);
        const blockedTimes = dayBlocked.filter(s => !!s.time).map(s => s.time);

        let total_available = 0;
        const slots = DEFAULT_SLOTS.map(t => {
          let status = 'AVAILABLE';
          if (wholeDayBlocked || blockedTimes.includes(t)) {
            status = 'BLOCKED';
          } else if (bookedTimes.includes(t)) {
            status = 'BOOKED';
          } else {
            total_available++;
          }
          return { time: t, status };
        });

        const parsedDate = new Date(dateStr + 'T00:00:00');
        const formatted_date = parsedDate.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });

        return json({
          success: true,
          data: {
            date: dateStr,
            formatted_date,
            total_available,
            slots
          }
        });
      }

      // 3. BOOKINGS
      case 'createBooking': {
        // Validate slot availability
        const { appointment_date, appointment_time, name, whatsapp, services, design_inspo, notes } = payload;
        
        const existingRes = await pool.query(
          "SELECT id FROM bookings WHERE appointment_date = $1 AND appointment_time = $2 AND status != 'CANCELLED'",
          [appointment_date, appointment_time]
        );
        if (existingRes.rows.length > 0) {
          return json({
            success: false,
            error: `Slot jam ${appointment_time} pada tanggal ${appointment_date} sudah tidak tersedia.`
          });
        }

        const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        const booking_code = `PGN-${randHex}`;
        const servicesArray = Array.isArray(services) ? services : [services];

        const { rows } = await pool.query(
          `INSERT INTO bookings 
           (booking_code, name, whatsapp, services, design_inspo, appointment_date, appointment_time, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
           RETURNING *`,
          [
            booking_code,
            name.trim(),
            whatsapp.trim(),
            JSON.stringify(servicesArray),
            design_inspo || 'Kirim via WhatsApp',
            appointment_date,
            appointment_time,
            notes || null
          ]
        );

        const data = rows[0];
        const servicesText = servicesArray.join(', ');
        const waMessage = `Halo Petite Girl Nails! 💕%0A%0ASaya ingin konfirmasi booking studio:%0A• Kode: *${booking_code}*%0A• Nama: *${data.name}*%0A• Tanggal: *${data.appointment_date}*%0A• Jam: *${data.appointment_time} WIB*%0A• Layanan: *${servicesText}*%0A• Desain Inspo: *${data.design_inspo || '-'}*%0A• Catatan: *${data.notes || '-'}*%0A%0AMohon info ketersediaan & petunjuk ke studio ya kak, terima kasih! ✨💅`;
        const whatsapp_url = `https://wa.me/6285179968311?text=${waMessage}`;

        return json({
          success: true,
          data: {
            ...data,
            whatsapp_url
          }
        });
      }

      case 'getAllBookings': {
        const { rows } = await pool.query('SELECT * FROM bookings ORDER BY id DESC');
        return json({ success: true, data: rows });
      }

      case 'updateBookingStatus': {
        const { id, status } = payload;
        const { rows } = await pool.query(
          'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
          [status, id]
        );
        return json({ success: true, data: rows[0] });
      }

      // 4. PRESS ON NAILS (PON)
      case 'getPonOrders': {
        const { query = '' } = payload;
        let rows;
        if (query && query.trim()) {
          const q = `%${query.trim()}%`;
          const res = await pool.query(
            'SELECT * FROM pon_orders WHERE order_id ILIKE $1 OR customer_name ILIKE $1 ORDER BY id DESC',
            [q]
          );
          rows = res.rows;
        } else {
          const res = await pool.query('SELECT * FROM pon_orders ORDER BY id DESC');
          rows = res.rows;
        }
        return json({ success: true, data: rows });
      }

      case 'createPonOrder': {
        let order_id = payload.order_id;
        if (!order_id) {
          const randNum = Math.floor(100 + Math.random() * 900);
          order_id = `PON-${randNum}`;
        }
        const { customer_name, deadline, status = 'ANTRI', notes } = payload;
        const { rows } = await pool.query(
          `INSERT INTO pon_orders (order_id, customer_name, deadline, status, notes)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [order_id, customer_name.trim(), deadline.trim(), status, notes || null]
        );
        return json({ success: true, data: rows[0] });
      }

      case 'updatePonOrder': {
        const { id, status, deadline, notes } = payload;
        const { rows } = await pool.query(
          `UPDATE pon_orders 
           SET status = COALESCE($1, status),
               deadline = COALESCE($2, deadline),
               notes = COALESCE($3, notes)
           WHERE id = $4 RETURNING *`,
          [status || null, deadline || null, notes || null, id]
        );
        return json({ success: true, data: rows[0] });
      }

      // 5. BLOCKED SLOTS
      case 'blockSlot': {
        const { date, time, reason = 'Jadwal Libur Studio' } = payload;
        const { rows } = await pool.query(
          `INSERT INTO blocked_slots (date, time, reason)
           VALUES ($1, $2, $3) RETURNING *`,
          [date, time || null, reason]
        );
        return json({ success: true, data: rows[0] });
      }

      case 'unblockSlot': {
        const { date, time } = payload;
        if (time) {
          await pool.query('DELETE FROM blocked_slots WHERE date = $1 AND time = $2', [date, time]);
        } else {
          await pool.query('DELETE FROM blocked_slots WHERE date = $1', [date]);
        }
        return json({ success: true });
      }

      default:
        return json({ success: false, error: `Action ${action} tidak dikenal` }, { status: 400 });
    }
  } catch (err) {
    console.error('API Local PostgreSQL error:', err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
