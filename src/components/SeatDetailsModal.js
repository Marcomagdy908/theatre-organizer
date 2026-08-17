// Seat Details & Check-In Modal (For Reserved & Checked-In Seats)
import confetti from 'canvas-confetti';
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class SeatDetailsModal {
  constructor(containerId) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.currentSeat = null;
    this.currentOrganizer = null;

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="details-backdrop">
        <div class="modal-card modal-details animate-pop-in">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-badge-status" id="details-status-badge">
                <span class="status-dot"></span>
                <span id="details-status-text">Reserved</span>
              </div>
              <h2 class="modal-title" id="details-seat-title">Seat Details</h2>
              <p class="modal-subtitle" id="details-seat-subtitle">View attendee assignment and front-of-house check-in status.</p>
            </div>
            <button class="modal-close-btn" id="details-close-btn">&times;</button>
          </div>

          <!-- Attendee Card -->
          <div class="attendee-card-glow">
            <div class="attendee-avatar-circle" id="details-avatar">SC</div>
            <div class="attendee-info-main">
              <div class="attendee-name" id="details-guest-name">Sarah Connor</div>
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
              <span class="item-val" id="details-section">Orchestra</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Seat Code</span>
              <span class="item-val highlight" id="details-code">A-12</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Wing / Position</span>
              <span class="item-val" id="details-tier-price">Left Wing</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Check-In Status</span>
              <span class="item-val" id="details-checkedin-time">Not checked in</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions space-between">
            <button type="button" class="btn btn-danger-ghost" id="details-cancel-res-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Release Seat</span>
            </button>

            <div class="action-group-right" id="details-primary-actions">
              <!-- Dynamically switched between Check-In and Undo Check-In -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#details-backdrop');
    const closeBtn = this.container.querySelector('#details-close-btn');
    const cancelResBtn = this.container.querySelector('#details-cancel-res-btn');

    closeBtn.addEventListener('click', () => this.close());
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
    const statusBadge = this.container.querySelector('#details-status-badge');
    const statusText = this.container.querySelector('#details-status-text');
    const avatar = this.container.querySelector('#details-avatar');
    const guestName = this.container.querySelector('#details-guest-name');
    const ticketId = this.container.querySelector('#details-ticket-id');
    const section = this.container.querySelector('#details-section');
    const code = this.container.querySelector('#details-code');
    const tierPrice = this.container.querySelector('#details-tier-price');
    const checkinTime = this.container.querySelector('#details-checkedin-time');
    const primaryActions = this.container.querySelector('#details-primary-actions');

    const name = seat.assignedTo?.name || 'Unknown Guest';
    const tck = seat.assignedTo?.ticketId || 'TCK-0000';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G';

    title.textContent = `Seat ${seat.seatCode}`;
    guestName.textContent = name;
    ticketId.textContent = tck;
    avatar.textContent = initials;
    const wingLabel = seat.wing === 'left' ? 'Left Wing (Odds)' : seat.wing === 'center' ? 'Center Section' : 'Right Wing (Evens)';
    tierPrice.textContent = wingLabel;

    statusBadge.className = `modal-badge-status status-${seat.status}`;
    statusText.textContent = seat.status === 'checked_in' ? 'Checked In' : 'Reserved';

    if (seat.status === 'checked_in') {
      const timeStr = seat.checkedInAt ? new Date(seat.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified';
      checkinTime.innerHTML = `<span class="text-purple">Checked in at ${timeStr}</span>`;
      primaryActions.innerHTML = `
        <button type="button" class="btn btn-secondary" id="details-undo-checkin-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          <span>Undo Check-In</span>
        </button>
      `;

      primaryActions.querySelector('#details-undo-checkin-btn').addEventListener('click', async () => {
        await syncEngine.undoCheckIn(seat.id, organizer);
        toast.info('Check-In Reverted', `Seat ${seat.seatCode} status changed back to Reserved.`);
        this.close();
      });
    } else {
      checkinTime.textContent = 'Awaiting venue entry';
      primaryActions.innerHTML = `
        <button type="button" class="btn btn-primary btn-checkin" id="details-do-checkin-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Check In Guest</span>
        </button>
      `;

      primaryActions.querySelector('#details-do-checkin-btn').addEventListener('click', async () => {
        await syncEngine.checkInSeat(seat.id, organizer);
        
        // Trigger celebratory confetti effect
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#6366F1', '#10B981', '#F59E0B']
        });

        toast.success('Guest Checked In!', `${name} (${seat.seatCode}) successfully verified at door.`);
        this.close();
      });
    }

    this.container.querySelector('#details-backdrop').classList.add('active');
  }

  close() {
    const backdrop = this.container.querySelector('#details-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    this.currentSeat = null;
  }
}
