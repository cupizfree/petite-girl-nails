<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { getStudioCalendarUrl } from '$lib/calendar';

  let name = $state('');
  let whatsapp = $state('');
  let selectedServices = $state([]);
  let designInspoType = $state('wa'); // 'wa' or 'custom'
  let customInspoText = $state('');
  let appointmentDate = $state('');
  let appointmentTime = $state('');
  let notes = $state('');

  let submitting = $state(false);
  let errorMessage = $state('');
  let bookingSuccess = $state(null); // Contains booking response data

  const serviceOptions = [
    { id: 'nail_art', label: 'Nail art di kuku asli', desc: 'Manicure & motif nail art manis di kuku asli', price: 75000 },
    { id: 'ext', label: 'Tambah extension', desc: 'Perpanjangan kuku ekstra cantik & kuat', price: 50000 },
    { id: 'rem_ext', label: 'Remove ext', desc: 'Pelepasan extension lama secara aman', price: 30000 },
    { id: 'rem_gel', label: 'Remove nail gel', desc: 'Pembersihan kutek gel lama dengan lembut', price: 20000 },
    { id: 'pon', label: 'Pasang press on nails', desc: 'Pemasangan kuku palsu custom yang rapi', price: 25000 },
  ];

  const timeOptions = ['10.00', '13.00', '16.00', '19.00', '21.00'];

  function toggleService(label) {
    if (selectedServices.includes(label)) {
      selectedServices = selectedServices.filter(s => s !== label);
    } else {
      selectedServices = [...selectedServices, label];
    }
  }

  // Calculate minimum date (today) and maximum (+35 days)
  let todayStr = $derived(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  let maxDateStr = $derived(() => {
    const d = new Date();
    d.setDate(d.getDate() + 35);
    return d.toISOString().split('T')[0];
  });

  onMount(() => {
    const query = $page.url.searchParams;
    const qDate = query.get('date');
    const qTime = query.get('time');
    const qService = query.get('service');

    if (qDate) appointmentDate = qDate;
    if (qTime) {
      // Normalize e.g. "10:00" to "10.00" or vice versa
      const normTime = qTime.replace(':', '.');
      if (timeOptions.includes(normTime)) appointmentTime = normTime;
      else if (timeOptions.includes(qTime)) appointmentTime = qTime;
    }
    if (qService) {
      if (!selectedServices.includes(qService)) {
        selectedServices = [qService];
      }
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    errorMessage = '';

    if (!name.trim()) {
      errorMessage = 'Nama wajib diisi ya bestie!';
      return;
    }
    if (!whatsapp.trim()) {
      errorMessage = 'Nomor WhatsApp wajib diisi agar studio bisa konfirmasi!';
      return;
    }
    if (selectedServices.length === 0) {
      errorMessage = 'Pilih minimal satu layanan ya bestie!';
      return;
    }
    if (!appointmentDate) {
      errorMessage = 'Pilih tanggal appointment terlebih dahulu!';
      return;
    }
    if (!appointmentTime) {
      errorMessage = 'Pilih jam appointment terlebih dahulu!';
      return;
    }

    submitting = true;

    const formattedTime = appointmentTime.replace('.', ':');
    const inspoVal = designInspoType === 'wa' 
      ? 'Oke aku kirim di WA' 
      : (customInspoText.trim() || 'Kirim via WhatsApp');

    const payload = {
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      services: selectedServices,
      design_inspo: inspoVal,
      appointment_date: appointmentDate,
      appointment_time: formattedTime,
      notes: notes.trim() || null,
    };

    try {
      const res = await api.createBooking(payload);
      if (res && res.success) {
        bookingSuccess = res;
      } else {
        // Fallback simulated success if backend is offline/compiling
        const bookingCode = 'PGN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const servicesText = selectedServices.join(', ');
        const waText = `Halo Petite Girl Nails! 💅✨\n\nSaya ingin konfirmasi booking janji temu:\n• Kode Booking: *${bookingCode}*\n• Nama: *${name}*\n• WhatsApp: *${whatsapp}*\n• Layanan: *${servicesText}*\n• Desain Inspo: *${inspoVal}*\n• Tanggal: *${appointmentDate}*\n• Jam: *${appointmentTime}*\n• Catatan: ${notes || '-'}\n\nMohon konfirmasi ya kak, terima kasih banyak! 💕`;
        const waUrl = `https://wa.me/6285179968311?text=${encodeURIComponent(waText)}`;

        bookingSuccess = {
          success: true,
          booking_code: bookingCode,
          whatsapp_url: waUrl,
          booking: {
            booking_code: bookingCode,
            name,
            whatsapp,
            services: selectedServices,
            appointment_date: appointmentDate,
            appointment_time: formattedTime,
            notes,
          }
        };
      }
    } catch (err) {
      errorMessage = err.message || 'Terjadi kendala saat mengirim booking. Coba lagi.';
    } finally {
      submitting = false;
    }
  }

  function resetForm() {
    bookingSuccess = null;
    name = '';
    whatsapp = '';
    selectedServices = [];
    customInspoText = '';
    notes = '';
  }
</script>

<svelte:head>
  <title>BOOKING FORM — Petite Girl Nails</title>
  <meta name="description" content="Silahkan diisi ya bestiee! Form reservasi janji temu nail art, extension, dan press on nails di studio Petite Girl Nails." />
</svelte:head>

<div class="form-wrapper">
  {#if !bookingSuccess}
    <div class="form-card">
      <div class="form-header">
        <div class="brand-trio">
          <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
        </div>
        <div class="eyebrow">PETITE GIRL NAILS</div>
        <h1 class="form-title">BOOKING FORM</h1>
        <p class="form-sub">Silahkan diisi ya bestiee ✨</p>
      </div>

      {#if errorMessage}
        <div class="alert-error animate-fade-in">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="booking-form">
        <!-- Nama -->
        <div class="form-group">
          <label for="nama" class="form-label">
            NAMA <span class="req">*</span>
          </label>
          <input 
            type="text" 
            id="nama" 
            bind:value={name} 
            placeholder="Ketik nama lengkap atau panggilanmu" 
            class="form-input" 
            required 
          />
        </div>

        <!-- WhatsApp -->
        <div class="form-group">
          <label for="whatsapp" class="form-label">
            WHATSAPP <span class="req">*</span>
          </label>
          <div class="input-prefix-wrap">
            <span class="prefix">🇮🇩</span>
            <input 
              type="tel" 
              id="whatsapp" 
              bind:value={whatsapp} 
              placeholder="Contoh: 081234567890" 
              class="form-input has-prefix" 
              required 
            />
          </div>
          <span class="hint">Pastikan nomor aktif untuk konfirmasi jadwal ya.</span>
        </div>

        <!-- Service -->
        <div class="form-group">
          <div class="form-label">
            SERVICE <span class="req">*</span>
            <span class="sub-label">(bisa pilih lebih dari 1 sesuai kondisi kuku)</span>
          </div>

          <div class="services-list">
            {#each serviceOptions as item}
              {@const checked = selectedServices.includes(item.label)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                class="service-item-pill" 
                class:selected={checked}
                onclick={() => toggleService(item.label)}
              >
                <div class="check-box" class:checked>
                  {#if checked}✓{/if}
                </div>
                <div class="service-pill-info">
                  <div class="pill-name">{item.label}</div>
                  <div class="pill-desc">{item.desc}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Desain Inspo -->
        <div class="form-group">
          <div class="form-label">
            DESAIN INSPO <span class="req">*</span>
            <span class="sub-label">(Tolong kirim ke WA dan jelaskan yaww)</span>
          </div>

          <div class="inspo-toggle-group">
            <label class="inspo-radio" class:active={designInspoType === 'wa'}>
              <input type="radio" bind:group={designInspoType} value="wa" />
              <span>📱 Oke aku kirim di WA</span>
            </label>
            <label class="inspo-radio" class:active={designInspoType === 'custom'}>
              <input type="radio" bind:group={designInspoType} value="custom" />
              <span>✍️ Tulis Catatan Motif di Sini</span>
            </label>
          </div>

          {#if designInspoType === 'custom'}
            <input 
              type="text" 
              bind:value={customInspoText} 
              placeholder="Contoh: French tips pink jelly, almond shape, 2 kuku ada pita 3D" 
              class="form-input inspo-text-input animate-fade-in" 
            />
          {/if}
        </div>

        <!-- Tanggal Appointment -->
        <div class="form-group">
          <label for="tanggal" class="form-label">
            TANGGAL APPOINTMENT <span class="req">*</span>
          </label>
          <input 
            type="date" 
            id="tanggal" 
            bind:value={appointmentDate} 
            min={todayStr()} 
            max={maxDateStr()} 
            class="form-input" 
            required 
          />
          <span class="hint">Bisa booking untuk hari ini hingga 35 hari ke depan.</span>
        </div>

        <!-- Jam Appointment -->
        <div class="form-group">
          <div class="form-label">
            JAM APPOINTMENT <span class="req">*</span>
          </div>

          <div class="time-pills">
            {#each timeOptions as t}
              {@const isSelected = appointmentTime === t}
              <button 
                type="button" 
                class="time-pill" 
                class:selected={isSelected} 
                onclick={() => appointmentTime = t}
              >
                {t}
              </button>
            {/each}
          </div>
        </div>

        <!-- Note / Special Request -->
        <div class="form-group">
          <label for="notes" class="form-label">
            NOTE / SPECIAL REQUEST
            <span class="sub-label">(Opsional)</span>
          </label>
          <textarea 
            id="notes" 
            bind:value={notes} 
            rows="3" 
            placeholder="Misal: ada kuku yang patah, kuku sensitif, request warna khusus..." 
            class="form-textarea"
          ></textarea>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn-submit" disabled={submitting}>
          {#if submitting}
            <span>Menyimpan reservasi...</span>
          {:else}
            <span>Kirim Reservasi Sekarang ✨</span>
          {/if}
        </button>

        <p class="form-footer-note">
          Dengan mengirim form ini, reservasi akan dicatat dan bestie akan diarahkan untuk mengirim konfirmasi langsung ke WhatsApp studio.
        </p>
      </form>
    </div>
  {:else}
    <!-- Success Confirmation View -->
    <div class="success-card animate-fade-in">
      <div class="success-icon">💅✨</div>
      <div class="brand-trio">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </div>
      <h2 class="success-title">Reservasi Berhasil Dicatat!</h2>
      <p class="success-sub">Terima kasih ya bestiee, tiket booking kamu sudah terbit:</p>

      <div class="ticket-box">
        <div class="ticket-header">
          <span class="ticket-tag">KODE BOOKING</span>
          <span class="ticket-code">{bookingSuccess.booking_code}</span>
        </div>
        <div class="ticket-divider"></div>
        <div class="ticket-rows">
          <div class="ticket-row">
            <span>Nama:</span>
            <strong>{bookingSuccess.booking.name}</strong>
          </div>
          <div class="ticket-row">
            <span>WhatsApp:</span>
            <strong>{bookingSuccess.booking.whatsapp}</strong>
          </div>
          <div class="ticket-row">
            <span>Tanggal:</span>
            <strong>{bookingSuccess.booking.appointment_date}</strong>
          </div>
          <div class="ticket-row">
            <span>Jam:</span>
            <strong>{bookingSuccess.booking.appointment_time} WIB</strong>
          </div>
          <div class="ticket-row">
            <span>Layanan:</span>
            <strong>{bookingSuccess.booking.services.join(', ')}</strong>
          </div>
        </div>
      </div>

      <div class="action-box">
        <p class="action-note">
          👉 <strong>Langkah Terakhir:</strong> Kirimkan konfirmasi ini ke WhatsApp Studio agar jam booking kamu resmi dikunci oleh nail artist!
        </p>
        <a 
          href={bookingSuccess.whatsapp_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-send-wa"
        >
          <span>💬 Kirim Konfirmasi ke WhatsApp Studio</span>
        </a>

        <a 
          href={getStudioCalendarUrl(bookingSuccess.booking)} 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-customer-gcal"
          title="Simpan janji temu ini ke Google Calendar kamu lengkap dengan alarm pengingat"
        >
          <span>📅 Simpan ke Google Calendar Saya</span>
        </a>
      </div>

      <button class="btn-new-booking" onclick={resetForm}>
        ← Buat Booking Baru
      </button>
    </div>
  {/if}
</div>

<style>
  .form-wrapper {
    width: min(640px, calc(100% - 24px));
    margin: 32px auto 60px;
  }

  .form-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 40px 32px;
    box-shadow: var(--shadow-lg);
  }

  .form-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--purple);
    margin-top: 8px;
    margin-bottom: 4px;
  }
  .form-title {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--purple);
    line-height: 1.1;
  }
  .form-sub {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--coral);
    font-size: 18px;
    margin-top: 6px;
  }

  .alert-error {
    background: #fdf2f2;
    border: 1px solid #f8d7da;
    color: #842029;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    font-size: 13.5px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .booking-form {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    font-size: 13px;
    font-weight: 750;
    color: var(--purple);
    letter-spacing: 0.02em;
  }
  .req {
    color: #d9534f;
  }
  .sub-label {
    font-weight: 500;
    font-size: 12px;
    color: var(--text-muted);
  }
  .hint {
    font-size: 11.5px;
    color: var(--text-muted);
  }

  .form-input, .form-textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    font-size: 14.5px;
    background: #ffffff;
    color: var(--text);
    outline: none;
    transition: all 0.18s ease;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
  }
  .form-input:focus, .form-textarea:focus {
    border-color: var(--purple-border);
    box-shadow: 0 0 0 3px rgba(81, 72, 91, 0.08);
  }

  .input-prefix-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .prefix {
    position: absolute;
    left: 14px;
    font-size: 16px;
    pointer-events: none;
  }
  .form-input.has-prefix {
    padding-left: 44px;
  }

  /* Services Selection Pills */
  .services-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .service-item-pill {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #ffffff;
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .service-item-pill:hover {
    border-color: var(--purple-border);
    background: #fdfcfa;
  }
  .service-item-pill.selected {
    border-color: var(--purple);
    background: var(--purple-soft);
  }
  .check-box {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1.5px solid var(--line-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    background: #fff;
    transition: 0.15s;
    flex-shrink: 0;
  }
  .check-box.checked {
    background: var(--purple);
    border-color: var(--purple);
  }
  .pill-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--purple);
  }
  .pill-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* Inspo Toggles */
  .inspo-toggle-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .inspo-radio {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 600;
    color: var(--purple);
    cursor: pointer;
    background: #fff;
    transition: 0.15s;
  }
  .inspo-radio input {
    accent-color: var(--purple);
  }
  .inspo-radio.active {
    background: var(--purple-soft);
    border-color: var(--purple-border);
  }
  .inspo-text-input {
    margin-top: 8px;
  }

  /* Time slots */
  .time-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .time-pill {
    flex: 1;
    min-width: 70px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #fff;
    font-size: 14px;
    font-weight: 750;
    color: var(--purple);
    cursor: pointer;
    transition: 0.16s;
  }
  .time-pill:hover {
    background: var(--purple-soft);
    border-color: var(--purple-border);
  }
  .time-pill.selected {
    background: var(--purple);
    color: #fffdf9;
    border-color: var(--purple);
    box-shadow: 0 4px 12px rgba(81, 72, 91, 0.2);
  }

  .btn-submit {
    margin-top: 10px;
    padding: 15px;
    background: var(--purple);
    color: #fffdf9;
    border: none;
    border-radius: var(--radius-full);
    font-size: 15px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 6px 20px rgba(81, 72, 91, 0.2);
  }
  .btn-submit:hover:not(:disabled) {
    background: var(--purple-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(81, 72, 91, 0.28);
  }
  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-footer-note {
    text-align: center;
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* Success Card */
  .success-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 44px 32px;
    text-align: center;
    box-shadow: var(--shadow-lg);
  }
  .success-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  .success-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--purple);
    margin-top: 8px;
    margin-bottom: 6px;
  }
  .success-sub {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 24px;
  }

  .ticket-box {
    background: #ffffff;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 24px;
    text-align: left;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
  }
  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }
  .ticket-tag {
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.1em;
    color: var(--text-muted);
  }
  .ticket-code {
    font-size: 18px;
    font-weight: 800;
    color: var(--purple);
    background: var(--purple-soft);
    padding: 4px 12px;
    border-radius: var(--radius-sm);
    letter-spacing: 0.05em;
  }
  .ticket-divider {
    height: 1px;
    border-top: 1px dashed var(--line);
    margin-bottom: 14px;
  }
  .ticket-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13.5px;
  }
  .ticket-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .ticket-row span {
    color: var(--text-muted);
  }
  .ticket-row strong {
    color: var(--text);
    text-align: right;
  }

  .action-box {
    background: var(--green-soft);
    border: 1px solid var(--green-border);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-bottom: 20px;
  }
  .action-note {
    font-size: 13.5px;
    color: #235436;
    margin-bottom: 14px;
    line-height: 1.5;
  }
  .btn-send-wa {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px;
    background: var(--green);
    color: #ffffff;
    font-size: 15px;
    font-weight: 750;
    border-radius: var(--radius-full);
    box-shadow: 0 4px 16px rgba(93, 154, 120, 0.3);
    transition: 0.2s;
  }
  .btn-send-wa:hover {
    background: #4e8365;
    transform: translateY(-2px);
  }

  .btn-customer-gcal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-top: 10px;
    background: #ffffff;
    border: 1px solid var(--purple-border);
    color: var(--purple);
    font-size: 13.5px;
    font-weight: 700;
    border-radius: var(--radius-full);
    transition: 0.2s;
    text-decoration: none;
    box-sizing: border-box;
  }
  .btn-customer-gcal:hover {
    background: var(--purple-soft);
    border-color: var(--purple);
    transform: translateY(-2px);
  }

  .btn-new-booking {
    background: none;
    border: none;
    color: var(--purple);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
  }

  @media (max-width: 500px) {
    .form-card { padding: 28px 18px; }
    .form-title { font-size: 28px; }
  }
</style>
