<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let services = $state([]);
  let loadingServices = $state(true);

  const fallbackServices = [
    {
      id: 1,
      name: "Nail art di kuku asli",
      category: "Nail Art",
      price: 75000,
      estimated_duration_min: 90,
      description: "Manicure lengkap, pembersihan kutikula, buffing, base gel kuat, dan motif nail art aesthetic manis di kuku asli.",
      badge: "Best Seller ✨"
    },
    {
      id: 2,
      name: "Tambah extension",
      category: "Extension",
      price: 50000,
      estimated_duration_min: 60,
      description: "Perpanjangan kuku ekstra cantik dengan soft gel tip atau polygel yang kokoh, rapi, dan natural.",
      badge: "Popular 🔥"
    },
    {
      id: 3,
      name: "Remove ext",
      category: "Removal",
      price: 30000,
      estimated_duration_min: 45,
      description: "Pelepasan extension lama secara aman dan hati-hati tanpa merusak lempeng kuku asli.",
      badge: "Care"
    },
    {
      id: 4,
      name: "Remove nail gel",
      category: "Removal",
      price: 20000,
      estimated_duration_min: 30,
      description: "Pembersihan kutek gel lama dengan soaking lembut dan peremajaan minyak kutikula.",
      badge: "Cleanse"
    },
    {
      id: 5,
      name: "Pasang press on nails",
      category: "Press On",
      price: 25000,
      estimated_duration_min: 40,
      description: "Pemasangan kuku palsu (PON) custom dengan perekat gel tahan air yang rapi dan nyaman.",
      badge: "Fast & Cute 💅"
    }
  ];

  onMount(async () => {
    try {
      const res = await api.getServices();
      if (res && res.success && res.data && res.data.length > 0) {
        services = res.data;
      } else {
        services = fallbackServices;
      }
    } catch (e) {
      services = fallbackServices;
    } finally {
      loadingServices = false;
    }
  });

  function formatPrice(val) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  }
</script>

<svelte:head>
  <title>Petite Girl Nails — Aesthetic Nail Art & Booking Studio Bantul Yogyakarta</title>
  <meta name="description" content="Petite Girl Nails - Studio nail art & press on nails aesthetic di Sewon, Bantul, Yogyakarta. Cek jadwal ketersediaan dan booking janji temu kuku cantikmu di sini." />
</svelte:head>

<!-- Hero Section -->
<section class="hero-section">
  <div class="hero-card">
    <div class="brand-badge">
      <div class="brand-trio">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </div>
      <span>EST. 2025 • SEWON BANTUL</span>
    </div>

    <div class="hero-logo-box">
      <img src="/logo.png" alt="Petite Girl Nails Logo" class="hero-logo" />
    </div>

    <h1 class="hero-title">petite girl nails</h1>
    <p class="hero-subtitle">"Silahkan diisi ya bestiee ✨"</p>
    <p class="hero-desc">
      Cek jadwal kosong studio secara real-time, lakukan reservasi janji temu manicure & nail art, atau pantau status pengerjaan kuku palsu (Press On Nails) custom kamu di satu tempat.
    </p>

    <div class="hero-actions">
      <a href="/availability" class="btn-primary">
        <span class="icon">📅</span>
        <span>Cek Jadwal Studio</span>
      </a>
      <a href="/book" class="btn-secondary">
        <span class="icon">💅</span>
        <span>Booking Janji Temu</span>
      </a>
      <a href="/pon-tracking" class="btn-outline">
        <span class="icon">📦</span>
        <span>Lacak Order PON</span>
      </a>
    </div>

    <!-- Quick highlights -->
    <div class="hero-stats">
      <div class="stat-item">
        <span class="stat-num">5</span>
        <span class="stat-lbl">Slot Jam Harian</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">100%</span>
        <span class="stat-lbl">Steril & Higienis</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">Custom</span>
        <span class="stat-lbl">Desain Inspo Bebas</span>
      </div>
    </div>
  </div>
</section>

<!-- Services Catalogue Section -->
<section class="section-wrap">
  <div class="section-header">
    <div class="eyebrow">DAFTAR MENU & LAYANAN</div>
    <h2 class="section-title">Pilihan Treatment Kuku Cantik</h2>
    <p class="section-sub">Bisa pilih lebih dari satu layanan saat reservasi sesuai kondisi kuku bestie.</p>
  </div>

  <div class="services-grid">
    {#each services as item}
      <div class="service-card">
        <div class="service-top">
          <span class="service-cat">{item.category}</span>
          <span class="service-dur">⏱️ {item.estimated_duration_min} mnt</span>
        </div>
        <h3 class="service-name">{item.name}</h3>
        <p class="service-desc">{item.description}</p>
        <div class="service-bottom">
          <div class="service-price">{formatPrice(item.price)}</div>
          <a href="/book?service={encodeURIComponent(item.name)}" class="btn-book-sm">
            Pilih Ini &rarr;
          </a>
        </div>
      </div>
    {/each}
  </div>
</section>

<!-- Studio Rules & Information -->
<section class="section-wrap">
  <div class="rules-card">
    <div class="rules-head">
      <div class="brand-trio">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </div>
      <h3>Studio Rules & Informasi Booking</h3>
    </div>
    <div class="rules-grid">
      <div class="rule-item">
        <div class="rule-icon">⏰</div>
        <div>
          <h4>Toleransi Keterlambatan</h4>
          <p>Maksimal keterlambatan 15 menit dari jam yang dibooking agar jadwal bestie berikutnya tidak tergeser.</p>
        </div>
      </div>
      <div class="rule-item">
        <div class="rule-icon">🎨</div>
        <div>
          <h4>Kirim Desain Inspo</h4>
          <p>Bawa foto referensi kuku impianmu atau kirim langsung ke WhatsApp studio untuk konsultasi motif & aksesoris.</p>
        </div>
      </div>
      <div class="rule-item">
        <div class="rule-icon">💬</div>
        <div>
          <h4>Konfirmasi WhatsApp</h4>
          <p>Setelah mengisi form booking, harap langsung kirimkan pesan konfirmasi yang sudah disiapkan ke WhatsApp studio.</p>
        </div>
      </div>
      <div class="rule-item">
        <div class="rule-icon">💅</div>
        <div>
          <h4>Press On Nails Custom</h4>
          <p>Bisa request ukuran kuku, bentuk (almond, coffin, square), dan motif untuk dikirim atau diambil di studio.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Location & Contact Map Section -->
<section class="section-wrap">
  <div class="location-card">
    <div class="location-content">
      <div class="eyebrow">LOKASI STUDIO KAMI</div>
      <h2 class="location-title">Kunjungi Petite Girl Nails</h2>
      <p class="location-address">
        📍 <strong>Jl. Gabusan No.120, RT.08</strong>, Gabusan, Timbulharjo, Kec. Sewon, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55188
      </p>
      <div class="location-details">
        <div class="loc-badge">🕐 <strong>Jam Buka:</strong> 10.00 - 22.00 WIB</div>
        <div class="loc-badge">🅿️ Parkir Motor & Mobil Nyaman</div>
        <div class="loc-badge">❄️ Ruangan Ber-AC & Cozy</div>
      </div>
      <div class="location-buttons">
        <a href="https://maps.app.goo.gl/Z18udNHLahhP1ehv5" target="_blank" rel="noopener noreferrer" class="btn-maps">
          🗺️ Buka di Google Maps
        </a>
        <a href="https://wa.me/6285179968311" target="_blank" rel="noopener noreferrer" class="btn-wa-alt">
          📱 WhatsApp: 0851-7996-8311
        </a>
      </div>
    </div>
    <div class="location-visual">
      <div class="map-placeholder">
        <div class="map-inner">
          <div class="pin">📍</div>
          <div class="map-label">
            <strong>Petite Girl Nails</strong><br>
            <span>Gabusan, Sewon, Bantul</span>
          </div>
          <a href="https://maps.app.goo.gl/Z18udNHLahhP1ehv5" target="_blank" rel="noopener noreferrer" class="map-overlay-btn">
            Petunjuk Arah &rarr;
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* Hero */
  .hero-section {
    max-width: 960px;
    margin: 32px auto 48px;
    padding: 0 16px;
  }
  .hero-card {
    position: relative;
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 50px 32px 42px;
    text-align: center;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .hero-card::before {
    content: "";
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(243, 161, 141, 0.15);
    top: -50px;
    right: -40px;
    pointer-events: none;
  }
  .hero-card::after {
    content: "";
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(118, 200, 225, 0.14);
    bottom: -40px;
    left: -30px;
    pointer-events: none;
  }

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--purple-soft);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--purple);
    margin-bottom: 20px;
  }

  .hero-logo-box {
    margin-bottom: 14px;
  }
  .hero-logo {
    width: 110px;
    height: 110px;
    object-fit: contain;
    border-radius: 24px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(81, 72, 91, 0.1);
    transition: transform 0.3s ease;
  }
  .hero-logo:hover {
    transform: scale(1.04) rotate(-2deg);
  }

  .hero-title {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--purple);
    line-height: 1;
    margin-bottom: 8px;
  }
  .hero-subtitle {
    font-family: var(--font-serif);
    font-size: 20px;
    font-style: italic;
    color: var(--coral);
    margin-bottom: 16px;
  }
  .hero-desc {
    max-width: 600px;
    margin: 0 auto 32px;
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.65;
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .btn-primary, .btn-secondary, .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 13px 24px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 700;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .btn-primary {
    background: var(--purple);
    color: #fffdf9;
    box-shadow: 0 6px 20px rgba(81, 72, 91, 0.2);
  }
  .btn-primary:hover {
    background: var(--purple-hover);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(81, 72, 91, 0.28);
  }
  .btn-secondary {
    background: var(--yellow);
    color: var(--purple);
    border: 1px solid var(--yellow-border);
  }
  .btn-secondary:hover {
    background: #e6d13a;
    transform: translateY(-2px);
  }
  .btn-outline {
    background: var(--card);
    border: 1px solid var(--line-strong);
    color: var(--purple);
  }
  .btn-outline:hover {
    background: var(--purple-soft);
    border-color: var(--purple-border);
    transform: translateY(-2px);
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    padding-top: 24px;
    border-top: 1px dashed var(--line);
    flex-wrap: wrap;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .stat-num {
    font-size: 22px;
    font-weight: 800;
    color: var(--purple);
  }
  .stat-lbl {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .stat-divider {
    width: 1px;
    height: 28px;
    background: var(--line);
  }

  /* Section Common */
  .section-wrap {
    max-width: 1100px;
    margin: 0 auto 60px;
    padding: 0 16px;
  }
  .section-header {
    text-align: center;
    margin-bottom: 32px;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--purple);
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .section-title {
    font-size: 30px;
    font-weight: 800;
    color: var(--purple);
    letter-spacing: -0.03em;
    margin-bottom: 8px;
  }
  .section-sub {
    font-size: 14px;
    color: var(--text-muted);
  }

  /* Services Grid */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 20px;
  }
  .service-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.22s ease;
    box-shadow: var(--shadow-sm);
  }
  .service-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--purple-border);
  }
  .service-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .service-cat {
    font-size: 11px;
    font-weight: 700;
    color: var(--purple);
    background: var(--purple-soft);
    padding: 4px 10px;
    border-radius: var(--radius-full);
  }
  .service-dur {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
  }
  .service-name {
    font-size: 18px;
    font-weight: 750;
    color: var(--purple);
    margin-bottom: 8px;
  }
  .service-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.55;
    margin-bottom: 20px;
    flex: 1;
  }
  .service-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px dashed var(--line);
  }
  .service-price {
    font-size: 18px;
    font-weight: 800;
    color: var(--green);
  }
  .btn-book-sm {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--purple);
    background: var(--card);
    border: 1px solid var(--purple-border);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    transition: 0.15s;
  }
  .btn-book-sm:hover {
    background: var(--purple);
    color: #fffdf9;
  }

  /* Rules Card */
  .rules-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 36px 30px;
    box-shadow: var(--shadow-sm);
  }
  .rules-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }
  .rules-head h3 {
    font-size: 20px;
    font-weight: 800;
    color: var(--purple);
  }
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
  }
  .rule-item {
    display: flex;
    gap: 14px;
  }
  .rule-icon {
    font-size: 26px;
    line-height: 1;
  }
  .rule-item h4 {
    font-size: 14.5px;
    font-weight: 750;
    color: var(--purple);
    margin-bottom: 4px;
  }
  .rule-item p {
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* Location Card */
  .location-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    padding: 36px;
    box-shadow: var(--shadow-md);
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 36px;
    align-items: center;
  }
  .location-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--purple);
    margin-bottom: 12px;
  }
  .location-address {
    font-size: 14px;
    color: var(--text);
    line-height: 1.6;
    margin-bottom: 18px;
  }
  .location-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }
  .loc-badge {
    background: var(--purple-soft);
    font-size: 12px;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    color: var(--purple);
  }
  .location-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .btn-maps {
    background: var(--purple);
    color: #fffdf9;
    padding: 10px 20px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    transition: 0.15s;
  }
  .btn-maps:hover {
    background: var(--purple-hover);
  }
  .btn-wa-alt {
    background: var(--green-soft);
    color: var(--green);
    border: 1px solid var(--green-border);
    padding: 10px 20px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    transition: 0.15s;
  }
  .btn-wa-alt:hover {
    background: #dff0e6;
  }

  .map-placeholder {
    background: linear-gradient(135deg, #eef4f7, #fdf4f0);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 220px;
  }
  .map-inner .pin {
    font-size: 36px;
    margin-bottom: 8px;
    animation: pulseGlow 2s infinite ease-in-out;
  }
  .map-label {
    font-size: 14px;
    color: var(--purple);
    margin-bottom: 14px;
  }
  .map-label span {
    font-size: 12px;
    color: var(--text-muted);
  }
  .map-overlay-btn {
    display: inline-block;
    background: #fff;
    border: 1px solid var(--purple-border);
    color: var(--purple);
    padding: 7px 16px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 700;
    box-shadow: var(--shadow-sm);
  }
  .map-overlay-btn:hover {
    background: var(--purple-soft);
  }

  @media (max-width: 768px) {
    .hero-title { font-size: 32px; }
    .location-card { grid-template-columns: 1fr; }
  }
</style>
