import { supabase } from './supabase';
import { env } from '$env/dynamic/public';

const DEFAULT_SLOTS = ["10:00", "13:00", "16:00", "19:00", "21:00"];

// Deteksi apakah menggunakan PostgreSQL lokal (berdasarkan environment variable)
const isLocalPostgres = (typeof env !== 'undefined' && env.PUBLIC_USE_LOCAL_POSTGRES === 'true')
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USE_LOCAL_POSTGRES === 'true');

async function callLocalApi(action, payload = {}) {
  try {
    const res = await fetch('/api/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`callLocalApi [${action}] error:`, err);
    return { success: false, error: err.message || 'Gagal menghubungi database lokal PostgreSQL' };
  }
}

export const api = {
  // 1. Studio Information
  getStudio: async () => {
    return {
      success: true,
      data: {
        name: "Petite Girl Nails",
        tagline: "Silahkan diisi ya bestiee ✨",
        est: "EST. 2025",
        whatsapp: "6285179968311",
        address: "Jl. Gabusan No.120, RT.08, Gabusan, Timbulharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188",
        maps_url: "https://maps.app.goo.gl/Z18udNHLahhP1ehv5",
        operational_hours: "Setiap Hari: 10.00 - 22.00 WIB"
      }
    };
  },

  // 2. Services (Menu Layanan & Harga)
  getServices: async () => {
    if (isLocalPostgres) {
      return await callLocalApi('getServices');
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('getServices error:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  createService: async (payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('createService', payload);
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: payload.name,
          category: payload.category || 'Nail Art',
          estimated_duration_min: Number(payload.estimated_duration_min) || 60,
          price: Number(payload.price) || 50000,
          description: payload.description || ''
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateService: async (id, payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('updateService', { id, ...payload });
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: payload.name,
          category: payload.category,
          estimated_duration_min: Number(payload.estimated_duration_min),
          price: Number(payload.price),
          description: payload.description
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteService: async (id) => {
    if (isLocalPostgres) {
      return await callLocalApi('deleteService', { id });
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 3. Availability Calendar & Slots
  getAvailability: async (monthQuery) => {
    if (isLocalPostgres) {
      return await callLocalApi('getAvailability', { monthQuery });
    }

    try {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1; // 1-12

      if (monthQuery && monthQuery.includes('-')) {
        const parts = monthQuery.split('-');
        year = parseInt(parts[0], 10) || year;
        month = parseInt(parts[1], 10) || month;
      }

      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const totalDays = new Date(year, month, 0).getDate();

      // Fetch bookings & blocked slots for this month
      const [{ data: bData }, { data: sData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('appointment_date, appointment_time')
          .like('appointment_date', `${monthStr}-%`)
          .neq('status', 'CANCELLED'),
        supabase
          .from('blocked_slots')
          .select('date, time')
          .like('date', `${monthStr}-%`)
      ]);

      const bookings = bData || [];
      const blocked = sData || [];

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

      return { success: true, year, month, data: days };
    } catch (err) {
      console.error('getAvailability error:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  getDateSlots: async (dateStr) => {
    if (isLocalPostgres) {
      return await callLocalApi('getDateSlots', { dateStr });
    }

    try {
      const [{ data: bData }, { data: sData }] = await Promise.all([
        supabase
          .from('bookings')
          .select('appointment_time')
          .eq('appointment_date', dateStr)
          .neq('status', 'CANCELLED'),
        supabase
          .from('blocked_slots')
          .select('time')
          .eq('date', dateStr)
      ]);

      const bookedTimes = (bData || []).map(b => b.appointment_time);
      const dayBlocked = sData || [];
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
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const formatted_date = parsedDate.toLocaleDateString('id-ID', options);

      return {
        success: true,
        data: {
          date: dateStr,
          formatted_date,
          total_available,
          slots
        }
      };
    } catch (err) {
      console.error('getDateSlots error:', err);
      return { success: false, error: err.message };
    }
  },

  // 4. Bookings
  createBooking: async (payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('createBooking', payload);
    }

    try {
      // Validate slot availability
      const slotsRes = await api.getDateSlots(payload.appointment_date);
      if (slotsRes && slotsRes.success && slotsRes.data) {
        const slot = slotsRes.data.slots.find(s => s.time === payload.appointment_time);
        if (slot && slot.status !== 'AVAILABLE') {
          return {
            success: false,
            error: `Slot jam ${payload.appointment_time} pada tanggal ${payload.appointment_date} sudah tidak tersedia.`
          };
        }
      }

      // Generate random booking code
      const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const booking_code = `PGN-${randHex}`;

      const insertPayload = {
        booking_code,
        name: payload.name.trim(),
        whatsapp: payload.whatsapp.trim(),
        services: Array.isArray(payload.services) ? payload.services : [payload.services],
        design_inspo: payload.design_inspo || 'Kirim via WhatsApp',
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        notes: payload.notes || null,
        status: 'PENDING'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      // WhatsApp ticket link
      const servicesText = (data.services || []).join(', ');
      const waMessage = `Halo Petite Girl Nails! 💕%0A%0ASaya ingin konfirmasi booking studio:%0A• Kode: *${booking_code}*%0A• Nama: *${data.name}*%0A• Tanggal: *${data.appointment_date}*%0A• Jam: *${data.appointment_time} WIB*%0A• Layanan: *${servicesText}*%0A• Desain Inspo: *${data.design_inspo || '-'}*%0A• Catatan: *${data.notes || '-'}*%0A%0AMohon info ketersediaan & petunjuk ke studio ya kak, terima kasih! ✨💅`;
      const whatsapp_url = `https://wa.me/6285179968311?text=${waMessage}`;

      return {
        success: true,
        data: {
          ...data,
          whatsapp_url
        }
      };
    } catch (err) {
      console.error('createBooking error:', err);
      return { success: false, error: err.message };
    }
  },

  getAllBookings: async () => {
    if (isLocalPostgres) {
      return await callLocalApi('getAllBookings');
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('getAllBookings error:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  updateBookingStatus: async (id, status) => {
    if (isLocalPostgres) {
      return await callLocalApi('updateBookingStatus', { id, status });
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 5. Press On Nails (PON) Tracking
  getPonOrders: async (query = '') => {
    if (isLocalPostgres) {
      return await callLocalApi('getPonOrders', { query });
    }

    try {
      let req = supabase
        .from('pon_orders')
        .select('*')
        .order('id', { ascending: false });

      if (query && query.trim()) {
        const q = query.trim();
        req = req.or(`order_id.ilike.%${q}%,customer_name.ilike.%${q}%`);
      }

      const { data, error } = await req;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.error('getPonOrders error:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  createPonOrder: async (payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('createPonOrder', payload);
    }

    try {
      let order_id = payload.order_id;
      if (!order_id) {
        const randNum = Math.floor(100 + Math.random() * 900);
        order_id = `PON-${randNum}`;
      }

      const { data, error } = await supabase
        .from('pon_orders')
        .insert([{
          order_id,
          customer_name: payload.customer_name.trim(),
          deadline: payload.deadline.trim(),
          status: payload.status || 'ANTRI',
          notes: payload.notes || null
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updatePonOrder: async (id, payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('updatePonOrder', { id, ...payload });
    }

    try {
      const { data, error } = await supabase
        .from('pon_orders')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 6. Blocked Slots & Studio Holidays
  blockSlot: async (payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('blockSlot', payload);
    }

    try {
      const { data, error } = await supabase
        .from('blocked_slots')
        .insert([{
          date: payload.date,
          time: payload.time || null,
          reason: payload.reason || 'Jadwal Libur Studio'
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  unblockSlot: async (payload) => {
    if (isLocalPostgres) {
      return await callLocalApi('unblockSlot', payload);
    }

    try {
      let query = supabase.from('blocked_slots').delete().eq('date', payload.date);
      if (payload.time) {
        query = query.eq('time', payload.time);
      }
      const { error } = await query;
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 7. Admin Server Authentication
  loginAdmin: async (username, password) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('loginAdmin error:', err);
      return { success: false, error: 'Gagal menghubungi server verifikasi' };
    }
  }
};
