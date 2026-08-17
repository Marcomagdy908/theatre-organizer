// Stats Dashboard Component (Occupancy, Check-In % & Capacity)

export class StatsDashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="stats-row">
        <!-- Total Capacity Card -->
        <div class="stat-card">
          <div class="stat-icon-wrap bg-blue-subtle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Venue Capacity</div>
            <div class="stat-value" id="stat-capacity">0 Seats</div>
            <div class="stat-trend text-muted" id="stat-available-sub">0 Available</div>
          </div>
        </div>

        <!-- Occupancy Rate Card -->
        <div class="stat-card">
          <div class="stat-icon-wrap bg-emerald-subtle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Occupancy Rate</div>
            <div class="stat-value" id="stat-occupancy">0%</div>
            <div class="stat-progress-bar">
              <div class="stat-progress-fill" id="stat-occupancy-bar" style="width: 0%;"></div>
            </div>
          </div>
        </div>

        <!-- Front of House Check-In Card -->
        <div class="stat-card">
          <div class="stat-icon-wrap bg-purple-subtle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Venue Gate Check-In</div>
            <div class="stat-value text-purple" id="stat-checkin">0 / 0</div>
            <div class="stat-trend text-muted" id="stat-checkin-percent">0% of booked guests admitted</div>
          </div>
        </div>
      </div>
    `;
  }

  update(seats) {
    const seatArr = Object.values(seats);
    const total = seatArr.length || 1;
    const avail = seatArr.filter(s => s.status === 'available').length;
    const locked = seatArr.filter(s => s.status === 'locked').length;
    const reserved = seatArr.filter(s => s.status === 'reserved').length;
    const checkedIn = seatArr.filter(s => s.status === 'checked_in').length;

    const bookedCount = reserved + checkedIn;
    const occupancyPct = Math.round((bookedCount / total) * 100);
    const checkinPct = bookedCount > 0 ? Math.round((checkedIn / bookedCount) * 100) : 0;

    const capEl = this.container.querySelector('#stat-capacity');
    const availSubEl = this.container.querySelector('#stat-available-sub');
    const occEl = this.container.querySelector('#stat-occupancy');
    const occBar = this.container.querySelector('#stat-occupancy-bar');
    const checkinEl = this.container.querySelector('#stat-checkin');
    const checkinSubEl = this.container.querySelector('#stat-checkin-percent');

    if (capEl) capEl.textContent = `${total} Seats`;
    if (availSubEl) availSubEl.textContent = `${avail} Available (${locked} currently held)`;
    if (occEl) occEl.textContent = `${occupancyPct}%`;
    if (occBar) occBar.style.width = `${occupancyPct}%`;
    if (checkinEl) checkinEl.textContent = `${checkedIn} / ${bookedCount}`;
    if (checkinSubEl) checkinSubEl.textContent = `${checkinPct}% of booked guests admitted`;
  }
}
