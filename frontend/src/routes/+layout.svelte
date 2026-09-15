<script>
  import '../app.css';
  import { page } from '$app/stores';

  let { children } = $props();
  let currentPath = $derived($page.url.pathname);
  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<div class="site-container">
  <!-- Top Announcement Bar -->
  <div class="announcement-bar">
    <div class="announcement-inner">
      <span class="sparkle">✨</span>
      <span>Silahkan diisi ya bestiee! Jadwal Studio & Custom Press On Nails</span>
      <div class="brand-trio">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </div>
    </div>
  </div>

  <!-- Header Navigation -->
  <header class="header">
    <div class="header-inner">
      <a href="/" class="brand-logo-wrap" onclick={closeMobileMenu}>
        <img src="/logo.png" alt="Petite Girl Nails" class="logo-img" />
        <div class="brand-text">
          <div class="brand-title">petite girl nails</div>
          <div class="brand-sub">EST. 2025 • NAIL STUDIO</div>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="nav-links">
        <a href="/" class="nav-link" class:active={currentPath === '/'}>Home</a>
        <a href="/availability" class="nav-link" class:active={currentPath.startsWith('/availability')}>
          <span class="nav-indicator"></span>
          Jadwal Studio
        </a>
        <a href="/book" class="nav-link" class:active={currentPath.startsWith('/book')}>
          Booking Form
        </a>
        <a href="/pon-tracking" class="nav-link" class:active={currentPath.startsWith('/pon-tracking')}>
          Track PON
        </a>
      </nav>

      <!-- CTA -->
      <div class="header-actions">
        <a 
          href="https://wa.me/6285179968311?text=Halo%20Petite%20Girl%20Nails%2C%20mau%20tanya-tanya%20layanan%20kuku%20dong%20bestie%20%E2%9C%A8" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-wa"
        >
          <span class="wa-icon">💬</span>
          <span class="wa-label">Chat Studio</span>
        </a>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" onclick={toggleMobileMenu} aria-label="Toggle Navigation">
          <span class="bar" class:open={mobileMenuOpen}></span>
          <span class="bar" class:open={mobileMenuOpen}></span>
          <span class="bar" class:open={mobileMenuOpen}></span>
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown Menu -->
    {#if mobileMenuOpen}
      <div class="mobile-nav animate-fade-in">
        <a href="/" class="mobile-nav-link" class:active={currentPath === '/'} onclick={closeMobileMenu}>🏠 Home Studio</a>
        <a href="/availability" class="mobile-nav-link" class:active={currentPath.startsWith('/availability')} onclick={closeMobileMenu}>📅 Jadwal & Slot Kosong</a>
        <a href="/book" class="mobile-nav-link" class:active={currentPath.startsWith('/book')} onclick={closeMobileMenu}>💅 Booking Janji Temu</a>
        <a href="/pon-tracking" class="mobile-nav-link" class:active={currentPath.startsWith('/pon-tracking')} onclick={closeMobileMenu}>📦 Track Pesanan PON</a>
      </div>
    {/if}
  </header>

  <!-- Main Content Area -->
  <main class="main-content">
    {@render children()}
  </main>

  <!-- Global Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-col brand-col">
        <div class="footer-brand-row">
          <img src="/logo.png" alt="Petite Girl Nails Logo" class="footer-logo" />
          <div>
            <div class="footer-title">petite girl nails</div>
            <div class="brand-trio">
              <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
            </div>
          </div>
        </div>
        <p class="footer-desc">
          Studio nail art dan press on nails aesthetic di Sewon, Bantul, Yogyakarta. Merawat kuku kian cantik, bersih, dan berkarakter.
        </p>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Navigasi Cepat</h4>
        <ul class="footer-list">
          <li><a href="/availability">📅 Cek Jadwal Studio</a></li>
          <li><a href="/book">💅 Form Reservasi</a></li>
          <li><a href="/pon-tracking">📦 Lacak Pesanan Press On</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Lokasi & Kontak</h4>
        <p class="footer-contact">
          <strong>Alamat:</strong><br>
          Jl. Gabusan No.120, RT.08, Gabusan, Timbulharjo, Kec. Sewon, Bantul, D.I. Yogyakarta 55188
        </p>
        <div class="footer-buttons">
          <a href="https://maps.app.goo.gl/Z18udNHLahhP1ehv5" target="_blank" rel="noopener noreferrer" class="footer-badge-link">
            📍 Buka di Google Maps
          </a>
          <a href="https://wa.me/6285179968311" target="_blank" rel="noopener noreferrer" class="footer-badge-link wa">
            📱 WhatsApp: 0851-7996-8311
          </a>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="brand-trio" style="margin-bottom: 8px;">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </div>
      <p>© 2025–2026 Petite Girl Nails. Handcrafted with love for all the besties.</p>
    </div>
  </footer>
</div>

<style>
  .site-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* Top Bar */
  .announcement-bar {
    background: var(--purple);
    color: #fffdf9;
    font-size: 12px;
    font-weight: 600;
    padding: 7px 16px;
    text-align: center;
    letter-spacing: 0.02em;
  }
  .announcement-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Header */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 253, 249, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
    box-shadow: 0 4px 20px rgba(81, 72, 91, 0.03);
  }
  .header-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .brand-logo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(81, 72, 91, 0.08);
  }
  .brand-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--purple);
    line-height: 1.1;
  }
  .brand-sub {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--text-muted);
  }

  /* Nav Links */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav-link {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
    padding: 8px 14px;
    border-radius: var(--radius-full);
    transition: all 0.18s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav-link:hover {
    color: var(--purple);
    background: var(--purple-soft);
  }
  .nav-link.active {
    color: var(--purple);
    background: var(--purple-soft);
    font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--purple-border);
  }
  .nav-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    display: inline-block;
  }

  /* Header CTA */
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-wa {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--purple);
    color: #fffdf9;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(81, 72, 91, 0.15);
  }
  .btn-wa:hover {
    background: var(--purple-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(81, 72, 91, 0.22);
  }

  .mobile-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
  }
  .mobile-toggle .bar {
    width: 22px;
    height: 2px;
    background: var(--purple);
    border-radius: 2px;
    transition: 0.2s ease;
  }

  .mobile-nav {
    display: flex;
    flex-direction: column;
    padding: 12px 20px 20px;
    background: var(--card-warm);
    border-top: 1px solid var(--line);
  }
  .mobile-nav-link {
    padding: 12px 14px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 12px;
    color: var(--text);
  }
  .mobile-nav-link.active, .mobile-nav-link:hover {
    background: var(--purple-soft);
    color: var(--purple);
  }

  .main-content {
    flex: 1;
  }

  /* Footer */
  .footer {
    margin-top: 60px;
    background: var(--card-warm);
    border-top: 1px solid var(--line);
    padding: 50px 20px 30px;
  }
  .footer-inner {
    max-width: 1180px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.5fr 1fr 1.5fr;
    gap: 40px;
  }
  .footer-brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  .footer-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: contain;
    background: #fff;
    box-shadow: var(--shadow-sm);
  }
  .footer-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--purple);
  }
  .footer-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 360px;
  }
  .footer-heading {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--purple);
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .footer-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  .footer-list a {
    font-size: 13.5px;
    color: var(--text);
    transition: color 0.15s;
  }
  .footer-list a:hover {
    color: var(--purple);
    text-decoration: underline;
  }
  .footer-contact {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
    margin-bottom: 14px;
  }
  .footer-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .footer-badge-link {
    display: inline-flex;
    align-items: center;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--purple);
    background: var(--purple-soft);
    padding: 7px 12px;
    border-radius: var(--radius-md);
    width: fit-content;
    transition: 0.15s;
  }
  .footer-badge-link:hover {
    background: var(--purple-border);
  }
  .footer-badge-link.wa {
    background: var(--green-soft);
    color: var(--green);
  }
  .footer-bottom {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px dashed var(--line);
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
  }

  @media (max-width: 900px) {
    .nav-links { display: none; }
    .mobile-toggle { display: flex; }
    .footer-inner { grid-template-columns: 1fr; gap: 30px; }
  }
</style>
