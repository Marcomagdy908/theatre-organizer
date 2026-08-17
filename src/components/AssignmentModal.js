// Single & Multi-Seat Assignment Modal Component
import { generateTicketId } from '../utils/constants.js';
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class AssignmentModal {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete || (() => {});
    this.currentSeats = []; // Array of seat objects
    this.currentOrganizer = null;
    this.timerInterval = null;
    this.remainingSeconds = 60;
    this.ticketIds = {};

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="assign-backdrop">
        <div class="modal-card animate-pop-in">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-badge-hold">
                <span class="pulse-dot"></span>
                <span>Active 60s Hold Lock</span>
              </div>
              <h2 class="modal-title" id="assign-modal-title">Assign Seats</h2>
              <p class="modal-subtitle">Enter attendee details to confirm reservation.</p>
            </div>
            <button type="button" class="modal-close-btn" id="assign-close-btn">&times;</button>
          </div>

          <!-- TTL Hold Countdown Bar -->
          <div class="ttl-countdown-container">
            <div class="ttl-bar-header">
              <span class="ttl-label">Temporary Lock Expiring in:</span>
              <span class="ttl-countdown-text" id="assign-countdown">60s</span>
            </div>
            <div class="ttl-progress-track">
              <div class="ttl-progress-fill" id="assign-progress-bar" style="width: 100%;"></div>
            </div>
          </div>

          <!-- Selected Seats Chips List -->
          <div class="selected-seats-badge-wrap" id="assign-seats-chips-wrap">
            <!-- Dynamically populated -->
          </div>

          <!-- Form Fields -->
          <form id="assign-form" class="assign-form" autocomplete="off">
            <div class="form-group">
              <label for="assign-primary-name" class="form-label">
                <span id="assign-name-label">Primary Guest / Group Name</span>
                <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input 
                  type="text" 
                  id="assign-primary-name" 
                  class="form-input" 
                  placeholder="e.g. Sarah Connor / Smith Family" 
                  required 
                  autofocus
                />
              </div>
            </div>

            <!-- Dynamic Ticket Codes List -->
            <div class="form-group" id="assign-tickets-group">
              <label class="form-label">
                <span>Assigned Ticket Codes</span>
                <span class="code-tag">Auto-Generated</span>
              </label>
              <div class="tickets-pills-list" id="assign-tickets-list"></div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="modal-actions space-between">
              <button type="button" class="btn btn-ghost" id="assign-cancel-btn">
                Release Hold
              </button>
              <div class="action-group-right">
                <button type="submit" class="btn btn-primary" id="assign-confirm-btn">
                  Confirm All Reservations
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#assign-backdrop');
    const closeBtn = this.container.querySelector('#assign-close-btn');
    const cancelBtn = this.container.querySelector('#assign-cancel-btn');
    const form = this.container.querySelector('#assign-form');

    const handleClose = () => {
      this.releaseCurrentHolds();
      this.close();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) handleClose();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const primaryName = this.container.querySelector('#assign-primary-name').value.trim();

      if (!primaryName) {
        toast.error('Name Required', 'Please enter a guest name.');
        return;
      }

      if (this.currentSeats.length === 0) return;

      // Prepare batch assignments
      const assignments = this.currentSeats.map((seat, index) => {
        const guestName = this.currentSeats.length > 1 ? `${primaryName} (Guest ${index + 1})` : primaryName;
        return {
          seatId: seat.id,
          name: guestName,
          ticketId: this.ticketIds[seat.id] || generateTicketId()
        };
      });

      const res = await syncEngine.reserveMultipleSeats(assignments, this.currentOrganizer);

      if (res.success) {
        toast.success(
          'Reservations Confirmed!',
          `Successfully assigned ${res.count} seat(s) to ${primaryName}.`
        );
        this.stopHoldTimer();
        this.close();
        if (this.onComplete) this.onComplete(this.currentSeats);
      } else {
        toast.conflict('Some seats could not be booked due to a concurrent conflict.');
        this.stopHoldTimer();
        this.close();
      }
    });
  }

  open(seats, organizer) {
    this.currentSeats = Array.isArray(seats) ? seats : [seats];
    this.currentOrganizer = organizer;
    this.ticketIds = {};

    const titleEl = this.container.querySelector('#assign-modal-title');
    const chipsWrap = this.container.querySelector('#assign-seats-chips-wrap');
    const ticketsList = this.container.querySelector('#assign-tickets-list');
    const nameInput = this.container.querySelector('#assign-primary-name');
    const nameLabel = this.container.querySelector('#assign-name-label');
    const confirmBtn = this.container.querySelector('#assign-confirm-btn');

    if (this.currentSeats.length === 1) {
      const s = this.currentSeats[0];
      titleEl.textContent = `Assign Seat ${s.seatCode}`;
      nameLabel.textContent = 'Guest Full Name';
      confirmBtn.textContent = 'Confirm Reservation';
      this.ticketIds[s.id] = generateTicketId();
    } else {
      titleEl.textContent = `Assign ${this.currentSeats.length} Seats`;
      nameLabel.textContent = 'Primary Contact / Group Name';
      confirmBtn.textContent = `Confirm ${this.currentSeats.length} Reservations`;
      this.currentSeats.forEach(s => {
        this.ticketIds[s.id] = generateTicketId();
      });
    }

    // Render chips
    chipsWrap.innerHTML = this.currentSeats.map(s => `
      <span class="seat-assign-chip">
        <strong>${s.seatCode}</strong>
        <span class="chip-wing">${s.wing === 'left' ? 'Left' : s.wing === 'center' ? 'Center' : 'Right'}</span>
      </span>
    `).join('');

    // Render ticket list
    ticketsList.innerHTML = this.currentSeats.map(s => `
      <div class="ticket-row-pill">
        <span class="pill-seat-code">${s.seatCode}</span>
        <span class="pill-tck font-mono">${this.ticketIds[s.id]}</span>
      </div>
    `).join('');

    nameInput.value = '';
    this.startHoldTimer();
    this.container.querySelector('#assign-backdrop').classList.add('active');
    setTimeout(() => nameInput.focus(), 150);
  }

  startHoldTimer() {
    this.stopHoldTimer();
    this.remainingSeconds = 60;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds -= 1;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        this.stopHoldTimer();
        toast.warning('Hold Expired', '60s hold time has expired. Seats returned to available.');
        this.close();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const text = this.container.querySelector('#assign-countdown');
    const bar = this.container.querySelector('#assign-progress-bar');
    if (!text || !bar) return;

    text.textContent = `${this.remainingSeconds}s`;
    const pct = Math.max(0, (this.remainingSeconds / 60) * 100);
    bar.style.width = `${pct}%`;

    if (this.remainingSeconds <= 15) {
      text.classList.add('urgent');
      bar.classList.add('urgent');
    } else {
      text.classList.remove('urgent');
      bar.classList.remove('urgent');
    }
  }

  stopHoldTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  releaseCurrentHolds() {
    this.stopHoldTimer();
    if (this.currentSeats.length > 0 && this.currentOrganizer) {
      const ids = this.currentSeats.map(s => s.id);
      syncEngine.releaseMultipleLocks(ids, this.currentOrganizer.id);
      toast.info('Hold Released', `Selected seat holds were released.`);
    }
  }

  close() {
    this.stopHoldTimer();
    const backdrop = this.container.querySelector('#assign-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    this.currentSeats = [];
  }
}
