<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { goto } from '$app/navigation';

  let today = new Date();
  today.setHours(0, 0, 0, 0);

  let viewDate = $state(new Date(today));
  let maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 35); // 35 days window

  let availability = $state([]);
  let loading = $state(true);
  let selectedDateKey = $state(null);
  let selectedDaySlots = $state([]);
  let selectedDayFormatted = $state('');

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function monthKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  async function loadMonthAvailability() {
    loading = true;
    try {
      const mk = monthKey(viewDate);
      const res = await api.getAvailability(mk);
      if (res && res.success && res.data) {
        availability = res.data;
      } else {
        // Fallback local calculation if backend is loading
        generateLocalAvailability();
      }
    } catch (e) {
      generateLocalAvailability();
    } finally {
      loading = false;
    }
  }

  function generateLocalAvailability() {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const list = [];
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(y, m, d);
      const isPast = dt < today;
      list.push({
        date: dateKey(dt),
        day_number: d,
        total_slots: 5,
        available_slots: isPast ? 0 : 5,
        is_full: isPast,
        is_closed: false
      });
    }
    availability = list;
  }

  async function selectDay(item, dt) {
    selectedDateKey = item.date;
    try {
      const res = await api.getDateSlots(item.date);
      if (res && res.success && res.data) {
        selectedDaySlots = res.data.slots;
        selectedDayFormatted = res.data.formatted_date;
      } else {
        // Fallback slots
        selectedDaySlots = [
          { time: "10:00", status: "AVAILABLE" },
          { time: "13:00", status: "AVAILABLE" },
          { time: "16:00", status: "AVAILABLE" },
          { time: "19:00", status: "AVAILABLE" },
          { time: "21:00", status: "AVAILABLE" }
        ];
        selectedDayFormatted = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
      }
    } catch (e) {
      selectedDaySlots = [
        { time: "10:00", status: "AVAILABLE" },
        { time: "13:00", status: "AVAILABLE" },
        { time: "16:00", status: "AVAILABLE" },
        { time: "19:00", status: "AVAILABLE" },
        { time: "21:00", status: "AVAILABLE" }
      ];
      selectedDayFormatted = item.date;
    }
  }

  function handleSlotClick(slot) {
    if (slot.status !== 'AVAILABLE') return;
    goto(`/book?date=${selectedDateKey}&time=${encodeURIComponent(slot.time)}`);
  }

  function prevMonth() {
    const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const firstAllowed = new Date(today.getFullYear(), today.getMonth(), 1);
    if (prev < firstAllowed) return;
    viewDate = prev;
    selectedDateKey = null;
    selectedDaySlots = [];
    loadMonthAvailability();
  }

  function nextMonth() {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    const lastAllowed = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    if (next > lastAllowed) return;
    viewDate = next;
    selectedDateKey = null;
    selectedDaySlots = [];
    loadMonthAvailability();
  }

  let isPrevDisabled = $derived(
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) <= new Date(today.getFullYear(), today.getMonth(), 1)
  );
  let isNextDisabled = $derived(
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  );

  let monthLabel = $derived(
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(viewDate)
  );

  let openSlotsCount = $derived(
    selectedDaySlots.filter(s => s.status === 'AVAILABLE').length
  );

  let blankDays = $derived(() => {
    const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    return Array(firstDayIndex).fill(null);
  });

  onMount(() => {
    loadMonthAvailability();
  });
</script>

<svelte:head>
  <title>PETITE GIRL NAILS — Studio Availability Calendar</title>
  <meta name="description" content="Cek ketersediaan slot jam harian studio Petite Girl Nails Sewon Bantul. Pilih tanggal untuk melihat waktu janji temu yang tersedia." />
</svelte:head>

<div class="calendar-wrap">
  <!-- Brand Heading -->
  <div class="brand-header">
    <div class="brand-mark" aria-hidden="true">
      <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
    </div>
    <div class="eyebrow">PETITE GIRL NAILS</div>
    <h1 class="main-title">Availability</h1>
    <p class="sub">Pick a date to see the appointment times available.</p>
  </div>

  <!-- Calendar Card (Faithful to Ref 1 design) -->
  <div class="calendar-card">
    <div class="calendar-top">
      <h2 class="month-title">{monthLabel}</h2>
      <div class="nav">
        <button class="nav-btn prev" onclick={prevMonth} disabled={isPrevDisabled} aria-label="Bulan Sebelumnya">
          ‹
        </button>
        <button class="nav-btn next" onclick={nextMonth} disabled={isNextDisabled} aria-label="Bulan Berikutnya">
          ›
        </button>
      </div>
    </div>

    <!-- Weekdays Header -->
    <div class="weekdays">
      <div>SUN</div>
      <div>MON</div>
      <div>TUE</div>
      <div>WED</div>
      <div>THU</div>
      <div>FRI</div>
      <div>SAT</div>
    </div>

    <!-- Calendar Grid -->
    {#if loading}
      <div class="loading-state">
        <div class="brand-trio">
          <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
        </div>
        <p>Loading studio availability...</p>
      </div>
    {:else}
      <div class="grid">
        {#each blankDays() as _}
          <div class="day disabled empty"></div>
        {/each}

        {#each availability as item}
          {@const dt = new Date(viewDate.getFullYear(), viewDate.getMonth(), item.day_number)}
          {@const isBeforeToday = dt < today}
          {@const isAfterMax = dt > maxDate}
          {@const isOutOfWindow = isBeforeToday || isAfterMax}
          {@const isSelected = selectedDateKey === item.date}
          
          <button
            type="button"
            class="day"
            class:selected={isSelected}
            class:disabled={isOutOfWindow || item.is_closed}
            disabled={isOutOfWindow || item.is_closed}
            onclick={() => selectDay(item, dt)}
          >
            <div class="day-number">{item.day_number}</div>
            <div class="count" class:open={item.available_slots > 0} class:full={item.available_slots === 0}>
              {#if isOutOfWindow || item.is_closed}
                -
              {:else if item.available_slots > 0}
                {item.available_slots} open
              {:else}
                full
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/if}

    <!-- Time Slot Details Drawer -->
    {#if selectedDateKey}
      <div class="details show animate-fade-in">
        <div class="detail-head">
          <div class="detail-date">{selectedDayFormatted}</div>
          <div class="detail-count">
            {#if openSlotsCount > 0}
              🟢 {openSlotsCount} slot available
            {:else}
              🔴 Fully booked
            {/if}
          </div>
        </div>

        <div class="slots">
          {#each selectedDaySlots as slot}
            <button
              type="button"
              class="slot"
              class:available={slot.status === 'AVAILABLE'}
              class:booked={slot.status !== 'AVAILABLE'}
              disabled={slot.status !== 'AVAILABLE'}
              onclick={() => handleSlotClick(slot)}
            >
              {slot.time}
            </button>
          {/each}
        </div>

        <p class="note">
          ✨ Tap jam yang tersedia untuk langsung mengisi form booking.
        </p>
      </div>
    {/if}

    <!-- Legend -->
    <div class="legend">
      <span><i class="dot-avail"></i> available</span>
      <span><i class="dot-full"></i> full</span>
    </div>

    <!-- Bottom Dots Navigation -->
    <div class="footer-brand">
      PETITE GIRL NAILS
      <span class="footer-dots" aria-hidden="true">
        <i class="coral"></i><i class="yellow"></i><i class="blue"></i>
      </span>
    </div>
  </div>
</div>

<style>
  .calendar-wrap {
    width: min(620px, calc(100% - 28px));
    margin: 28px auto 60px;
  }

  .brand-header {
    text-align: center;
    margin-bottom: 22px;
  }
  .brand-mark {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .brand-mark i {
    display: block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .brand-mark .coral { background: var(--coral); }
  .brand-mark .yellow { background: var(--yellow); }
  .brand-mark .blue { background: var(--blue); }

  .eyebrow {
    color: var(--purple);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .main-title {
    margin: 0;
    font-size: 38px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.045em;
    color: var(--purple);
  }
  .sub {
    text-align: center;
    color: var(--text-muted);
    font-size: 13.5px;
    line-height: 1.6;
    margin: 10px auto 0;
    max-width: 420px;
  }

  /* Card */
  .calendar-card {
    position: relative;
    background: var(--card-warm);
    border: 1px solid var(--line);
    border-radius: 26px;
    padding: 24px 20px;
    box-shadow: 0 16px 40px rgba(81, 72, 91, 0.08);
    overflow: hidden;
  }
  .calendar-card::before {
    content: "";
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(243, 161, 141, 0.12);
    top: -40px;
    right: -20px;
    pointer-events: none;
  }

  .calendar-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .month-title {
    color: var(--purple);
    font-size: 20px;
    font-weight: 750;
    letter-spacing: -0.02em;
  }
  .nav {
    display: flex;
    gap: 8px;
  }
  .nav-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    transition: all 0.15s ease;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn.prev {
    background: var(--blue-soft);
    border-color: var(--blue-border);
    color: var(--purple);
  }
  .nav-btn.prev:hover:not(:disabled) {
    background: #69bdd7;
    color: #fff;
    transform: translateY(-1px);
  }
  .nav-btn.next {
    background: var(--yellow-soft);
    border-color: var(--yellow-border);
    color: var(--purple);
  }
  .nav-btn.next:hover:not(:disabled) {
    background: #e7d13f;
    transform: translateY(-1px);
  }
  .nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
    transform: none;
  }

  .weekdays, .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }
  .weekdays div {
    text-align: center;
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 700;
    letter-spacing: 0.08em;
    padding-bottom: 8px;
  }

  .day {
    position: relative;
    min-height: 68px;
    border: 1px solid transparent;
    border-radius: 16px;
    background: transparent;
    cursor: pointer;
    padding: 8px 4px;
    text-align: center;
    color: var(--purple);
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .day:hover:not(.disabled) {
    background: #faf7fb;
    border-color: #e3dce8;
    transform: translateY(-2px);
  }
  .day.selected {
    background: var(--purple) !important;
    border-color: var(--purple) !important;
    color: #fffdf9 !important;
    box-shadow: 0 8px 18px rgba(81, 72, 91, 0.2);
  }
  .day.disabled {
    cursor: default;
    opacity: 0.32;
  }
  .day.disabled:hover {
    transform: none;
    background: transparent;
    border-color: transparent;
  }
  .day-number {
    font-size: 19px;
    line-height: 1;
    font-weight: 750;
    letter-spacing: -0.02em;
  }
  .count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.1;
  }
  .count.open {
    background: var(--green-soft);
    color: var(--green);
  }
  .count.full {
    background: var(--gray-soft);
    color: #9e9692;
  }
  .day.selected .count.open, .day.selected .count.full {
    background: rgba(255, 255, 255, 0.2);
    color: #fffdf9;
  }

  /* Details Drawer */
  .details {
    margin-top: 20px;
    border-top: 1px dashed var(--line);
    padding: 20px 2px 4px;
  }
  .detail-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 12px;
  }
  .detail-date {
    font-size: 20px;
    line-height: 1.2;
    font-weight: 750;
    letter-spacing: -0.03em;
    color: var(--purple);
  }
  .detail-count {
    font-size: 12px;
    font-weight: 750;
    color: var(--green);
    flex-shrink: 0;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .slot {
    min-height: 48px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--text-muted);
    font-size: 13.5px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.16s ease;
  }
  .slot.available {
    background: var(--green-soft);
    border-color: var(--green-border);
    color: var(--green);
    cursor: pointer;
  }
  .slot.available:hover {
    background: #ddf2e4;
    border-color: var(--green);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(93, 154, 120, 0.2);
  }
  .slot.booked {
    background: var(--gray-soft);
    color: #aaa39f;
    border-color: var(--gray-soft);
    cursor: not-allowed;
    opacity: 0.65;
  }

  .note {
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
    margin: 16px 0 0;
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 24px;
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
  }
  .legend span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .legend i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .legend .dot-avail { background: var(--green); }
  .legend .dot-full { background: var(--gray); }

  .loading-state {
    text-align: center;
    padding: 40px 0;
    color: var(--text-muted);
    font-size: 13px;
  }
  .loading-state p {
    margin-top: 10px;
  }

  .footer-brand {
    text-align: center;
    margin-top: 22px;
    font-size: 10px;
    font-weight: 700;
    color: #aaa1a6;
    letter-spacing: 0.08em;
  }
  .footer-dots {
    display: inline-flex;
    gap: 4px;
    vertical-align: middle;
    margin-left: 5px;
  }
  .footer-dots i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    display: block;
  }
  .footer-dots .coral { background: var(--coral); }
  .footer-dots .yellow { background: var(--yellow); }
  .footer-dots .blue { background: var(--blue); }

  @media (max-width: 540px) {
    .slots { grid-template-columns: repeat(3, 1fr); }
    .day { min-height: 60px; }
    .day-number { font-size: 16px; }
    .count { font-size: 8px; padding: 2px 5px; }
  }
</style>
