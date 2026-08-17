// Floating Multi-Seat Selection Dock Bar
export class SelectionDock {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.selectedSeats = [];
    this.onReserveClick = options.onReserveClick || (() => {});
    this.onClearClick = options.onClearClick || (() => {});

    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="selection-dock ${this.selectedSeats.length > 0 ? 'visible' : ''}" id="selection-dock">
        <div class="selection-dock-inner">
          <div class="selection-dock-info">
            <div class="selection-count-badge">
              <span id="dock-count">0</span>
            </div>
            <div class="selection-meta">
              <span class="dock-title">Seats Selected</span>
              <div class="dock-chips" id="dock-chips"></div>
            </div>
          </div>

          <div class="selection-dock-actions">
            <button type="button" class="btn btn-ghost btn-sm" id="dock-clear-btn">
              Clear
            </button>
            <button type="button" class="btn btn-primary" id="dock-reserve-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              <span id="dock-reserve-btn-text">Reserve Selected</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const clearBtn = this.container.querySelector('#dock-clear-btn');
    const reserveBtn = this.container.querySelector('#dock-reserve-btn');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.onClearClick();
      });
    }

    if (reserveBtn) {
      reserveBtn.addEventListener('click', () => {
        if (this.selectedSeats.length > 0) {
          this.onReserveClick(this.selectedSeats);
        }
      });
    }
  }

  updateSelection(seats) {
    this.selectedSeats = seats;
    const dockEl = this.container.querySelector('#selection-dock');
    const countEl = this.container.querySelector('#dock-count');
    const chipsEl = this.container.querySelector('#dock-chips');
    const reserveBtnText = this.container.querySelector('#dock-reserve-btn-text');

    if (!dockEl) return;

    if (seats.length > 0) {
      dockEl.classList.add('visible');
      if (countEl) countEl.textContent = seats.length;
      if (reserveBtnText) reserveBtnText.textContent = `Reserve ${seats.length} ${seats.length === 1 ? 'Seat' : 'Seats'}`;

      if (chipsEl) {
        chipsEl.innerHTML = seats.map(s => `
          <span class="dock-seat-chip">${s.seatCode}</span>
        `).join('');
      }
    } else {
      dockEl.classList.remove('visible');
    }
  }

  clear() {
    this.updateSelection([]);
  }
}
