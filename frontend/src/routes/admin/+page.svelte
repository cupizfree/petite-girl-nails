<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { downloadStyledExcel } from '$lib/exportExcel';
  import { getStudioCalendarUrl, getPonCalendarUrl } from '$lib/calendar';

  let feedCopied = $state(false);
  function copyFeedUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://petite-girl-nails.vercel.app';
    const url = `${origin}/api/calendar/feed.ics`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      feedCopied = true;
      setTimeout(() => feedCopied = false, 3000);
    }
  }

  let activeTab = $state('agenda'); // 'agenda', 'bookings', 'pon', 'services', 'slots'

  let bookings = $state([]);
  let ponOrders = $state([]);
  let services = $state([]);
  let loading = $state(true);
  let actionMessage = $state('');

  // Search states
  let agendaSearch = $state('');
  let bookingSearch = $state('');
  let ponSearch = $state('');

  // Booking filters
  let bookingFilter = $state('ALL');

  // Agenda Harian state
  let agendaDate = $state(new Date().toISOString().slice(0, 10));
  const standardSlots = ["10:00", "13:00", "16:00", "19:00", "21:00"];

  let agendaSlots = $derived(
    (() => {
      const slots = standardSlots.map(time => {
        const booking = bookings.find(b => 
          b.appointment_date === agendaDate && 
          b.appointment_time === time && 
          b.status !== 'CANCELLED'
        );
        return {
          time,
          booking: booking || null,
        };
      });

      if (!agendaSearch.trim()) return slots;

      const q = agendaSearch.trim().toLowerCase();
      return slots.filter(item => {
        if (!item.booking) return false;
        const b = item.booking;
        return (
          (b.name || '').toLowerCase().includes(q) ||
          (b.booking_code || '').toLowerCase().includes(q) ||
          (b.whatsapp || '').toLowerCase().includes(q) ||
          (item.time || '').toLowerCase().includes(q) ||
          (Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(q))) ||
          (b.notes || '').toLowerCase().includes(q) ||
          (b.design_inspo || '').toLowerCase().includes(q)
        );
      });
    })()
  );

  let otherDatesAgendaMatches = $derived(
    agendaSearch.trim()
      ? bookings.filter(b => {
          if (b.appointment_date === agendaDate || b.status === 'CANCELLED') return false;
          const q = agendaSearch.trim().toLowerCase();
          return (
            (b.name || '').toLowerCase().includes(q) ||
            (b.booking_code || '').toLowerCase().includes(q) ||
            (b.whatsapp || '').toLowerCase().includes(q) ||
            (Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(q)))
          );
        })
      : []
  );

  function setAgendaOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    agendaDate = d.toISOString().slice(0, 10);
  }

  // Service CRUD modal state
  let showServiceModal = $state(false);
  let editingServiceId = $state(null);
  let serviceFormName = $state('');
  let serviceFormCategory = $state('Nail Art');
  let serviceFormDuration = $state(60);
  let serviceFormPrice = $state(50000);
  let serviceFormDesc = $state('');

  // New PON Modal state
  let showNewPonModal = $state(false);
  let newPonCustomer = $state('');
  let newPonDeadline = $state('');
  let newPonDeadlineDate = $state('');
  let newPonNotes = $state('');
  let newPonStatus = $state('ANTRI');

  // Block slot form
  let blockDate = $state('');
  let blockTime = $state('');
  let blockReason = $state('');

  async function loadData() {
    loading = true;
    try {
      const [bRes, pRes, sRes] = await Promise.all([
        api.getAllBookings(),
        api.getPonOrders(),
        api.getServices()
      ]);

      if (bRes && bRes.success && bRes.data) {
        bookings = bRes.data;
      }
      if (pRes && pRes.success && pRes.data) {
        ponOrders = pRes.data;
      }
      if (sRes && sRes.success && sRes.data) {
        services = sRes.data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function updateBookingStatus(id, newStatus) {
    actionMessage = 'Memperbarui status booking...';
    try {
      const res = await api.updateBookingStatus(id, newStatus);
      if (res && res.success) {
        const item = bookings.find(b => b.id === id);
        if (item) item.status = newStatus;
        actionMessage = `Status booking #${id} berhasil diubah ke ${newStatus}`;
      }
    } catch (e) {
      actionMessage = 'Gagal memperbarui status booking';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  async function updatePonStatus(id, newStatus) {
    actionMessage = 'Memperbarui status pesanan PON...';
    try {
      const res = await api.updatePonOrder(id, { status: newStatus });
      if (res && res.success) {
        const item = ponOrders.find(p => p.id === id);
        if (item) item.status = newStatus;
        actionMessage = `Status pesanan #${id} berhasil diubah ke ${newStatus}`;
      }
    } catch (e) {
      actionMessage = 'Gagal memperbarui status PON';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  async function handleCreatePon(e) {
    e.preventDefault();
    if (!newPonCustomer.trim() || !newPonDeadline.trim()) return;

    try {
      const res = await api.createPonOrder({
        customer_name: newPonCustomer.trim(),
        deadline: newPonDeadline.trim(),
        status: newPonStatus,
        notes: newPonNotes.trim() || null,
      });

      if (res && res.success && res.data) {
        ponOrders = [res.data, ...ponOrders];
        showNewPonModal = false;
        newPonCustomer = '';
        newPonDeadline = '';
        newPonDeadlineDate = '';
        newPonNotes = '';
        actionMessage = `Pesanan PON ${res.data.order_id} berhasil ditambahkan!`;
      }
    } catch (e) {
      actionMessage = 'Gagal menambah pesanan PON';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  function openAddServiceModal() {
    editingServiceId = null;
    serviceFormName = '';
    serviceFormCategory = 'Nail Art';
    serviceFormDuration = 60;
    serviceFormPrice = 50000;
    serviceFormDesc = '';
    showServiceModal = true;
  }

  function openEditServiceModal(item) {
    editingServiceId = item.id;
    serviceFormName = item.name;
    serviceFormCategory = item.category || 'Nail Art';
    serviceFormDuration = item.estimated_duration_min || 60;
    serviceFormPrice = item.price;
    serviceFormDesc = item.description || '';
    showServiceModal = true;
  }

  async function handleSaveService(e) {
    e.preventDefault();
    if (!serviceFormName.trim()) return;

    try {
      if (editingServiceId) {
        const res = await api.updateService(editingServiceId, {
          name: serviceFormName.trim(),
          category: serviceFormCategory,
          estimated_duration_min: Number(serviceFormDuration),
          price: Number(serviceFormPrice),
          description: serviceFormDesc.trim(),
        });
        if (res && res.success) {
          actionMessage = `Layanan "${serviceFormName}" berhasil diperbarui!`;
          loadData();
          showServiceModal = false;
        }
      } else {
        const res = await api.createService({
          name: serviceFormName.trim(),
          category: serviceFormCategory,
          estimated_duration_min: Number(serviceFormDuration),
          price: Number(serviceFormPrice),
          description: serviceFormDesc.trim(),
        });
        if (res && res.success) {
          actionMessage = `Layanan "${serviceFormName}" berhasil ditambahkan!`;
          loadData();
          showServiceModal = false;
        }
      }
    } catch (err) {
      actionMessage = 'Gagal menyimpan layanan';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  async function handleDeleteService(id, name) {
    if (!confirm(`Hapus layanan "${name}" dari katalog studio?`)) return;
    try {
      const res = await api.deleteService(id);
      if (res && res.success) {
        services = services.filter(s => s.id !== id);
        actionMessage = `Layanan "${name}" berhasil dihapus.`;
      }
    } catch (err) {
      actionMessage = 'Gagal menghapus layanan';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  let isExporting = $state(false);

  async function exportBookingsToExcel(customList = null, dateLabel = '') {
    const list = customList || (bookingFilter === 'ALL' ? bookings : filteredBookings);
    if (!list || list.length === 0) {
      alert('Belum ada data booking untuk di-export.');
      return;
    }
    isExporting = true;
    actionMessage = 'Membuat file Excel rapi (.xlsx)...';
    try {
      await downloadStyledExcel(list, dateLabel || (bookingFilter !== 'ALL' ? bookingFilter.toLowerCase() : 'semua'));
      actionMessage = 'File Excel (.xlsx) rapi berhasil diunduh! 📊✨';
    } catch (err) {
      console.error(err);
      actionMessage = 'Gagal mengunduh Excel, menggunakan format CSV...';
      exportBookingsToCsv();
    } finally {
      isExporting = false;
      setTimeout(() => actionMessage = '', 3500);
    }
  }

  function exportBookingsToCsv() {
    if (!bookings || bookings.length === 0) {
      alert('Belum ada data booking untuk di-export.');
      return;
    }

    const headers = ['Kode Booking', 'Nama Pelanggan', 'WhatsApp', 'Tanggal', 'Jam Slot', 'Layanan', 'Desain Inspo', 'Catatan', 'Status', 'Dibuat Pada'];
    const rows = bookings.map(b => [
      `"${b.booking_code}"`,
      `"${(b.name || '').replace(/"/g, '""')}"`,
      `"'\t${b.whatsapp}"`,
      `"${b.appointment_date}"`,
      `"${b.appointment_time}"`,
      `"${(b.services || []).join('; ').replace(/"/g, '""')}"`,
      `"${(b.design_inspo || '').replace(/"/g, '""')}"`,
      `"${(b.notes || '-').replace(/"/g, '""')}"`,
      `"${b.status}"`,
      `"${b.created_at}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap-Booking-PetiteGirlNails-${agendaDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    actionMessage = 'File rekap CSV berhasil diunduh!';
    setTimeout(() => actionMessage = '', 3000);
  }

  async function handleBlockSlot(e) {
    e.preventDefault();
    if (!blockDate) return;

    try {
      const res = await api.blockSlot({
        date: blockDate,
        time: blockTime || null,
        reason: blockReason || 'Jadwal Libur Studio'
      });
      if (res && res.success) {
        actionMessage = `Slot pada ${blockDate} ${blockTime || '(Seharian)'} berhasil diblokir!`;
        blockDate = '';
        blockTime = '';
        blockReason = '';
      }
    } catch (e) {
      actionMessage = 'Gagal memblokir slot';
    }
    setTimeout(() => actionMessage = '', 3000);
  }

  // Authentication state
  let isAuthenticated = $state(false);
  let authUsername = $state('');
  let authPassword = $state('');
  let showPassword = $state(false);
  let authError = $state('');
  let authLoading = $state(false);

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    authError = '';
    authLoading = true;
    
    // Normalize input
    const cleanUser = (authUsername || '').trim();
    const cleanPass = (authPassword || '').trim();

    try {
      const res = await api.loginAdmin(cleanUser, cleanPass);
      if (res && res.success) {
        isAuthenticated = true;
        if (typeof window !== 'undefined') {
          localStorage.setItem('pgn_admin_auth', res.token || 'true');
          sessionStorage.setItem('pgn_admin_auth', res.token || 'true');
        }
        authError = '';
        loadData();
      } else {
        authError = res?.error || 'Username atau password tidak sesuai. Akses ditolak.';
      }
    } catch (err) {
      authError = 'Gagal menghubungi server autentikasi.';
    } finally {
      authLoading = false;
    }
  }

  function handleLogout() {
    isAuthenticated = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pgn_admin_auth');
      sessionStorage.removeItem('pgn_admin_auth');
    }
    authUsername = '';
    authPassword = '';
    bookings = [];
    ponOrders = [];
  }

  let filteredBookings = $derived(
    bookings.filter(b => {
      if (bookingFilter !== 'ALL' && b.status !== bookingFilter) return false;
      if (bookingSearch.trim()) {
        const q = bookingSearch.trim().toLowerCase();
        const matchName = (b.name || '').toLowerCase().includes(q);
        const matchCode = (b.booking_code || '').toLowerCase().includes(q);
        const matchWa = (b.whatsapp || '').toLowerCase().includes(q);
        const matchDate = (b.appointment_date || '').toLowerCase().includes(q);
        const matchTime = (b.appointment_time || '').toLowerCase().includes(q);
        const matchServices = Array.isArray(b.services) && b.services.some(s => s.toLowerCase().includes(q));
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        const matchInspo = (b.design_inspo || '').toLowerCase().includes(q);
        return matchName || matchCode || matchWa || matchDate || matchTime || matchServices || matchNotes || matchInspo;
      }
      return true;
    })
  );

  let filteredPonOrders = $derived(
    ponOrders.filter(p => {
      if (!ponSearch.trim()) return true;
      const q = ponSearch.trim().toLowerCase();
      const matchId = (p.order_id || '').toLowerCase().includes(q);
      const matchName = (p.customer_name || '').toLowerCase().includes(q);
      const matchDeadline = (p.deadline || '').toLowerCase().includes(q);
      const matchStatus = (p.status || '').toLowerCase().replace(/_/g, ' ').includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      return matchId || matchName || matchDeadline || matchStatus || matchNotes;
    })
  );

  onMount(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pgn_admin_auth') || sessionStorage.getItem('pgn_admin_auth');
      if (saved === 'true') {
        isAuthenticated = true;
        loadData();
      }
    }
  });
</script>

<svelte:head>
  <title>Studio Admin Dashboard — Petite Girl Nails</title>
</svelte:head>

{#if !isAuthenticated}
  <div class="login-wrapper">
    <div class="login-card animate-fade-in">
      <div class="login-logo-wrap">
        <img src="/logo.png" alt="Petite Girl Nails" class="login-logo" />
        <div class="brand-trio">
          <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
        </div>
      </div>

      <div class="login-badge">
        <span>🔒 PORTAL RAHASIA PENGELOLA</span>
      </div>

      <h1 class="login-title">Masuk Studio Admin</h1>
      <p class="login-sub">Halaman ini tersembunyi & hanya dapat diakses oleh pemilik studio Petite Girl Nails.</p>

      {#if authError}
        <div class="auth-error-alert animate-fade-in">
          <span>⚠️</span>
          <span>{authError}</span>
        </div>
      {/if}

      <form onsubmit={handleLogin} action="javascript:void(0);" class="login-form">
        <div class="login-field">
          <label for="admin-user" class="login-label">
            <span class="label-icon">👤</span>
            <span>Username</span>
          </label>
          <div class="login-input-wrap">
            <input 
              type="text" 
              id="admin-user" 
              bind:value={authUsername} 
              placeholder="Masukkan username" 
              required 
              autocomplete="username"
              class="login-input" 
            />
          </div>
        </div>

        <div class="login-field">
          <label for="admin-pass" class="login-label">
            <span class="label-icon">🔑</span>
            <span>Password</span>
          </label>
          <div class="login-input-wrap">
            <input 
              type={showPassword ? 'text' : 'password'} 
              id="admin-pass" 
              bind:value={authPassword} 
              placeholder="Masukkan password" 
              required 
              autocomplete="current-password"
              class="login-input login-input-with-toggle" 
            />
            <button 
              type="button" 
              class="btn-toggle-eye" 
              onclick={() => showPassword = !showPassword}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-login-submit" disabled={authLoading}>
          {#if authLoading}
            <span>Memverifikasi...</span>
          {:else}
            <span>Buka Dashboard 🔐</span>
          {/if}
        </button>
      </form>

      <div class="login-footer-hint">
        <a href="/" class="login-back-home">← Kembali ke Beranda Studio</a>
      </div>
    </div>
  </div>
{:else}
  <div class="admin-wrap">
    <!-- Admin Header -->
    <div class="admin-header">
      <div>
        <div class="admin-badge">
          <div class="brand-trio">
            <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
          </div>
          <span>MANAGEMENT DASHBOARD</span>
        </div>
        <h1 class="admin-title">Studio Admin</h1>
        <p class="admin-sub">Kelola jadwal booking janji temu, pesanan kuku palsu (PON), dan ketersediaan slot studio.</p>
      </div>

      <div class="admin-top-actions">
        <button class="btn-refresh" onclick={loadData} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
        <button class="btn-logout" onclick={handleLogout} title="Keluar dari sesi admin">
          🚪 Keluar
        </button>
      </div>
    </div>

  {#if actionMessage}
    <div class="toast-message animate-fade-in">
      <span>🔔</span>
      <span>{actionMessage}</span>
    </div>
  {/if}

  <!-- Stats Overview -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon">💅</div>
      <div>
        <div class="stat-label">Total Booking Masuk</div>
        <div class="stat-val">{bookings.length}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⏳</div>
      <div>
        <div class="stat-label">Booking Pending</div>
        <div class="stat-val">{bookings.filter(b => b.status === 'PENDING').length}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📦</div>
      <div>
        <div class="stat-label">Pesanan PON Aktif</div>
        <div class="stat-val">{ponOrders.filter(p => p.status !== 'SENT' && p.status !== 'CANCELLED').length}</div>
      </div>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <!-- Navigation Tabs -->
  <div class="tab-bar">
    <button 
      class="tab-btn" 
      class:active={activeTab === 'agenda'} 
      onclick={() => activeTab = 'agenda'}
    >
      ⏰ Agenda Harian
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'bookings'} 
      onclick={() => activeTab = 'bookings'}
    >
      📅 Janji Temu ({bookings.length})
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'pon'} 
      onclick={() => activeTab = 'pon'}
    >
      📦 Pesanan PON ({ponOrders.length})
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'services'} 
      onclick={() => activeTab = 'services'}
    >
      💅 Menu & Harga ({services.length})
    </button>
    <button 
      class="tab-btn" 
      class:active={activeTab === 'slots'} 
      onclick={() => activeTab = 'slots'}
    >
      🔒 Blokir Slot / Libur
    </button>
  </div>

  <!-- Tab 0: Agenda Harian -->
  {#if activeTab === 'agenda'}
    <div class="tab-content animate-fade-in">
      <!-- Google Calendar Sync Banner -->
      <div class="gcal-sync-banner">
        <div class="gcal-banner-left">
          <div class="gcal-icon-wrap">📅</div>
          <div>
            <div class="gcal-badge-row">
              <span class="gcal-badge">OTOMATIS & ADA ALARM</span>
              <span class="gcal-sub-tag">Studio & PON</span>
            </div>
            <h4 class="gcal-title">Sinkronkan Jadwal ke Google Calendar HP Kamu</h4>
            <p class="gcal-desc">Janji temu studio (notifikasi H-2 jam) & deadline PON mepet (notifikasi H-1) otomatis tersinkron ke kalender HP kamu!</p>
          </div>
        </div>
        <div class="gcal-banner-right">
          <button type="button" class="btn-copy-feed" onclick={copyFeedUrl}>
            {feedCopied ? '✓ Link Feed Disalin!' : '📋 Salin Link Kalender (.ics)'}
          </button>
          <a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noopener noreferrer" class="btn-open-gcal-settings">
            Buka Pengaturan GCal ➔
          </a>
        </div>
      </div>

      <div class="agenda-toolbar">
        <div class="agenda-date-controls">
          <button class="btn-date-quick" class:active={agendaDate === new Date().toISOString().slice(0, 10)} onclick={() => setAgendaOffset(0)}>Hari Ini</button>
          <button class="btn-date-quick" onclick={() => setAgendaOffset(1)}>Besok</button>
          <input type="date" bind:value={agendaDate} class="agenda-date-input" />
        </div>

        <!-- Search in Agenda -->
        <div class="admin-search-box agenda-search">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            bind:value={agendaSearch} 
            placeholder="Cari jadwal hari ini (nama, kode, WA, layanan)..." 
            class="admin-search-input"
          />
          {#if agendaSearch}
            <button class="btn-clear-search" onclick={() => agendaSearch = ''} title="Hapus pencarian">✕</button>
          {/if}
        </div>

        <div class="agenda-toolbar-right">
          <button 
            class="btn-export-agenda"
            onclick={() => {
              const dailyList = bookings.filter(b => b.appointment_date === agendaDate);
              exportBookingsToExcel(dailyList, `Harian-${agendaDate}`);
            }}
            disabled={isExporting}
            title="Unduh rekap jadwal hari ini ke file Excel .xlsx yang rapi"
          >
            📊 Unduh Jadwal Hari Ini (.xlsx)
          </button>
          <div class="agenda-summary-tag">
            <span>Jadwal: <strong>{agendaDate}</strong></span>
          </div>
        </div>
      </div>

      <div class="agenda-timeline">
        {#if agendaSlots.length === 0}
          <div class="empty-search-state animate-fade-in">
            <div class="empty-search-icon">🔍</div>
            <h4>Tidak Ada Jadwal yang Cocok</h4>
            <p>Tidak ditemukan janji temu dengan kata kunci <strong>"{agendaSearch}"</strong> pada tanggal <strong>{agendaDate}</strong>.</p>
            
            {#if otherDatesAgendaMatches.length > 0}
              <div class="other-dates-hint">
                <span>💡 Ditemukan <strong>{otherDatesAgendaMatches.length}</strong> booking yang cocok di tanggal lain!</span>
                <button 
                  class="btn-switch-search-tab"
                  onclick={() => {
                    bookingSearch = agendaSearch;
                    activeTab = 'bookings';
                  }}
                >
                  Lihat di Janji Temu ➔
                </button>
              </div>
            {/if}

            <button class="btn-reset-search" onclick={() => agendaSearch = ''}>
              ✕ Reset Pencarian Agenda
            </button>
          </div>
        {:else}
        {#each agendaSlots as item}
          <div class="agenda-slot-card" class:has-booking={item.booking}>
            <div class="agenda-time-badge" class:booked={!!item.booking}>
              <span class="clock-icon-wrap">⏰</span>
              <span class="time-main">{item.time}</span>
              <span class="time-zone">WIB</span>
              <span class="slot-indicator" class:occupied={!!item.booking}>
                {item.booking ? 'Terisi' : 'Tersedia'}
              </span>
            </div>

            <div class="agenda-slot-body">
              {#if item.booking}
                <div class="agenda-customer-info">
                  <div class="agenda-customer-top">
                    <div class="cust-headline">
                      <h4>{item.booking.name}</h4>
                      <span class="booking-code-chip">{item.booking.booking_code}</span>
                      <span class={`status-tag status-${item.booking.status.toLowerCase()}`}>
                        {item.booking.status}
                      </span>
                    </div>
                    <a 
                      href={`https://wa.me/${item.booking.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="wa-badge-link"
                      title="Klik untuk buka chat WhatsApp"
                    >
                      📱 {item.booking.whatsapp}
                    </a>
                  </div>

                  <!-- Services Tags -->
                  <div class="agenda-services-list">
                    {#each item.booking.services as s}
                      <span class="service-pill">💅 {s}</span>
                    {/each}
                  </div>

                  <!-- Inspo & Notes -->
                  {#if item.booking.notes || item.booking.design_inspo}
                    <div class="agenda-note-box">
                      <span class="note-icon">📝</span>
                      <div class="note-content">
                        {#if item.booking.design_inspo}
                          <span class="note-inspo"><strong>Inspo:</strong> {item.booking.design_inspo}</span>
                        {/if}
                        {#if item.booking.notes}
                          <span class="note-text"><strong>Catatan:</strong> {item.booking.notes}</span>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>

                <div class="agenda-slot-actions">
                  <a 
                    href={`https://wa.me/${item.booking.whatsapp.replace(/\D/g, '')}?text=Halo%20kak%20${encodeURIComponent(item.booking.name)}%2C%20ini%20admin%20Petite%20Girl%20Nails%20terkait%20jadwal%20nail%20art%20jam%20${item.time}%20hari%20ini%20%E2%9C%A8`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="btn-agenda-wa"
                    title="Kirim pesan WhatsApp ke klien"
                  >
                    💬 Chat WA
                  </a>
                  <a 
                    href={getStudioCalendarUrl(item.booking)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="btn-agenda-gcal"
                    title="Buka & Tambahkan ke Google Calendar dengan Alarm Pengingat 2 Jam & 30 Menit"
                  >
                    📅 GCal
                  </a>
                  {#if item.booking.status === 'PENDING'}
                    <button 
                      class="btn-agenda-action confirm" 
                      onclick={() => updateBookingStatus(item.booking.id, 'CONFIRMED')}
                      title="Konfirmasi booking ini"
                    >
                      ✓ Konfirmasi
                    </button>
                  {/if}
                  {#if item.booking.status === 'CONFIRMED'}
                    <button 
                      class="btn-agenda-action complete" 
                      onclick={() => updateBookingStatus(item.booking.id, 'COMPLETED')}
                      title="Tandai booking selesai dikerjakan"
                    >
                      ✓ Selesai
                    </button>
                  {/if}
                  {#if item.booking.status !== 'CANCELLED' && item.booking.status !== 'COMPLETED'}
                    <button 
                      class="btn-agenda-action cancel" 
                      onclick={() => updateBookingStatus(item.booking.id, 'CANCELLED')}
                      title="Batalkan booking ini"
                    >
                      Batalkan
                    </button>
                  {/if}
                </div>
              {:else}
                <div class="agenda-empty-slot">
                  <div class="empty-slot-content">
                    <span class="empty-dot"></span>
                    <div class="empty-text-wrap">
                      <strong>Slot Kosong ({item.time} WIB)</strong>
                      <small>Studio siap menerima reservasi janji temu untuk jam ini</small>
                    </div>
                  </div>
                  <a href={`/book?date=${agendaDate}&time=${item.time}`} class="btn-book-slot-link">
                    + Buat Booking Jam Ini
                  </a>
                </div>
              {/if}
            </div>
          </div>
        {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Tab 1: Bookings Management -->
  {#if activeTab === 'bookings'}
    <div class="tab-content animate-fade-in">
      <div class="content-head">
        <div class="head-left-group">
          <div class="filter-group">
            <span>Filter Status:</span>
            <select bind:value={bookingFilter} class="filter-select">
              <option value="ALL">Semua ({bookings.length})</option>
              <option value="PENDING">Pending ({bookings.filter(b => b.status === 'PENDING').length})</option>
              <option value="CONFIRMED">Confirmed ({bookings.filter(b => b.status === 'CONFIRMED').length})</option>
              <option value="COMPLETED">Completed ({bookings.filter(b => b.status === 'COMPLETED').length})</option>
              <option value="CANCELLED">Cancelled ({bookings.filter(b => b.status === 'CANCELLED').length})</option>
            </select>
          </div>

          <!-- Search in Janji Temu -->
          <div class="admin-search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              bind:value={bookingSearch} 
              placeholder="Cari booking (kode, nama, WA, tgl, layanan)..." 
              class="admin-search-input"
            />
            {#if bookingSearch}
              <button class="btn-clear-search" onclick={() => bookingSearch = ''} title="Hapus pencarian">✕</button>
            {/if}
          </div>
        </div>

        <div class="export-buttons-group">
          <button 
            class="btn-export-excel" 
            onclick={() => exportBookingsToExcel(null, bookingFilter !== 'ALL' ? bookingFilter.toLowerCase() : 'semua')}
            disabled={isExporting}
            title="Unduh seluruh booking terpilih ke file Microsoft Excel .xlsx yang rapi dan berformat"
          >
            {isExporting ? '⏳ Menyiapkan Excel...' : '📊 Unduh Rekap Excel (.xlsx)'}
          </button>
          <button 
            class="btn-export-csv-alt" 
            onclick={exportBookingsToCsv}
            title="Unduh format data mentah .csv"
          >
            Unduh .csv
          </button>
        </div>
      </div>

      <div class="admin-table-card">
        {#if filteredBookings.length === 0}
          <div class="empty-state">
            {#if bookingSearch.trim()}
              <div class="empty-search-icon">🔍</div>
              <p>Tidak ada booking yang cocok dengan kata kunci <strong>"{bookingSearch}"</strong>{bookingFilter !== 'ALL' ? ` pada filter status ${bookingFilter}` : ''}.</p>
              <button class="btn-reset-search" onclick={() => bookingSearch = ''}>✕ Reset Pencarian</button>
            {:else}
              <p>Belum ada data booking pada filter ini.</p>
            {/if}
          </div>
        {:else}
          <div class="table-scroll">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>KODE & NAMA</th>
                  <th>WHATSAPP</th>
                  <th>JADWAL</th>
                  <th>LAYANAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredBookings as item}
                  <tr>
                    <td>
                      <span class="code-badge">{item.booking_code}</span>
                      <strong class="cust-name">{item.name}</strong>
                    </td>
                    <td>
                      <a 
                        href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=Halo%20kak%20${encodeURIComponent(item.name)}%2C%20ini%20admin%20Petite%20Girl%20Nails%20terkait%20booking%20${item.booking_code}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="wa-link"
                      >
                        📱 {item.whatsapp}
                      </a>
                    </td>
                    <td>
                      <div><strong>{item.appointment_date}</strong></div>
                      <span class="time-tag">⏰ {item.appointment_time}</span>
                    </td>
                    <td>
                      <div class="services-mini">{item.services.join(', ')}</div>
                      {#if item.notes}
                        <div class="notes-mini">📝 {item.notes}</div>
                      {/if}
                    </td>
                    <td>
                      <span class={`status-tag status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <a 
                          href={getStudioCalendarUrl(item)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          class="btn-act gcal"
                          title="Buka & Pasang di Google Calendar dengan Alarm Pengingat"
                        >
                          📅 GCal
                        </a>
                        {#if item.status === 'PENDING'}
                          <button 
                            class="btn-act confirm" 
                            onclick={() => updateBookingStatus(item.id, 'CONFIRMED')}
                          >
                            ✓ Konfirmasi
                          </button>
                        {/if}
                        {#if item.status === 'CONFIRMED'}
                          <button 
                            class="btn-act complete" 
                            onclick={() => updateBookingStatus(item.id, 'COMPLETED')}
                          >
                            ✓ Selesai
                          </button>
                        {/if}
                        {#if item.status !== 'CANCELLED'}
                          <button 
                            class="btn-act cancel" 
                            onclick={() => updateBookingStatus(item.id, 'CANCELLED')}
                          >
                            Batalkan
                          </button>
                        {/if}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Tab 2: PON Orders Management -->
  {#if activeTab === 'pon'}
    <div class="tab-content animate-fade-in">
      <div class="content-head">
        <div class="head-left-group">
          <h3>Daftar Pesanan Press On Nails</h3>
          <!-- Search in Pesanan PON -->
          <div class="admin-search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              bind:value={ponSearch} 
              placeholder="Cari order ID, nama, deadline, status, catatan..." 
              class="admin-search-input"
            />
            {#if ponSearch}
              <button class="btn-clear-search" onclick={() => ponSearch = ''} title="Hapus pencarian">✕</button>
            {/if}
          </div>
        </div>

        <button class="btn-add-pon" onclick={() => showNewPonModal = true}>
          + Tambah Pesanan PON Baru
        </button>
      </div>

      <div class="admin-table-card">
        {#if filteredPonOrders.length === 0}
          <div class="empty-state">
            {#if ponSearch.trim()}
              <div class="empty-search-icon">🔍</div>
              <p>Tidak ada pesanan PON yang cocok dengan kata kunci <strong>"{ponSearch}"</strong>.</p>
              <button class="btn-reset-search" onclick={() => ponSearch = ''}>✕ Reset Pencarian</button>
            {:else}
              <p>Belum ada pesanan PON tersimpan.</p>
            {/if}
          </div>
        {:else}
          <div class="table-scroll">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ORDER ID & CUSTOMER</th>
                  <th>DEADLINE</th>
                  <th>STATUS</th>
                  <th>CATATAN / RESI</th>
                  <th>UBAH STATUS CEPAT</th>
                </tr>
              </thead>
              <tbody>
                {#each filteredPonOrders as item}
                  <tr>
                    <td>
                      <span class="code-badge">{item.order_id}</span>
                      <strong class="cust-name">{item.customer_name || 'Customer'}</strong>
                    </td>
                    <td><strong>{item.deadline}</strong></td>
                    <td>
                      <span class={`status-tag status-${item.status.toLowerCase()}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span class="pon-notes-text">{item.notes || '-'}</span>
                    </td>
                    <td>
                      <div class="quick-status-group">
                        <button 
                          class="btn-status-pill antri" 
                          class:active={item.status === 'ANTRI'} 
                          onclick={() => updatePonStatus(item.id, 'ANTRI')}
                        >
                          🔴 Antri
                        </button>
                        <button 
                          class="btn-status-pill progress" 
                          class:active={item.status === 'PROGRESS'} 
                          onclick={() => updatePonStatus(item.id, 'PROGRESS')}
                        >
                          🟡 Progress
                        </button>
                        <button 
                          class="btn-status-pill ready" 
                          class:active={item.status === 'READY_TO_PICK_UP'} 
                          onclick={() => updatePonStatus(item.id, 'READY_TO_PICK_UP')}
                        >
                          🔵 Ready
                        </button>
                        <button 
                          class="btn-status-pill sent" 
                          class:active={item.status === 'SENT'} 
                          onclick={() => updatePonStatus(item.id, 'SENT')}
                        >
                          🟢 Sent
                        </button>
                        <a 
                          href={getPonCalendarUrl(item)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          class="btn-pon-gcal"
                          title="Buka Google Calendar untuk Pasang Alarm Pengingat Deadline Mepet"
                        >
                          ⏰ Alarm GCal
                        </a>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Tab 3: Slot Overrides & Holiday Block -->
  {#if activeTab === 'slots'}
    <div class="tab-content animate-fade-in">
      <div class="slot-block-card">
        <h3>🔒 Tutup Slot / Hari Libur Studio</h3>
        <p class="sub-text">Gunakan form ini jika studio libur pada tanggal tertentu atau ada jam yang tidak bisa menerima janji temu.</p>

        <form onsubmit={handleBlockSlot} class="block-form">
          <div class="form-row">
            <div class="form-group">
              <label for="block-date" class="form-label">
                <span>Pilih Tanggal</span>
                <span class="req-star">*</span>
              </label>
              <input type="date" id="block-date" bind:value={blockDate} class="form-input" required />
            </div>
            <div class="form-group">
              <label for="block-time" class="form-label">
                <span>Pilih Jam (Kosongkan jika libur seharian)</span>
              </label>
              <select id="block-time" bind:value={blockTime} class="form-input form-select">
                <option value="">-- Libur Seharian Penuh --</option>
                <option value="10:00">10:00 WIB</option>
                <option value="13:00">13:00 WIB</option>
                <option value="16:00">16:00 WIB</option>
                <option value="19:00">19:00 WIB</option>
                <option value="21:00">21:00 WIB</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label for="block-reason" class="form-label">
              <span>Alasan Penutupan (Opsional)</span>
            </label>
            <input type="text" id="block-reason" bind:value={blockReason} placeholder="Contoh: Maintenance studio, Hari Libur Nasional..." class="form-input" />
          </div>

          <button type="submit" class="btn-block-submit">
            🔒 Kunci Slot Ini
          </button>
        </form>
      </div>
    </div>
  {/if}

  <!-- Tab 4: Menu & Harga Services CRUD -->
  {#if activeTab === 'services'}
    <div class="tab-content animate-fade-in">
      <div class="content-head">
        <div>
          <h3 class="section-subtitle">Katalog Layanan & Tarif Studio</h3>
          <p class="section-desc">Atur menu perawatan kuku, durasi estimasi, dan harga yang tampil di katalog & form booking.</p>
        </div>
        <button class="btn-add-service" onclick={openAddServiceModal}>
          ➕ Tambah Layanan Baru
        </button>
      </div>

      <div class="admin-table-card">
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>LAYANAN & KATEGORI</th>
                <th>ESTIMASI DURASI</th>
                <th>TARIF / HARGA</th>
                <th>DESKRIPSI</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {#each services as item}
                <tr>
                  <td>
                    <div class="service-name-cell">
                      <strong>{item.name}</strong>
                      <span class="category-tag">{item.category || 'Nail Treatment'}</span>
                    </div>
                  </td>
                  <td>⏱️ {item.estimated_duration_min} Menit</td>
                  <td>
                    <strong class="price-highlight">
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </strong>
                  </td>
                  <td class="desc-cell">{item.description}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-edit-sm" onclick={() => openEditServiceModal(item)}>
                        ✏️ Edit
                      </button>
                      <button class="btn-del-sm" onclick={() => handleDeleteService(item.id, item.name)}>
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}

  <!-- Modal New PON -->
  {#if showNewPonModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop animate-fade-in" onclick={() => showNewPonModal = false}>
      <div class="modal-card" onclick={e => e.stopPropagation()}>
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-badge pon-badge">📦</div>
            <div>
              <h3>Tambah Pesanan Press On Nails</h3>
              <p class="modal-sub">Catat pesanan kuku palsu custom untuk antrean produksi studio.</p>
            </div>
          </div>
          <button type="button" class="btn-modal-close" onclick={() => showNewPonModal = false} title="Tutup">✕</button>
        </div>

        <form onsubmit={handleCreatePon} class="modal-body">
          <div class="form-group">
            <label for="pon-cust" class="form-label">
              <span>Nama Pelanggan / Akun Pemesan</span>
              <span class="req-star">*</span>
            </label>
            <input 
              type="text" 
              id="pon-cust" 
              bind:value={newPonCustomer} 
              placeholder="Contoh: Bestie Clara / @clara.nails" 
              class="form-input" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="pon-dead-picker" class="form-label">
                <span>Pilih Tanggal Target</span>
              </label>
              <input 
                type="date" 
                id="pon-dead-picker" 
                bind:value={newPonDeadlineDate} 
                onchange={() => {
                  if (newPonDeadlineDate) {
                    const [y, m, d] = newPonDeadlineDate.split('-');
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    newPonDeadline = `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
                  }
                }}
                class="form-input" 
              />
            </div>
            <div class="form-group">
              <label for="pon-dead" class="form-label">
                <span>Teks Deadline Tampil</span>
                <span class="req-star">*</span>
              </label>
              <input 
                type="text" 
                id="pon-dead" 
                bind:value={newPonDeadline} 
                placeholder="Misal: 20 September 2026" 
                class="form-input" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="form-label">
              <span>Status Produksi Awal</span>
              <span class="req-star">*</span>
            </label>
            <div class="pon-status-radios">
              <label class="status-radio-card antri" class:selected={newPonStatus === 'ANTRI'}>
                <input type="radio" name="pon-status" value="ANTRI" bind:group={newPonStatus} />
                <span class="dot"></span>
                <div>
                  <strong>ANTRI</strong>
                  <small>Menunggu dikerjakan</small>
                </div>
              </label>
              <label class="status-radio-card progress" class:selected={newPonStatus === 'PROGRESS'}>
                <input type="radio" name="pon-status" value="PROGRESS" bind:group={newPonStatus} />
                <span class="dot"></span>
                <div>
                  <strong>PROGRESS</strong>
                  <small>Sedang dilukis</small>
                </div>
              </label>
              <label class="status-radio-card ready" class:selected={newPonStatus === 'READY_TO_PICK_UP'}>
                <input type="radio" name="pon-status" value="READY_TO_PICK_UP" bind:group={newPonStatus} />
                <span class="dot"></span>
                <div>
                  <strong>READY</strong>
                  <small>Siap kirim / ambil</small>
                </div>
              </label>
              <label class="status-radio-card sent" class:selected={newPonStatus === 'SENT'}>
                <input type="radio" name="pon-status" value="SENT" bind:group={newPonStatus} />
                <span class="dot"></span>
                <div>
                  <strong>SENT</strong>
                  <small>Sudah diserahkan</small>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="pon-notes" class="form-label">
              <span>Keterangan / Ukuran Kuku / Nomor Resi</span>
            </label>
            <textarea 
              id="pon-notes" 
              bind:value={newPonNotes} 
              rows="3" 
              placeholder="Contoh: Bentuk Almond size M (2, 5, 4, 6, 8), tema blush ribbon glitter, kurir J&T JP123456789" 
              class="form-textarea"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" onclick={() => showNewPonModal = false}>
              Batal
            </button>
            <button type="submit" class="btn-modal-submit">
              <span>📦 Simpan Pesanan PON</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Modal Service Add / Edit -->
  {#if showServiceModal}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop animate-fade-in" onclick={() => showServiceModal = false}>
      <div class="modal-card" onclick={e => e.stopPropagation()}>
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon-badge">💅</div>
            <div>
              <h3>{editingServiceId ? 'Edit Layanan Treatment' : 'Tambah Layanan Treatment Baru'}</h3>
              <p class="modal-sub">Atur nama, kategori, estimasi durasi, dan tarif harga treatment studio.</p>
            </div>
          </div>
          <button type="button" class="btn-modal-close" onclick={() => showServiceModal = false} title="Tutup">✕</button>
        </div>

        <form onsubmit={handleSaveService} class="modal-body">
          <div class="form-group">
            <label for="svc-name" class="form-label">
              <span>Nama Treatment / Layanan</span>
              <span class="req-star">*</span>
            </label>
            <input 
              type="text" 
              id="svc-name" 
              bind:value={serviceFormName} 
              placeholder="Contoh: Russian Manicure Spa, Nail Art 3D Ribbon..." 
              class="form-input" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="svc-cat" class="form-label">
                <span>Kategori</span>
                <span class="req-star">*</span>
              </label>
              <select id="svc-cat" bind:value={serviceFormCategory} class="form-input form-select">
                <option value="Nail Art">💅 Nail Art</option>
                <option value="Manicure">✨ Manicure</option>
                <option value="Pedicure">🦶 Pedicure</option>
                <option value="Extension">💎 Extension</option>
                <option value="Removal">🫧 Removal (Pelepasan)</option>
                <option value="Press On">🎀 Press On Nails</option>
                <option value="Care & Spa">🌸 Care & Spa</option>
              </select>
            </div>
            <div class="form-group">
              <label for="svc-dur" class="form-label">
                <span>Estimasi Durasi</span>
                <span class="req-star">*</span>
              </label>
              <div class="input-addon-wrap">
                <input 
                  type="number" 
                  id="svc-dur" 
                  bind:value={serviceFormDuration} 
                  min="10" 
                  step="5" 
                  class="input-addon-field" 
                  required 
                />
                <span class="input-suffix">Menit</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="svc-price" class="form-label">
              <span>Tarif / Harga Studio</span>
              <span class="req-star">*</span>
            </label>
            <div class="input-addon-wrap">
              <span class="input-prefix">Rp</span>
              <input 
                type="number" 
                id="svc-price" 
                bind:value={serviceFormPrice} 
                min="0" 
                step="1000" 
                class="input-addon-field" 
                required 
              />
              <span class="input-suffix price-preview">
                = Rp {Number(serviceFormPrice || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <span class="form-hint">Tarif ini otomatis sinkron dengan katalog beranda dan form booking klien.</span>
          </div>

          <div class="form-group">
            <label for="svc-desc" class="form-label">
              <span>Deskripsi Layanan & Fasilitas</span>
            </label>
            <textarea 
              id="svc-desc" 
              bind:value={serviceFormDesc} 
              rows="3" 
              placeholder="Misal: Termasuk manicure rapi, buffing kutikula, vitamin kuku, dan finishing top coat glossy..." 
              class="form-textarea"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-modal-cancel" onclick={() => showServiceModal = false}>
              Batal
            </button>
            <button type="submit" class="btn-modal-submit">
              <span>{editingServiceId ? '💾 Simpan Perubahan' : '✨ Tambahkan Layanan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  </div>
{/if}

<style>
  .admin-wrap {
    max-width: 1100px;
    margin: 32px auto 60px;
    padding: 0 16px;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .admin-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--purple-soft);
    padding: 5px 12px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 750;
    color: var(--purple);
    margin-bottom: 6px;
  }
  .admin-title {
    font-size: 32px;
    font-weight: 800;
    color: var(--purple);
    margin-bottom: 4px;
  }
  .admin-sub {
    font-size: 13.5px;
    color: var(--text-muted);
  }
  .btn-refresh {
    background: var(--card);
    border: 1px solid var(--line);
    padding: 8px 16px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    color: var(--purple);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
  }

  .toast-message {
    background: var(--purple-soft);
    border: 1px solid var(--purple-border);
    color: var(--purple);
    padding: 10px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
  }
  .stat-icon {
    font-size: 28px;
  }
  .stat-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .stat-val {
    font-size: 24px;
    font-weight: 800;
    color: var(--purple);
  }

  /* Tab Bar */
  .tab-bar {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--line);
    margin-bottom: 24px;
  }
  .tab-btn {
    background: none;
    border: none;
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: 0.16s;
  }
  .tab-btn:hover {
    color: var(--purple);
  }
  .tab-btn.active {
    color: var(--purple);
    border-bottom-color: var(--purple);
  }

  .content-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .filter-group {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .filter-select {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: #fff;
    font-size: 13px;
  }

  /* Agenda Toolbar Right & Export Buttons */
  .agenda-toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .btn-export-agenda {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    color: var(--purple);
    border: 1px solid rgba(81, 72, 91, 0.25);
    padding: 6px 14px;
    font-size: 12.5px;
    font-weight: 700;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.16s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .btn-export-agenda:hover:not(:disabled) {
    background: var(--purple);
    color: #fff;
    border-color: var(--purple);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(81, 72, 91, 0.2);
  }
  .btn-export-agenda:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-buttons-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btn-export-excel {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #107c41, #15803d);
    color: #ffffff;
    border: none;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 750;
    border-radius: var(--radius-sm);
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(16, 124, 65, 0.28);
    transition: all 0.16s ease;
  }
  .btn-export-excel:hover:not(:disabled) {
    background: linear-gradient(135deg, #0e6b37, #166534);
    box-shadow: 0 5px 14px rgba(16, 124, 65, 0.4);
    transform: translateY(-1px);
  }
  .btn-export-excel:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn-export-excel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-export-csv-alt {
    display: inline-flex;
    align-items: center;
    background: #fff;
    color: var(--text-muted);
    border: 1px solid var(--line);
    padding: 9px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .btn-export-csv-alt:hover {
    color: var(--purple);
    border-color: var(--purple);
    background: var(--purple-soft);
  }

  /* Tables */
  .admin-table-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .table-scroll {
    overflow-x: auto;
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  .admin-table th {
    padding: 14px 16px;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    background: #faf8f6;
    border-bottom: 1px solid var(--line);
  }
  .admin-table td {
    padding: 14px 16px;
    font-size: 13px;
    border-bottom: 1px solid #f2eeed;
    vertical-align: middle;
  }
  .code-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 800;
    background: var(--purple-soft);
    color: var(--purple);
    padding: 2px 6px;
    border-radius: 4px;
    margin-bottom: 4px;
  }
  .cust-name {
    display: block;
    color: var(--purple);
    font-size: 14px;
  }
  .wa-link {
    color: var(--green);
    font-weight: 700;
  }
  .time-tag {
    font-size: 12px;
    color: var(--text-muted);
  }
  .services-mini {
    font-size: 12.5px;
    font-weight: 600;
  }
  .notes-mini {
    font-size: 11.5px;
    color: var(--text-muted);
  }

  /* Status Tags */
  .status-tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    font-size: 10.5px;
    font-weight: 750;
    text-transform: uppercase;
  }
  .status-tag.status-pending { background: #fef4e5; color: #b26b00; }
  .status-tag.status-confirmed { background: #e6f7ec; color: #206d39; }
  .status-tag.status-completed { background: #e6f3fb; color: #15629a; }
  .status-tag.status-cancelled { background: #f1f1f1; color: #777; }
  .status-tag.status-antri { background: #f8e8e8; color: #a83232; }
  .status-tag.status-progress { background: #fef7da; color: #8f7200; }
  .status-tag.status-ready_to_pick_up { background: #e6f3fb; color: #1a75b8; }
  .status-tag.status-sent { background: #e6f7ec; color: #2b7746; }

  .action-buttons {
    display: flex;
    gap: 6px;
  }
  .btn-act {
    border: none;
    padding: 5px 10px;
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-act.confirm { background: var(--green); color: #fff; }
  .btn-act.complete { background: var(--purple); color: #fff; }
  .btn-act.cancel { background: #fcefed; color: #a83232; }
  .btn-act.gcal {
    background: #eef3fc;
    color: #1a73e8;
    border: 1px solid #c7dcfa;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: 0.15s;
  }
  .btn-act.gcal:hover {
    background: #1a73e8;
    color: #ffffff;
  }

  /* Quick status in PON */
  .btn-add-pon {
    background: var(--purple);
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    font-size: 12.5px;
    font-weight: 750;
    cursor: pointer;
  }
  .quick-status-group {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: center;
  }
  .btn-status-pill {
    border: 1px solid var(--line);
    background: #fff;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-status-pill.active {
    border-color: var(--purple);
    background: var(--purple);
    color: #fff;
  }
  .btn-pon-gcal {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fef7e0;
    color: #b06000;
    border: 1px solid #f9e295;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 11px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: 0.15s;
  }
  .btn-pon-gcal:hover {
    background: #b06000;
    color: #ffffff;
  }

  /* Slot Block Form */
  .slot-block-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 28px;
  }
  .slot-block-card h3 {
    font-size: 20px;
    font-weight: 800;
    color: var(--purple);
    margin-bottom: 6px;
  }
  .sub-text {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }
  .block-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .form-input, .form-textarea {
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    font-size: 14px;
    background: #fff;
  }
  .btn-block-submit {
    background: var(--purple);
    color: #fff;
    border: none;
    padding: 12px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
    width: fit-content;
  }

  /* ===================================================
     ELEGANT BOUTIQUE MODALS (TAMBAH MENU & PESANAN PON)
     =================================================== */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(25, 20, 32, 0.65);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 20px;
  }
  .modal-card {
    background: #ffffff;
    border-radius: 20px;
    max-width: 520px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px -12px rgba(45, 35, 55, 0.38);
    border: 1px solid rgba(81, 72, 91, 0.14);
    overflow: hidden;
    animation: modalPop 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes modalPop {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: #faf8f5;
    border-bottom: 1px solid #efeae4;
  }
  .modal-title-group {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .modal-icon-badge {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--purple-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    border: 1px solid var(--purple-border);
  }
  .modal-icon-badge.pon-badge {
    background: #fdf2e9;
    border-color: #f7d5ba;
  }
  .modal-header h3 {
    font-size: 17px;
    font-weight: 800;
    color: var(--purple);
    margin: 0;
    line-height: 1.3;
  }
  .modal-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin: 3px 0 0;
    line-height: 1.4;
  }
  .btn-modal-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #ede8e3;
    border: none;
    font-size: 14px;
    color: #665f70;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.16s ease;
    flex-shrink: 0;
    margin-left: 10px;
  }
  .btn-modal-close:hover {
    background: var(--purple);
    color: #fff;
    transform: scale(1.08);
  }

  .modal-body {
    padding: 22px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Form Group & Standard Controls */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }
  .form-label {
    font-size: 12.5px;
    font-weight: 750;
    color: var(--purple);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .req-star {
    color: #d93838;
    font-size: 13px;
    font-weight: 800;
  }
  .form-hint {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.35;
    margin-top: 2px;
  }

  .form-input, .form-textarea, .form-select {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    border: 1.5px solid #e2ded8;
    border-radius: 10px;
    font-size: 13.5px;
    font-family: inherit;
    color: #2e2836;
    background: #faf9f7;
    transition: all 0.16s ease;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    background: #ffffff;
    border-color: var(--purple);
    box-shadow: 0 0 0 3px rgba(81, 72, 91, 0.12);
  }
  .form-textarea {
    resize: vertical;
    min-height: 75px;
    line-height: 1.5;
  }

  /* Input Addon Wrappers (Currency & Suffix) */
  .input-addon-wrap {
    display: flex;
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid #e2ded8;
    border-radius: 10px;
    background: #faf9f7;
    overflow: hidden;
    transition: all 0.16s ease;
  }
  .input-addon-wrap:focus-within {
    background: #ffffff;
    border-color: var(--purple);
    box-shadow: 0 0 0 3px rgba(81, 72, 91, 0.12);
  }
  .input-prefix {
    background: #f0ebe4;
    color: var(--purple);
    font-weight: 800;
    font-size: 13px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    border-right: 1.5px solid #e2ded8;
    user-select: none;
  }
  .input-suffix {
    background: #f0ebe4;
    color: var(--text-muted);
    font-weight: 650;
    font-size: 12.5px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    border-left: 1.5px solid #e2ded8;
    user-select: none;
  }
  .input-suffix.price-preview {
    font-weight: 750;
    color: #1e7039;
    font-size: 12px;
  }
  .input-addon-field {
    flex: 1;
    border: none;
    background: transparent;
    padding: 10px 14px;
    font-size: 13.5px;
    font-family: inherit;
    color: #2e2836;
    font-weight: 600;
    outline: none;
    width: 100%;
    min-width: 0;
  }

  /* Status Radio Cards for PON Modal */
  .pon-status-radios {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }
  .status-radio-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1.5px solid #e5dfd8;
    background: #faf9f7;
    cursor: pointer;
    transition: all 0.16s ease;
    user-select: none;
  }
  .status-radio-card input {
    display: none;
  }
  .status-radio-card .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #ccc;
    transition: all 0.16s ease;
    flex-shrink: 0;
  }
  .status-radio-card strong {
    display: block;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.2;
  }
  .status-radio-card small {
    display: block;
    font-size: 10.5px;
    color: var(--text-muted);
  }
  .status-radio-card.antri .dot { background: #e04c4c; border-color: #c93434; }
  .status-radio-card.progress .dot { background: #e8b004; border-color: #c49402; }
  .status-radio-card.ready .dot { background: #2087d6; border-color: #166cb0; }
  .status-radio-card.sent .dot { background: #22a053; border-color: #188040; }

  .status-radio-card:hover {
    border-color: var(--purple-border);
    background: #fff;
  }
  .status-radio-card.selected {
    border-color: var(--purple);
    background: var(--purple-soft);
    box-shadow: 0 2px 6px rgba(81, 72, 91, 0.12);
  }
  .status-radio-card.selected strong {
    color: var(--purple);
  }

  /* Modal Footer */
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px solid #f0ebe4;
  }
  .btn-modal-cancel {
    background: #fff;
    border: 1.5px solid #dbd4cc;
    color: #6a6270;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-modal-cancel:hover {
    background: #f5f1ea;
    color: var(--purple);
    border-color: #c9bfb4;
  }
  .btn-modal-submit {
    background: var(--purple);
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 750;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(81, 72, 91, 0.25);
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-modal-submit:hover {
    background: var(--purple-deep);
    transform: translateY(-1px);
    box-shadow: 0 5px 14px rgba(81, 72, 91, 0.35);
  }
  .btn-modal-submit:active {
    transform: translateY(0);
  }
  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
  }

  /* Admin Header Top Actions */
  .admin-top-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .btn-logout {
    background: #fff;
    color: var(--red);
    border: 1px solid rgba(224, 76, 76, 0.25);
    padding: 9px 18px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-logout:hover {
    background: #fff0f0;
    border-color: var(--red);
    transform: translateY(-1px);
  }

  /* Login Screen Styles */
  .login-wrapper {
    min-height: 75vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
  }
  .login-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 440px;
    width: 100%;
    padding: 44px 36px;
    text-align: center;
    position: relative;
  }
  .login-logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .login-logo {
    height: 48px;
    width: auto;
    object-fit: contain;
  }
  .login-badge {
    display: inline-block;
    background: var(--purple-soft);
    color: var(--purple);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.6px;
    padding: 5px 14px;
    border-radius: var(--radius-full);
    margin-bottom: 14px;
  }
  .login-title {
    font-family: var(--font-heading);
    font-size: 26px;
    color: var(--purple);
    margin-bottom: 8px;
  }
  .login-sub {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 24px;
  }
  .auth-error-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff0f0;
    border: 1px solid rgba(224, 76, 76, 0.3);
    color: var(--red);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    text-align: left;
    margin-bottom: 20px;
  }
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    text-align: left;
    margin-top: 4px;
  }
  .login-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  .login-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 750;
    color: var(--purple);
    letter-spacing: 0.1px;
  }
  .label-icon {
    font-size: 14px;
  }
  .login-input-wrap {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }
  .login-input {
    width: 100%;
    display: block;
    box-sizing: border-box;
    padding: 13px 16px;
    background: #ffffff;
    border: 1.5px solid #dfd8cf;
    border-radius: 12px;
    font-size: 14px;
    font-family: inherit;
    color: var(--text);
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
    outline: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .login-input:focus {
    border-color: var(--purple);
    background: #fffdf9;
    box-shadow: 0 0 0 3.5px rgba(81, 72, 91, 0.12);
  }
  .login-input::placeholder {
    color: #b0a89d;
    font-size: 13.5px;
  }
  .login-input-with-toggle {
    padding-right: 48px;
  }
  .btn-toggle-eye {
    position: absolute;
    right: 8px;
    background: transparent;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: transform 0.15s ease, background-color 0.15s ease;
  }
  .btn-toggle-eye:hover {
    background: rgba(81, 72, 91, 0.08);
    transform: scale(1.08);
  }
  .btn-login-submit {
    background: var(--purple);
    color: #fff;
    border: none;
    padding: 14px;
    border-radius: var(--radius-full);
    font-size: 14.5px;
    font-weight: 750;
    cursor: pointer;
    transition: var(--transition);
    margin-top: 8px;
    box-shadow: 0 4px 14px rgba(81, 72, 91, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn-login-submit:hover:not(:disabled) {
    background: var(--purple-deep);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(81, 72, 91, 0.35);
  }
  .btn-login-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .login-footer-hint {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px dashed var(--border-color);
  }
  .login-back-home {
    font-size: 12px;
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition);
  }
  .login-back-home:hover {
    color: var(--purple);
  }

  /* Export CSV Button */
  .btn-export-csv {
    background: var(--card-warm);
    color: var(--purple);
    border: 1.5px solid var(--purple-border);
    padding: 7px 14px;
    border-radius: var(--radius-full);
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-export-csv:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
    transform: translateY(-1px);
  }

  /* Google Calendar Sync Banner */
  .gcal-sync-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    background: linear-gradient(135deg, #eef4fe 0%, #f7f9ff 100%);
    border: 1.5px solid #d2e3fc;
    border-radius: var(--radius-md);
    padding: 16px 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(26, 115, 232, 0.08);
    flex-wrap: wrap;
  }
  .gcal-banner-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .gcal-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #c7dcfa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 2px 6px rgba(26, 115, 232, 0.12);
    flex-shrink: 0;
  }
  .gcal-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .gcal-badge {
    background: #1a73e8;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    letter-spacing: 0.05em;
  }
  .gcal-sub-tag {
    font-size: 11px;
    font-weight: 700;
    color: #185abc;
  }
  .gcal-title {
    font-size: 15px;
    font-weight: 800;
    color: #174ea6;
    margin: 0 0 2px;
  }
  .gcal-desc {
    font-size: 12.5px;
    color: #4a5568;
    margin: 0;
    max-width: 540px;
    line-height: 1.4;
  }
  .gcal-banner-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .btn-copy-feed {
    background: #1a73e8;
    color: #ffffff;
    border: none;
    padding: 9px 16px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 750;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(26, 115, 232, 0.25);
    transition: all 0.15s ease;
  }
  .btn-copy-feed:hover {
    background: #1557b0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.35);
  }
  .btn-open-gcal-settings {
    background: #ffffff;
    color: #1a73e8;
    border: 1px solid #c7dcfa;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .btn-open-gcal-settings:hover {
    background: #f1f6fd;
    border-color: #1a73e8;
  }

  /* Agenda Harian Toolbar & Timeline */
  .agenda-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    background: var(--card-warm);
    border: 1px solid var(--line);
    padding: 14px 20px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
  }
  .agenda-date-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .btn-date-quick {
    background: #fff;
    border: 1px solid var(--line);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 650;
    color: var(--purple);
    cursor: pointer;
    transition: var(--transition);
  }
  .btn-date-quick.active, .btn-date-quick:hover {
    background: var(--purple);
    color: #fff;
    border-color: var(--purple);
  }
  .agenda-date-input {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    font-size: 13px;
    background: #fff;
    font-family: inherit;
    color: var(--purple);
  }
  .agenda-summary-tag {
    font-size: 13.5px;
    color: var(--text);
  }

  /* ===================================================
     LUXURY AGENDA HARIAN TIMELINE & SLOTS
     =================================================== */
  .agenda-timeline {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .agenda-slot-card {
    display: flex;
    align-items: stretch;
    background: #ffffff;
    border: 1px solid #e8e2da;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 3px 12px rgba(81, 72, 91, 0.05);
    transition: all 0.2s ease;
  }
  .agenda-slot-card:hover {
    border-color: #d5c8be;
    box-shadow: 0 6px 18px rgba(81, 72, 91, 0.08);
  }
  .agenda-slot-card.has-booking {
    border-left: 6px solid var(--purple);
    background: #ffffff;
  }

  /* Time Badge Pillar (Left) */
  .agenda-time-badge {
    width: 120px;
    min-width: 120px;
    background: #faf8f5;
    border-right: 1px solid #eee8e2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 18px 12px;
    gap: 4px;
    text-align: center;
    user-select: none;
  }
  .agenda-time-badge.booked {
    background: #f7f3f9;
    border-right-color: #ede4f0;
  }
  .clock-icon-wrap {
    font-size: 20px;
    line-height: 1;
    margin-bottom: 2px;
  }
  .time-main {
    font-size: 17px;
    font-weight: 850;
    color: var(--purple);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .time-zone {
    font-size: 10.5px;
    font-weight: 750;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }
  .slot-indicator {
    margin-top: 6px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: #e6f7ec;
    color: #1e7039;
  }
  .slot-indicator.occupied {
    background: var(--purple-soft);
    color: var(--purple);
  }

  /* Slot Body (Center & Right) */
  .agenda-slot-body {
    flex: 1;
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    min-width: 0;
  }

  /* Customer Details */
  .agenda-customer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 280px;
  }
  .agenda-customer-top {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cust-headline {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .cust-headline h4 {
    font-size: 16.5px;
    font-weight: 800;
    color: var(--purple);
    margin: 0;
  }
  .booking-code-chip {
    font-size: 11px;
    font-weight: 750;
    font-family: monospace;
    background: #f2edf5;
    color: var(--purple);
    padding: 2px 7px;
    border-radius: 6px;
    border: 1px solid rgba(81, 72, 91, 0.12);
  }
  .wa-badge-link {
    font-size: 12px;
    font-weight: 650;
    color: #15803d;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f0fdf4;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid #dcfce7;
    transition: all 0.15s ease;
  }
  .wa-badge-link:hover {
    background: #dcfce7;
  }

  /* Services List Pills */
  .agenda-services-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .service-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #faf8f5;
    color: var(--purple);
    border: 1px solid #eadecf;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
  }

  /* Notes & Inspo Box */
  .agenda-note-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: #fefbf3;
    border: 1px solid #f6ecdc;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: #6b5235;
    max-width: 600px;
  }
  .note-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* Action Buttons in Agenda */
  .agenda-slot-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .btn-agenda-wa {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #25d366;
    color: #ffffff;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 750;
    box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);
    transition: all 0.16s ease;
  }
  .btn-agenda-wa:hover {
    background: #1ebc59;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
  }
  .btn-agenda-gcal {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    color: #1a73e8;
    border: 1px solid #c7dcfa;
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 750;
    box-shadow: 0 2px 6px rgba(26, 115, 232, 0.12);
    transition: all 0.16s ease;
  }
  .btn-agenda-gcal:hover {
    background: #1a73e8;
    color: #ffffff;
    border-color: #1a73e8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);
  }
  .btn-agenda-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12.5px;
    font-weight: 750;
    cursor: pointer;
    border: none;
    transition: all 0.16s ease;
  }
  .btn-agenda-action.confirm {
    background: #15803d;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(21, 128, 61, 0.25);
  }
  .btn-agenda-action.confirm:hover {
    background: #166534;
    transform: translateY(-1px);
  }
  .btn-agenda-action.complete {
    background: var(--purple);
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(81, 72, 91, 0.25);
  }
  .btn-agenda-action.complete:hover {
    background: var(--purple-deep);
    transform: translateY(-1px);
  }
  .btn-agenda-action.cancel {
    background: #fff;
    color: #c93434;
    border: 1px solid rgba(201, 52, 52, 0.25);
  }
  .btn-agenda-action.cancel:hover {
    background: #fdf0f0;
    border-color: #c93434;
  }

  /* Empty Slot Luxury Styling */
  .agenda-empty-slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-wrap: wrap;
    gap: 12px;
  }
  .empty-slot-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .empty-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
    flex-shrink: 0;
  }
  .empty-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .empty-text-wrap strong {
    font-size: 13.5px;
    color: #166534;
    font-weight: 750;
  }
  .empty-text-wrap small {
    font-size: 12px;
    color: var(--text-muted);
  }
  .btn-book-slot-link {
    font-size: 12.5px;
    color: var(--purple);
    background: #fff;
    border: 1.5px dashed rgba(81, 72, 91, 0.4);
    padding: 7px 14px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
    transition: all 0.16s ease;
  }
  .btn-book-slot-link:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
    transform: translateY(-1px);
  }

  /* Services Table & Styling */
  .section-subtitle {
    font-size: 18px;
    font-weight: 800;
    color: var(--purple);
  }
  .section-desc {
    font-size: 12.5px;
    color: var(--text-muted);
    margin-top: 2px;
  }
  .btn-add-service {
    background: var(--purple);
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
  }
  .btn-add-service:hover {
    background: var(--purple-deep);
    transform: translateY(-1px);
  }
  .service-name-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .category-tag {
    font-size: 10.5px;
    background: var(--purple-soft);
    color: var(--purple);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    width: fit-content;
    font-weight: 700;
  }
  .price-highlight {
    color: #277747;
    font-size: 14.5px;
  }
  .desc-cell {
    max-width: 280px;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.4;
  }
  .btn-edit-sm {
    background: var(--purple-soft);
    border: 1px solid var(--purple-border);
    color: var(--purple);
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
  }
  .btn-edit-sm:hover {
    background: var(--purple);
    color: #fff;
  }
  .btn-del-sm {
    background: #fff;
    border: 1px solid rgba(224, 76, 76, 0.3);
    color: var(--red);
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
  }
  .btn-del-sm:hover {
    background: #fff0f0;
  }

  /* ===================================================
     SEARCH BARS & EMPTY SEARCH STATES
     =================================================== */
  .head-left-group {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .head-left-group h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: var(--purple);
  }

  .admin-search-box {
    position: relative;
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1.5px solid #dfd8cf;
    border-radius: var(--radius-full);
    padding: 0 12px;
    min-width: 270px;
    max-width: 380px;
    transition: all 0.18s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .admin-search-box:focus-within {
    border-color: var(--purple);
    background: #fffdf9;
    box-shadow: 0 0 0 3px rgba(81, 72, 91, 0.12);
  }
  .admin-search-box.agenda-search {
    flex: 1;
    min-width: 250px;
    max-width: 360px;
  }
  .search-icon {
    font-size: 13px;
    margin-right: 6px;
    opacity: 0.65;
    user-select: none;
  }
  .admin-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 7px 0;
    font-size: 12.5px;
    font-family: inherit;
    color: #2e2836;
    outline: none;
    min-width: 0;
  }
  .admin-search-input::placeholder {
    color: #a8a096;
    font-size: 12px;
  }
  .btn-clear-search {
    background: #eee8e0;
    border: none;
    color: #6a6270;
    font-size: 11px;
    font-weight: 800;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: 6px;
    transition: all 0.14s ease;
  }
  .btn-clear-search:hover {
    background: var(--purple);
    color: #ffffff;
  }

  /* Empty Search State */
  .empty-search-state {
    background: #ffffff;
    border: 1.5px dashed #dfd8cf;
    border-radius: 16px;
    padding: 36px 20px;
    text-align: center;
    color: var(--text);
  }
  .empty-search-icon {
    font-size: 32px;
    margin-bottom: 10px;
  }
  .empty-search-state h4 {
    font-size: 16px;
    font-weight: 800;
    color: var(--purple);
    margin: 0 0 8px 0;
  }
  .empty-search-state p {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 0 0 16px 0;
  }
  .other-dates-hint {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--purple-soft);
    border: 1px solid var(--purple-border);
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12.5px;
    color: var(--purple);
    margin-bottom: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn-switch-search-tab {
    background: var(--purple);
    color: #ffffff;
    border: none;
    padding: 4px 10px;
    font-size: 11.5px;
    font-weight: 750;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .btn-switch-search-tab:hover {
    background: var(--purple-deep);
    transform: translateY(-1px);
  }
  .btn-reset-search {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    border: 1.5px solid #d5cbbf;
    color: var(--purple);
    font-size: 12.5px;
    font-weight: 750;
    padding: 7px 16px;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .btn-reset-search:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
    transform: translateY(-1px);
  }
</style>
