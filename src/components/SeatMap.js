// Interactive Visual Theater Grid Component
// Renders Exact Theater Layout: Rows A-Q with Left Wing (Odds), Center Section, and Right Wing (Evens)
// Supports Mobile Touch Scaling, Zoom Controls & Column Wing Focused Views
import { THEATER_ROW_DEFINITIONS } from '../utils/constants.js';

export class SeatMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.seats = {};
    this.activeSection = 'all'; // 'all' | 'part1' | 'part2'
    this.activeWing = 'all'; // 'all' | 'left' | 'center' | 'right'
    this.zoomLevel = 1.0; // 0.75, 1.0, 1.25
    this.statusFilter = 'all'; // 'all' | 'available' | 'locked' | 'reserved' | 'checked_in'
    this.highlightedSeatId = null;
    this.currentOrganizer = options.currentOrganizer || null;
    this.onSeatClick = options.onSeatClick || (() => {});
    
    this.tooltipEl = null;
    this.createTooltip();
    this.bindGlobalEvents();
  }

  createTooltip() {
    let el = document.getElementById('seat-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'seat-tooltip';
      el.className = 'seat-tooltip';
      document.body.appendChild(el);
    }
    this.tooltipEl = el;
  }

  bindGlobalEvents() {
    window.addEventListener('mousemove', (e) => {
      if (this.tooltipEl && this.tooltipEl.classList.contains('visible')) {
        this.positionTooltip(e.clientX, e.clientY);
      }
    });
  }

  positionTooltip(x, y) {
    const offset = 16;
    const tt = this.tooltipEl;
    let left = x + offset;
    let top = y + offset;

    if (left + 230 > window.innerWidth) {
      left = x - 240;
    }
    if (top + 170 > window.innerHeight) {
      top = y - 180;
    }

    tt.style.left = `${left}px`;
    tt.style.top = `${top}px`;
  }

  updateData(seats, currentOrganizer) {
    this.seats = seats;
    this.currentOrganizer = currentOrganizer;
    this.render();
  }

  setSection(section) {
    this.activeSection = section;
    this.render();
  }

  setWing(wing) {
    this.activeWing = wing;
    this.render();
  }

  setZoom(zoom) {
    this.zoomLevel = zoom;
    const gridWrapper = this.container.querySelector('.theater-seating-scroll-wrapper');
    if (gridWrapper) {
      gridWrapper.style.setProperty('--grid-zoom', zoom);
    }
    const zoomPills = this.container.querySelectorAll('.zoom-btn');
    zoomPills.forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.zoom) === zoom);
    });
  }

  setStatusFilter(filter) {
    this.statusFilter = filter;
    this.render();
  }

  highlightSeat(seatId) {
    this.highlightedSeatId = seatId;
    const seat = this.seats[seatId];
    if (seat) {
      const isPart1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(seat.row);
      const targetSec = isPart1 ? 'part1' : 'part2';
      if (this.activeSection !== 'all' && this.activeSection !== targetSec) {
        this.activeSection = targetSec;
      }
      if (this.activeWing !== 'all' && this.activeWing !== seat.wing) {
        this.activeWing = 'all';
      }
      this.render();
      setTimeout(() => {
        const el = document.getElementById(`seat-btn-${seatId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          el.classList.add('radar-pulse');
          setTimeout(() => el.classList.remove('radar-pulse'), 5000);
        }
      }, 100);
    }
  }

  render() {
    if (!this.container) return;

    const rowsToRender = this.getRowsToRender();

    this.container.innerHTML = `
      <div class="theater-stage-container">
        <div class="stage-spotlight-left"></div>
        <div class="stage-spotlight-right"></div>
        <div class="stage-arch">
          <div class="stage-surface">
            <span class="stage-text">STAGE & PERFORMANCE AREA</span>
          </div>
        </div>
      </div>

      <!-- Mobile & Responsive Controls Bar -->
      <div class="grid-controls-bar">
        <!-- Wing Focus Navigation (Especially handy on Mobile) -->
        <div class="wing-focus-nav">
          <div class="wing-pills-group">
            <button type="button" class="wing-pill ${this.activeWing === 'all' ? 'active' : ''}" data-wing="all">
              All Columns
            </button>
            <button type="button" class="wing-pill ${this.activeWing === 'left' ? 'active' : ''}" data-wing="left">
              Left (Odds)
            </button>
            <button type="button" class="wing-pill ${this.activeWing === 'center' ? 'active' : ''}" data-wing="center">
              Center
            </button>
            <button type="button" class="wing-pill ${this.activeWing === 'right' ? 'active' : ''}" data-wing="right">
              Right (Evens)
            </button>
          </div>
        </div>

        <!-- Mobile Touch Scale Zoom Controller -->
        <div class="zoom-controls-group">
          <button type="button" class="zoom-btn ${this.zoomLevel === 0.8 ? 'active' : ''}" data-zoom="0.8" title="Fit Overview">
            Fit
          </button>
          <button type="button" class="zoom-btn ${this.zoomLevel === 1.0 ? 'active' : ''}" data-zoom="1.0" title="Normal 100%">
            1x
          </button>
          <button type="button" class="zoom-btn ${this.zoomLevel === 1.25 ? 'active' : ''}" data-zoom="1.25" title="Large Touch (Easy Tap)">
            Large
          </button>
        </div>
      </div>

      <!-- Column Labels Guide (Desktop) -->
      <div class="theater-column-guide desktop-only">
        <div class="guide-col guide-left">
          <span class="guide-title">LEFT WING</span>
          <span class="guide-sub">Odd Numbers (11 - 31)</span>
        </div>
        <div class="guide-col guide-center">
          <span class="guide-title">CENTER SECTION</span>
          <span class="guide-sub">Continuous Flow (9,7..1 | 2..10)</span>
        </div>
        <div class="guide-col guide-right">
          <span class="guide-title">RIGHT WING</span>
          <span class="guide-sub">Even Numbers (10 - 30)</span>
        </div>
      </div>

      <!-- Scrollable Grid Container with Dynamic Zoom -->
      <div class="theater-seating-scroll-wrapper" style="--grid-zoom: ${this.zoomLevel};">
        <div class="theater-seating-layout ${this.activeWing !== 'all' ? 'is-focused-wing' : ''}">
          ${this.renderPart('Part 1: Front Section (Rows A – H)', rowsToRender.filter(r => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(r.row)))}
          ${this.renderPart('Part 2: Rear Section (Rows I – Q)', rowsToRender.filter(r => ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].includes(r.row)))}
        </div>
      </div>
    `;

    this.bindSeatEvents();
    this.bindControlsEvents();
  }

  bindControlsEvents() {
    // Wing tabs
    const pills = this.container.querySelectorAll('.wing-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.setWing(pill.dataset.wing);
      });
    });

    // Zoom buttons
    const zoomBtns = this.container.querySelectorAll('.zoom-btn');
    zoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setZoom(parseFloat(btn.dataset.zoom));
      });
    });
  }

  getRowsToRender() {
    if (this.activeSection === 'part1') {
      return THEATER_ROW_DEFINITIONS.filter(r => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(r.row));
    }
    if (this.activeSection === 'part2') {
      return THEATER_ROW_DEFINITIONS.filter(r => ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].includes(r.row));
    }
    return THEATER_ROW_DEFINITIONS;
  }

  renderPart(partTitle, rows) {
    if (rows.length === 0) return '';
    const isFront = partTitle.includes('Part 1');

    return `
      <div class="theater-section ${isFront ? 'section-part1' : 'section-part2'}">
        <div class="section-header">
          <div class="section-title-wrap">
            <span class="section-indicator ${isFront ? 'vip-gold' : ''}"></span>
            <h3 class="section-title">${partTitle}</h3>
          </div>
          <span class="section-badge">${isFront ? 'Front Tier' : 'Rear Tier'}</span>
        </div>

        <div class="section-grid">
          ${rows.map(rowDef => this.renderTheaterRow(rowDef)).join('')}
        </div>
      </div>
    `;
  }

  renderTheaterRow(rowDef) {
    const { row, left, center, right } = rowDef;

    const centerOdds = center.filter(n => n % 2 !== 0);
    const centerEvens = center.filter(n => n % 2 === 0);

    const showLeft = this.activeWing === 'all' || this.activeWing === 'left';
    const showCenter = this.activeWing === 'all' || this.activeWing === 'center';
    const showRight = this.activeWing === 'all' || this.activeWing === 'right';

    return `
      <div class="seat-row-3col" data-row="${row}">
        <!-- Left Row Letter -->
        <span class="row-label row-label-left">${row}</span>

        <!-- 1. Left Wing (Odd Numbers decreasing) -->
        ${showLeft ? `
          <div class="wing-group wing-left">
            ${left.map(num => this.renderSeatNodeByCode(row, num)).join('')}
          </div>
        ` : ''}

        <!-- Left Aisle -->
        ${showLeft && showCenter ? `
          <div class="row-aisle">
            <span class="aisle-marker">|</span>
          </div>
        ` : ''}

        <!-- 2. Center Section -->
        ${showCenter ? `
          <div class="wing-group wing-center ${center.length === 0 ? 'wing-center-empty' : ''}">
            ${center.length > 0 ? `
              <div class="center-subgroup center-odds">
                ${centerOdds.map(num => this.renderSeatNodeByCode(row, num)).join('')}
              </div>
              <div class="center-subgroup center-evens">
                ${centerEvens.map(num => this.renderSeatNodeByCode(row, num)).join('')}
              </div>
            ` : `
              <div class="center-open-walkway">
                <span>— Walkway (${row}) —</span>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Right Aisle -->
        ${showCenter && showRight ? `
          <div class="row-aisle">
            <span class="aisle-marker">|</span>
          </div>
        ` : ''}

        <!-- 3. Right Wing (Even Numbers increasing) -->
        ${showRight ? `
          <div class="wing-group wing-right">
            ${right.map(num => this.renderSeatNodeByCode(row, num)).join('')}
          </div>
        ` : ''}

        <!-- Right Row Letter -->
        <span class="row-label row-label-right">${row}</span>
      </div>
    `;
  }

  renderSeatNodeByCode(row, num) {
    const seatId = `seat_${row}_${num}`;
    const seat = this.seats[seatId] || {
      id: seatId,
      seatCode: `${row}${num}`,
      row,
      number: num,
      status: 'available',
      tier: 'Standard'
    };

    const isFilteredOut = this.statusFilter !== 'all' && seat.status !== this.statusFilter;
    const isHighlighted = this.highlightedSeatId === seat.id;
    const isHeldByMe = seat.status === 'locked' && seat.lockedBy?.organizerId === this.currentOrganizer?.id;
    const isHeldByOther = seat.status === 'locked' && !isHeldByMe;

    let statusClass = `status-${seat.status}`;
    if (isHeldByMe) statusClass += ' held-by-me';
    if (isHeldByOther) statusClass += ' held-by-other';
    if (isFilteredOut) statusClass += ' is-dimmed';
    if (isHighlighted) statusClass += ' is-highlighted';

    let innerBadge = `<span class="seat-num">${num}</span>`;
    let lockCountdown = '';

    if (seat.status === 'locked') {
      const remainingSecs = Math.max(0, Math.ceil(((seat.lockedUntil || Date.now()) - Date.now()) / 1000));
      lockCountdown = `<span class="seat-lock-badge">${remainingSecs}s</span>`;
      innerBadge = `<span class="seat-lock-icon">⏳</span>`;
    } else if (seat.status === 'checked_in') {
      innerBadge = `<span class="seat-check-icon">✓</span>`;
    } else if (seat.status === 'reserved') {
      const initials = (seat.assignedTo?.name || 'R').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      innerBadge = `<span class="seat-initials">${initials}</span>`;
    }

    return `
      <button 
        type="button"
        id="seat-btn-${seat.id}"
        class="seat-node ${statusClass}"
        data-seat-id="${seat.id}"
        aria-label="Seat ${seat.seatCode}, ${seat.status}"
      >
        <span class="seat-chair-back"></span>
        <span class="seat-chair-cushion">
          ${innerBadge}
        </span>
        ${lockCountdown}
        ${seat.isAccessible ? '<span class="seat-acc-icon">♿</span>' : ''}
      </button>
    `;
  }

  bindSeatEvents() {
    const seatButtons = this.container.querySelectorAll('.seat-node');

    seatButtons.forEach(btn => {
      const seatId = btn.dataset.seatId;
      const seat = this.seats[seatId];
      if (!seat) return;

      btn.addEventListener('mouseenter', (e) => this.showTooltip(seat, e));
      btn.addEventListener('mouseleave', () => this.hideTooltip());
      btn.addEventListener('click', () => {
        this.hideTooltip();
        this.onSeatClick(seat);
      });
    });
  }

  showTooltip(seat, event) {
    if (!this.tooltipEl) return;

    let statusLabel = 'Available';
    let statusClass = 'tt-avail';
    let extraDetail = '';

    if (seat.status === 'locked') {
      const secs = Math.max(0, Math.ceil(((seat.lockedUntil || Date.now()) - Date.now()) / 1000));
      const holder = seat.lockedBy ? seat.lockedBy.name : 'Another organizer';
      statusLabel = `Hold (${secs}s left)`;
      statusClass = 'tt-locked';
      extraDetail = `
        <div class="tt-row"><span class="tt-k">Held By:</span> <span class="tt-v text-amber">${holder}</span></div>
      `;
    } else if (seat.status === 'reserved') {
      statusLabel = 'Reserved';
      statusClass = 'tt-res';
      extraDetail = `
        <div class="tt-row"><span class="tt-k">Guest:</span> <span class="tt-v highlight">${seat.assignedTo?.name || 'N/A'}</span></div>
        <div class="tt-row"><span class="tt-k">Ticket:</span> <span class="tt-v font-mono">${seat.assignedTo?.ticketId || 'N/A'}</span></div>
      `;
    } else if (seat.status === 'checked_in') {
      statusLabel = 'Checked In';
      statusClass = 'tt-check';
      extraDetail = `
        <div class="tt-row"><span class="tt-k">Guest:</span> <span class="tt-v highlight">${seat.assignedTo?.name || 'N/A'}</span></div>
        <div class="tt-row"><span class="tt-k">Ticket:</span> <span class="tt-v font-mono">${seat.assignedTo?.ticketId || 'N/A'}</span></div>
        <div class="tt-row"><span class="tt-k">Status:</span> <span class="tt-v text-purple">Verified at Gate</span></div>
      `;
    }

    const wingLabel = seat.wing === 'left' ? 'Left Wing (Odds)' : seat.wing === 'center' ? 'Center Section' : 'Right Wing (Evens)';
    this.tooltipEl.innerHTML = `
      <div class="tt-header">
        <div class="tt-seat-code">Seat ${seat.seatCode}</div>
        <span class="tt-status-pill ${statusClass}">${statusLabel}</span>
      </div>
      <div class="tt-body">
        <div class="tt-row"><span class="tt-k">Section:</span> <span class="tt-v">${seat.section || 'Auditorium'}</span></div>
        <div class="tt-row"><span class="tt-k">Position:</span> <span class="tt-v">${wingLabel}</span></div>
        ${extraDetail}
      </div>
      <div class="tt-footer">
        ${seat.status === 'available' ? 'Tap to Lock & Assign' : 'Tap to View / Manage'}
      </div>
    `;

    this.tooltipEl.classList.add('visible');
    this.positionTooltip(event.clientX, event.clientY);
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible');
    }
  }
}
