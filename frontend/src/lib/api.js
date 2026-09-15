const BASE_URL = 'http://localhost:3000';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    return { success: false, error: err.message || 'Gagal menghubungi server' };
  }
}

export const api = {
  getStudio: () => fetchApi('/api/studio'),
  getServices: () => fetchApi('/api/services'),
  getAvailability: (month) => fetchApi(`/api/availability${month ? `?month=${month}` : ''}`),
  getDateSlots: (date) => fetchApi(`/api/availability/${date}`),
  createBooking: (payload) => fetchApi('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPonOrders: (query) => fetchApi(`/api/pon${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  getAllBookings: () => fetchApi('/api/admin/bookings'),
  updateBookingStatus: (id, status) => fetchApi(`/api/admin/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  createPonOrder: (payload) => fetchApi('/api/admin/pon', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updatePonOrder: (id, payload) => fetchApi(`/api/admin/pon/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  blockSlot: (payload) => fetchApi('/api/admin/slots/block', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  unblockSlot: (payload) => fetchApi('/api/admin/slots/unblock', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  createService: (payload) => fetchApi('/api/admin/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateService: (id, payload) => fetchApi(`/api/admin/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteService: (id) => fetchApi(`/api/admin/services/${id}`, {
    method: 'DELETE',
  }),
};
