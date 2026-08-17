// Seat Details & Guest Information Modal
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class SeatDetailsModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentSeat = null;
    this.currentOrganizer = null;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="details-backdrop">
        <div class="modal-card animate-pop-in">
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-badge-status status-reserved" id="details-status-badge">
                <span id="details-status-text">Reserved</span>
              </div>
              <h2 class="modal-title" id="details-seat-title">Seat A-12</h2>
              <p class="modal-subtitle">Reservation Details & Attendee Information</p>
            </div>
            <button type="button" class="modal-close-btn" id="details-close-btn">&times;</button>
          </div>

          <!-- Attendee Profile Glow Card -->
          <div class="attendee-card-glow">
            <div class="attendee-avatar-circle" id="details-avatar">SC</div>
            <div class="attendee-info-main">
              <h3 class="attendee-name" id="details-guest-name">Sarah Connor</h3>
              <div class="attendee-ticket-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <span id="details-ticket-id" class="font-mono">TCK-8821</span>
              </div>
            </div>
          </div>

          <!-- Seat Metadata Grid -->
          <div class="seat-summary-grid">
            <div class="summary-item">
              <span class="item-label">Section</span>
              <span class="item-val" id="details-section">Part 1</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Seat Code</span>
              <span class="item-val highlight" id="details-code">A19</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Wing / Column</span>
              <span class="item-val" id="details-tier-price">Left Wing</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Status</span>
              <span class="item-val" style="color: #ef4444;">Reserved</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions space-between">
            <button type="button" class="btn btn-danger-ghost" id="details-cancel-res-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Release Seat</span>
            </button>

            <div class="action-group-right">
              <button type="button" class="btn btn-secondary" id="details-done-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#details-backdrop');
    const closeBtn = this.container.querySelector('#details-close-btn');
    const doneBtn = this.container.querySelector('#details-done-btn');
    const cancelResBtn = this.container.querySelector('#details-cancel-res-btn');

    closeBtn.addEventListener('click', () => this.close());
    if (doneBtn) doneBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    cancelResBtn.addEventListener('click', async () => {
      if (!this.currentSeat) return;
      const guest = this.currentSeat.assignedTo?.name || 'Guest';
      const confirmRelease = confirm(`Are you sure you want to cancel the reservation for ${guest} on Seat ${this.currentSeat.seatCode}?`);
      if (confirmRelease) {
        await syncEngine.cancelReservation(this.currentSeat.id, this.currentOrganizer);
        toast.info('Seat Released', `Seat ${this.currentSeat.seatCode} is now available.`);
        this.close();
      }
    });
  }

  open(seat, organizer) {
    this.currentSeat = seat;
    this.currentOrganizer = organizer;

    const title = this.container.querySelector('#details-seat-title');
    const guestName = this.container.querySelector('#details-guest-name');
    const ticketId = this.container.querySelector('#details-ticket-id');
    const avatar = this.container.querySelector('#details-avatar');
    const section = this.container.querySelector('#details-section');
    const code = this.container.querySelector('#details-code');
    const tierPrice = this.container.querySelector('#details-tier-price');

    const name = seat.assignedTo?.name || 'Unknown Guest';
    const tck = seat.assignedTo?.ticketId || 'TCK-0000';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G';

    title.textContent = `Seat ${seat.seatCode}`;
    guestName.textContent = name;
    ticketId.textContent = tck;
    avatar.textContent = initials;
    section.textContent = seat.section || 'Auditorium';
    code.textContent = seat.seatCode;
    const wingLabel = seat.wing === 'left' ? 'Left Wing (Odds)' : seat.wing === 'center' ? 'Center Section' : 'Right Wing (Evens)';
    tierPrice.textContent = wingLabel;

    this.container.querySelector('#details-backdrop').classList.add('active');
  }

  close() {
    const backdrop = this.container.querySelector('#details-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    this.currentSeat = null;
  }
}
