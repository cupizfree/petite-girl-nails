<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let searchQuery = $state('');
  let orders = $state([]);
  let loading = $state(true);
  let selectedOrder = $state(null);

  const fallbackOrders = [
    { id: 1, order_id: "PON-001", customer_name: "Bestie Sasa", deadline: "10 September 2026", status: "READY_TO_PICK_UP", notes: "Almond shape, pastel floral" },
    { id: 2, order_id: "PON-002", customer_name: "Bestie Bella", deadline: "20 September 2026", status: "ANTRI", notes: "Short coffin, chrome French" },
    { id: 3, order_id: "PON-003", customer_name: "Bestie Cindy", deadline: "15 September 2026", status: "PROGRESS", notes: "Custom 3D charms ribbon" },
    { id: 4, order_id: "PON-004", customer_name: "Bestie Dinda", deadline: "15 September 2026", status: "ANTRI", notes: "Square oval, jelly blush pink" },
    { id: 5, order_id: "PON-005", customer_name: "Bestie Eka", deadline: "18 September 2026", status: "ANTRI", notes: "Cat eye magnetic lavender" },
    { id: 6, order_id: "PON-006", customer_name: "Bestie Fani", deadline: "16 September 2026", status: "ANTRI", notes: "Cozy autumn earth tone" },
    { id: 7, order_id: "PON-007", customer_name: "Bestie Gita", deadline: "16 September 2026", status: "ANTRI", notes: "Minimalist white pearls" },
    { id: 8, order_id: "PON-008", customer_name: "Bestie Hani", deadline: "09 September 2026", status: "SENT", notes: "Resi JNE: JNE88291039" },
    { id: 9, order_id: "PON-009", customer_name: "Bestie Intan", deadline: "09 September 2026", status: "SENT", notes: "Resi J&T: JNT99120482" },
    { id: 10, order_id: "PON-010", customer_name: "Bestie Jessica", deadline: "10 September 2026", status: "SENT", notes: "Ambil di studio Sewon" },
    { id: 11, order_id: "PON-011", customer_name: "Bestie Karina", deadline: "11 September 2026", status: "SENT", notes: "Resi SiCepat: 0041289912" },
    { id: 12, order_id: "PON-012", customer_name: "Bestie Laura", deadline: "15 September 2026", status: "READY_TO_PICK_UP", notes: "Bisa diambil jam 10.00-19.00" },
    { id: 13, order_id: "PON-013", customer_name: "Bestie Maya", deadline: "11 September 2026", status: "SENT", notes: "Resi J&T: JNT10293812" },
    { id: 14, order_id: "PON-014", customer_name: "Bestie Nadya", deadline: "12 September 2026", status: "SENT", notes: "Resi JNE: JNE77381902" },
  ];

  async function loadOrders(q = '') {
    loading = true;
    try {
      const res = await api.getPonOrders(q);
      if (res && res.success && res.data && res.data.length > 0) {
        orders = res.data;
      } else {
        orders = filterLocal(q);
      }
    } catch (e) {
      orders = filterLocal(q);
    } finally {
      loading = false;
    }
  }

  function filterLocal(q) {
    if (!q.trim()) return fallbackOrders;
    const term = q.toLowerCase().trim();
    return fallbackOrders.filter(o => 
      o.order_id.toLowerCase().includes(term) || 
      (o.customer_name && o.customer_name.toLowerCase().includes(term))
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    loadOrders(searchQuery);
  }

  function clearSearch() {
    searchQuery = '';
    loadOrders('');
  }

  function openDetail(item) {
    selectedOrder = item;
  }

  function closeDetail() {
    selectedOrder = null;
  }

  onMount(() => {
    loadOrders();
  });
</script>

<svelte:head>
  <title>PON Tracking | Petite Girl Nails — Press On Nails Status</title>
  <meta name="description" content="Lacak status pengerjaan pesanan Press On Nails (PON) kamu di Petite Girl Nails. Cek deadline dan status antri, progress, siap ambil, atau terkirim." />
</svelte:head>

<div class="pon-wrap">
  <!-- Brand Header -->
  <header class="pon-header">
    <div class="brand-trio">
      <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
    </div>
    <div class="brand-label">PETITE GIRL NAILS</div>
    <h1 class="pon-title">PRESS ON NAILS</h1>
    <div class="pon-subtitle">ORDER TRACKING</div>
  </header>

  <!-- Search Area -->
  <form onsubmit={handleSearch} class="search-form">
    <div class="search-input-wrap">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        bind:value={searchQuery}
        class="search-input"
        placeholder="Cari Order ID (contoh: PON-001)..."
        autocomplete="off"
      />
      {#if searchQuery}
        <button type="button" class="btn-clear" onclick={clearSearch}>✕</button>
      {/if}
    </div>

    <button type="submit" class="search-btn">
      SEARCH
    </button>
  </form>

  {#if searchQuery}
    <div class="search-info animate-fade-in">
      <span>Menampilkan hasil pencarian untuk: "<strong>{searchQuery}</strong>" ({orders.length} pesanan ditemukan)</span>
      <button class="btn-reset-link" onclick={clearSearch}>Tampilkan Semua</button>
    </div>
  {/if}

  <!-- Table Card -->
  <div class="table-card">
    {#if loading}
      <div class="loading-box">
        <div class="brand-trio">
          <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
        </div>
        <p>Memuat status pesanan...</p>
      </div>
    {:else if orders.length === 0}
      <div class="empty-box">
        <div class="empty-icon">🔎</div>
        <h3>Order ID Tidak Ditemukan</h3>
        <p>Pastikan kode Order ID sudah benar (misal: <code>PON-001</code>). Bestie juga bisa langsung konfirmasi ke admin.</p>
        <a 
          href="https://wa.me/6285179968311?text=Halo%20kak%2C%20mau%20tanya%20status%20pesanan%20PON%20saya" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-wa-query"
        >
          💬 Tanya Admin di WhatsApp
        </a>
      </div>
    {:else}
      <div class="table-scroll">
        <table class="pon-table">
          <thead>
            <tr>
              <th class="th-id">ORDER ID</th>
              <th class="th-deadline">DEADLINE</th>
              <th class="th-status">STATUS</th>
              <th class="th-act">DETAIL</th>
            </tr>
          </thead>
          <tbody>
            {#each orders as item}
              {@const isMatch = searchQuery && (item.order_id.toLowerCase().includes(searchQuery.toLowerCase()) || (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())))}
              <tr class:highlighted={isMatch}>
                <td class="td-id">
                  <strong>{item.order_id}</strong>
                  {#if item.customer_name}
                    <span class="customer-tag">{item.customer_name}</span>
                  {/if}
                </td>
                <td class="td-deadline">{item.deadline}</td>
                <td class="td-status">
                  {#if item.status === 'READY_TO_PICK_UP' || item.status === 'READY'}
                    <span class="status-pill status-ready">🔵 READY TO PICK UP</span>
                  {:else if item.status === 'PROGRESS' || item.status === 'PRODUCTION'}
                    <span class="status-pill status-progress">🟡 PROGRESS</span>
                  {:else if item.status === 'SENT'}
                    <span class="status-pill status-sent">🟢 SENT</span>
                  {:else if item.status === 'CANCELLED'}
                    <span class="status-pill status-cancelled">⚪ CANCELLED</span>
                  {:else}
                    <span class="status-pill status-antri">🔴 ANTRI</span>
                  {/if}
                </td>
                <td class="td-act">
                  <button class="btn-detail" onclick={() => openDetail(item)}>
                    Detail
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Legend -->
  <div class="status-legend">
    <div class="legend-item"><span class="badge-mini antri">🔴</span> Antri (Dalam antrean desain)</div>
    <div class="legend-item"><span class="badge-mini progress">🟡</span> Progress (Sedang dilukis)</div>
    <div class="legend-item"><span class="badge-mini ready">🔵</span> Ready (Siap diambil)</div>
    <div class="legend-item"><span class="badge-mini sent">🟢</span> Sent (Sudah dikirim)</div>
  </div>

  <!-- Detail Modal -->
  {#if selectedOrder}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop animate-fade-in" onclick={closeDetail}>
      <div class="modal-card" onclick={e => e.stopPropagation()}>
        <div class="modal-header">
          <div>
            <span class="modal-code">{selectedOrder.order_id}</span>
            <h3 class="modal-name">{selectedOrder.customer_name || 'Pesanan Press On'}</h3>
          </div>
          <button class="btn-close" onclick={closeDetail}>✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-row">
            <span>Status Saat Ini:</span>
            <strong>{selectedOrder.status.replace(/_/g, ' ')}</strong>
          </div>
          <div class="modal-row">
            <span>Estimasi Selesai / Deadline:</span>
            <strong>{selectedOrder.deadline}</strong>
          </div>
          <div class="modal-row notes-box">
            <span>Catatan / Keterangan:</span>
            <p>{selectedOrder.notes || 'Tidak ada catatan tambahan.'}</p>
          </div>
        </div>
        <div class="modal-footer">
          <a 
            href={`https://wa.me/6285179968311?text=Halo%20kak%2C%20mau%20tanya%20update%20pesanan%20${selectedOrder.order_id}%20atas%20nama%20${encodeURIComponent(selectedOrder.customer_name || '')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-wa-modal"
          >
            💬 Tanya via WhatsApp
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .pon-wrap {
    width: min(740px, calc(100% - 28px));
    margin: 32px auto 60px;
  }

  .pon-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .brand-label {
    font-size: 11px;
    letter-spacing: 3.5px;
    color: var(--text-muted);
    margin-top: 6px;
    margin-bottom: 6px;
    font-weight: 700;
  }
  .pon-title {
    margin: 0;
    font-size: 36px;
    line-height: 1.05;
    letter-spacing: 0.5px;
    color: var(--purple);
    font-weight: 800;
  }
  .pon-subtitle {
    margin-top: 6px;
    font-size: 12px;
    letter-spacing: 2.6px;
    color: var(--text-muted);
    font-weight: 700;
  }

  /* Search */
  .search-form {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 12px;
  }
  .search-input-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    font-size: 17px;
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    height: 48px;
    padding: 0 40px 0 42px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #ffffff;
    color: var(--text);
    font-size: 15px;
    outline: none;
    box-shadow: var(--shadow-sm);
    transition: all 0.18s ease;
  }
  .search-input:focus {
    border-color: var(--purple-border);
    box-shadow: 0 0 0 3px rgba(81, 72, 91, 0.08);
  }
  .btn-clear {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
  }
  .search-btn {
    height: 48px;
    padding: 0 22px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #ffffff;
    color: var(--purple);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.6px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.16s ease;
    box-shadow: var(--shadow-sm);
  }
  .search-btn:hover {
    background: var(--purple);
    color: #fffdf9;
    border-color: var(--purple);
  }

  .search-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 12px;
    padding: 0 4px;
  }
  .btn-reset-link {
    background: none;
    border: none;
    color: var(--purple);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Table Card */
  .table-card {
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .table-scroll {
    overflow-x: auto;
  }
  .pon-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }
  .pon-table th {
    padding: 16px 16px;
    border-bottom: 1px solid var(--line);
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 1px;
    background: #faf8f6;
  }
  .pon-table td {
    padding: 16px 16px;
    border-bottom: 1px solid #f2eeed;
    font-size: 14px;
    vertical-align: middle;
  }
  .pon-table tr:last-child td {
    border-bottom: none;
  }
  .pon-table tr.highlighted td {
    background: #fdf5f3;
  }

  .td-id strong {
    font-size: 14.5px;
    color: var(--purple);
    display: block;
  }
  .customer-tag {
    font-size: 11.5px;
    color: var(--text-muted);
  }
  .td-deadline {
    color: #55525a;
    font-size: 13.5px;
    white-space: nowrap;
  }

  /* Status Pills */
  .status-pill {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 750;
    line-height: 1;
    white-space: nowrap;
  }
  .status-antri {
    background: #f8e8e8;
    color: #a83232;
  }
  .status-progress {
    background: #fef7da;
    color: #8f7200;
  }
  .status-ready {
    background: #e6f3fb;
    color: #1a75b8;
  }
  .status-sent {
    background: #e6f7ec;
    color: #2b7746;
  }
  .status-cancelled {
    background: #f1f1f1;
    color: #777777;
  }

  .btn-detail {
    background: #fff;
    border: 1px solid var(--line);
    padding: 5px 12px;
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    font-weight: 700;
    color: var(--purple);
    cursor: pointer;
    transition: 0.15s;
  }
  .btn-detail:hover {
    background: var(--purple-soft);
  }

  /* Empty & Loading */
  .loading-box, .empty-box {
    text-align: center;
    padding: 48px 20px;
    color: var(--text-muted);
  }
  .empty-icon {
    font-size: 40px;
    margin-bottom: 10px;
  }
  .empty-box h3 {
    font-size: 18px;
    font-weight: 750;
    color: var(--purple);
    margin-bottom: 8px;
  }
  .empty-box p {
    font-size: 13px;
    max-width: 360px;
    margin: 0 auto 20px;
    line-height: 1.5;
  }
  .btn-wa-query {
    display: inline-flex;
    background: var(--green);
    color: #fff;
    padding: 9px 18px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 700;
  }

  /* Legend */
  .status-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    font-size: 11.5px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  /* Modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 16px;
  }
  .modal-card {
    background: var(--card-warm);
    border-radius: 20px;
    max-width: 440px;
    width: 100%;
    padding: 24px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--line);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .modal-code {
    font-size: 12px;
    font-weight: 800;
    color: var(--purple);
    background: var(--purple-soft);
    padding: 3px 8px;
    border-radius: 6px;
  }
  .modal-name {
    font-size: 20px;
    font-weight: 800;
    color: var(--purple);
    margin-top: 4px;
  }
  .btn-close {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--text-muted);
    cursor: pointer;
  }
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 13.5px;
    margin-bottom: 20px;
  }
  .modal-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed var(--line);
    padding-bottom: 8px;
  }
  .modal-row.notes-box {
    flex-direction: column;
    gap: 4px;
  }
  .modal-row.notes-box p {
    background: #fff;
    border: 1px solid var(--line);
    padding: 10px;
    border-radius: 8px;
    font-size: 12.5px;
    color: #444;
  }
  .btn-wa-modal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px;
    background: var(--green);
    color: #fff;
    border-radius: var(--radius-full);
    font-weight: 750;
    font-size: 14px;
  }
</style>
