// Stats Dashboard Component (Total Capacity, Available Seats & Reserved Seats)

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
            <div class="stat-trend text-muted">Rows A – Q</div>
          </div>
        </div>

        <!-- Available Seats Card -->
        <div class="stat-card">
          <div class="stat-icon-wrap bg-emerald-subtle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Available Seats</div>
            <div class="stat-value text-emerald" id="stat-available" style="color: #10B981;">0</div>
            <div class="stat-trend text-muted" id="stat-available-sub">Ready for assignment</div>
          </div>
        </div>

        <!-- Reserved Seats Card -->
        <div class="stat-card">
          <div class="stat-icon-wrap bg-purple-subtle">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Assigned Reservations</div>
            <div class="stat-value text-purple" id="stat-reserved">0</div>
            <div class="stat-trend text-muted" id="stat-reserved-sub">0 Held by organizers</div>
          </div>
        </div>
      </div>
    `;
  }

  update(seats) {
    const seatArr = Object.values(seats);
    const total = seatArr.length || 0;
    const avail = seatArr.filter(s => s.status === 'available').length;
    const locked = seatArr.filter(s => s.status === 'locked').length;
    const reserved = seatArr.filter(s => s.status === 'reserved' || s.status === 'checked_in').length;

    const capEl = this.container.querySelector('#stat-capacity');
    const availEl = this.container.querySelector('#stat-available');
    const availSubEl = this.container.querySelector('#stat-available-sub');
    const resEl = this.container.querySelector('#stat-reserved');
    const resSubEl = this.container.querySelector('#stat-reserved-sub');

    if (capEl) capEl.textContent = `${total} Seats`;
    if (availEl) availEl.textContent = `${avail}`;
    if (availSubEl) availSubEl.textContent = `${avail} seats open`;
    if (resEl) resEl.textContent = `${reserved}`;
    if (resSubEl) resSubEl.textContent = `${locked} currently held by organizers`;
  }
}
