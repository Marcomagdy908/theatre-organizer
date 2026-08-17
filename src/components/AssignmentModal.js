// Assignment Modal (Hold state with 60-second TTL countdown & fast name/ID entry)
import { generateTicketId, LOCK_TTL_MS } from '../utils/constants.js';
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class AssignmentModal {
  constructor(containerId, onComplete) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.onComplete = onComplete;
    this.currentSeat = null;
    this.currentOrganizer = null;
    this.timerInterval = null;
    this.ticketId = '';

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="assign-backdrop">
        <div class="modal-card modal-assign animate-pop-in">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-badge-hold">
                <span class="pulse-dot"></span>
                <span>Active Hold</span>
              </div>
              <h2 class="modal-title" id="assign-seat-title">Assign Seat</h2>
              <p class="modal-subtitle" id="assign-seat-desc">Lock active for 60s. Enter guest details to confirm reservation.</p>
            </div>
            <button class="modal-close-btn" id="assign-close-btn" title="Release Hold & Close">&times;</button>
          </div>

          <!-- TTL Hold Countdown Bar -->
          <div class="ttl-countdown-container">
            <div class="ttl-bar-header">
              <span class="ttl-label">Hold Expiration:</span>
              <span class="ttl-countdown-text" id="assign-ttl-text">60s</span>
            </div>
            <div class="ttl-progress-track">
              <div class="ttl-progress-fill" id="assign-ttl-fill" style="width: 100%;"></div>
            </div>
          </div>

          <!-- Seat Summary Card -->
          <div class="seat-summary-grid">
            <div class="summary-item">
              <span class="item-label">Section</span>
              <span class="item-val" id="assign-summary-section">Part 1</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Seat Code</span>
              <span class="item-val highlight" id="assign-summary-code">A19</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Row</span>
              <span class="item-val" id="assign-summary-row">Row A</span>
            </div>
            <div class="summary-item">
              <span class="item-label">Wing / Column</span>
              <span class="item-val" id="assign-summary-wing">Left Wing</span>
            </div>
          </div>

          <!-- Form Fields (Name & Generated Ticket ID only) -->
          <form id="assign-form" class="assign-form" autocomplete="off">
            <div class="form-group">
              <label for="assign-guest-name" class="form-label">
                <span>Guest Full Name</span>
                <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input 
                  type="text" 
                  id="assign-guest-name" 
                  class="form-input" 
                  placeholder="e.g. Sarah Connor" 
                  required 
                  autofocus
                />
              </div>
            </div>

            <div class="form-group">
              <label for="assign-ticket-id" class="form-label">
                <span>Ticket Code (Auto-Generated)</span>
                <span class="code-tag">System ID</span>
              </label>
              <div class="input-group-addon">
                <div class="input-wrapper flex-1">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <input 
                    type="text" 
                    id="assign-ticket-id" 
                    class="form-input font-mono" 
                    readonly
                  />
                </div>
                <button type="button" class="btn-addon" id="assign-regen-btn" title="Generate New Ticket ID">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  <span>New ID</span>
                </button>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" id="assign-cancel-btn">
                Release Hold
              </button>
              <div class="action-group-right">
                <button type="submit" class="btn btn-secondary" id="assign-checkin-btn">
                  Reserve & Check-In
                </button>
                <button type="submit" class="btn btn-primary" id="assign-confirm-btn">
                  Confirm Reservation
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
    const regenBtn = this.container.querySelector('#assign-regen-btn');
    const form = this.container.querySelector('#assign-form');
    const checkinBtn = this.container.querySelector('#assign-checkin-btn');

    const handleClose = () => {
      if (this.currentSeat && this.currentOrganizer) {
        syncEngine.releaseSeatLock(this.currentSeat.id, this.currentOrganizer.id);
        toast.info('Hold Released', `Seat ${this.currentSeat.seatCode} is now available.`);
      }
      this.close();
    };

    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) handleClose();
    });

    regenBtn.addEventListener('click', () => {
      this.ticketId = generateTicketId();
      this.container.querySelector('#assign-ticket-id').value = this.ticketId;
    });

    let isAutoCheckIn = false;
    checkinBtn.addEventListener('click', () => {
      isAutoCheckIn = true;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = this.container.querySelector('#assign-guest-name');
      const name = nameInput.value.trim();

      if (!name) {
        toast.error('Name Required', 'Please enter the attendee full name.');
        nameInput.focus();
        return;
      }

      const attendeeData = {
        name,
        ticketId: this.ticketId
      };

      const result = await syncEngine.reserveSeat(
        this.currentSeat.id, 
        attendeeData, 
        this.currentOrganizer, 
        isAutoCheckIn
      );

      if (result.success) {
        toast.success(
          isAutoCheckIn ? 'Reserved & Checked In!' : 'Seat Reserved!',
          `Seat ${this.currentSeat.seatCode} assigned to ${attendeeData.name} (${attendeeData.ticketId})`
        );
        this.close(true);
        if (this.onComplete) this.onComplete(result.seat);
      } else {
        toast.conflict(result.error);
        this.close(true);
      }
    });
  }

  open(seat, organizer) {
    this.currentSeat = seat;
    this.currentOrganizer = organizer;
    this.ticketId = generateTicketId();

    const title = this.container.querySelector('#assign-seat-title');
    const desc = this.container.querySelector('#assign-seat-desc');
    const summarySection = this.container.querySelector('#assign-summary-section');
    const summaryCode = this.container.querySelector('#assign-summary-code');
    const summaryRow = this.container.querySelector('#assign-summary-row');
    const summaryWing = this.container.querySelector('#assign-summary-wing');
    const nameInput = this.container.querySelector('#assign-guest-name');
    const ticketInput = this.container.querySelector('#assign-ticket-id');

    const wingLabel = seat.wing === 'left' ? 'Left Wing (Odds)' : seat.wing === 'center' ? 'Center Section' : 'Right Wing (Evens)';

    title.textContent = `Assign Seat ${seat.seatCode}`;
    desc.textContent = `Held by ${organizer.name}. Finalize attendee details before the 60s hold expires.`;
    summarySection.textContent = seat.section || 'Auditorium';
    summaryCode.textContent = seat.seatCode;
    summaryRow.textContent = `Row ${seat.row}`;
    summaryWing.textContent = wingLabel;
    
    nameInput.value = '';
    ticketInput.value = this.ticketId;

    this.container.querySelector('#assign-backdrop').classList.add('active');
    setTimeout(() => nameInput.focus(), 150);

    this.startCountdown();
  }

  startCountdown() {
    clearInterval(this.timerInterval);
    const ttlText = this.container.querySelector('#assign-ttl-text');
    const ttlFill = this.container.querySelector('#assign-ttl-fill');

    const updateTimer = () => {
      if (!this.currentSeat || !this.currentSeat.lockedUntil) return;
      const remainingMs = this.currentSeat.lockedUntil - Date.now();

      if (remainingMs <= 0) {
        clearInterval(this.timerInterval);
        toast.warning('Hold Expired', `Your 60-second hold on Seat ${this.currentSeat.seatCode} has expired.`);
        this.close(true);
        return;
      }

      const seconds = Math.ceil(remainingMs / 1000);
      const percent = Math.max(0, Math.min(100, (remainingMs / LOCK_TTL_MS) * 100));

      ttlText.textContent = `${seconds}s`;
      ttlFill.style.width = `${percent}%`;

      if (seconds <= 15) {
        ttlFill.classList.add('urgent');
        ttlText.classList.add('urgent');
      } else {
        ttlFill.classList.remove('urgent');
        ttlText.classList.remove('urgent');
      }
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 500);
  }

  close(skipRelease = false) {
    clearInterval(this.timerInterval);
    const backdrop = this.container.querySelector('#assign-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    this.currentSeat = null;
  }
}
