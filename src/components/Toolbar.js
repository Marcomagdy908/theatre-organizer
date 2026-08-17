// Top Toolbar with Live Search, Section Tabs, and Status Filter Pills

export class Toolbar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.onSearch = options.onSearch || (() => {});
    this.onSectionChange = options.onSectionChange || (() => {});
    this.onFilterChange = options.onFilterChange || (() => {});
    
    this.activeSection = 'all';
    this.activeFilter = 'all';
    this.seats = {};

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="toolbar-wrapper">
        <!-- Search & Filter Row -->
        <div class="toolbar-top-row">
          <!-- Search Input with Auto-Highlight -->
          <div class="search-box-wrap">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              id="toolbar-search-input" 
              class="toolbar-search-input" 
              placeholder="Search guest name, ticket code (e.g. TCK-8821), or seat (e.g. B7, A19)..." 
              autocomplete="off"
            />
            <button type="button" id="search-clear-btn" class="search-clear-btn hidden">&times;</button>
          </div>

          <!-- Section Switcher Tabs (Part 1 & Part 2) -->
          <div class="section-tabs-wrap">
            <button type="button" class="sec-tab active" data-section="all">
              <span>All Rows (A–Q)</span>
            </button>
            <button type="button" class="sec-tab" data-section="part1">
              <span>Part 1: Front (A–H)</span>
            </button>
            <button type="button" class="sec-tab" data-section="part2">
              <span>Part 2: Rear (I–Q)</span>
            </button>
          </div>
        </div>

        <!-- Status Filter Pills with Live Counters -->
        <div class="status-filters-row">
          <div class="filter-pills-group">
            <button type="button" class="filter-pill active" data-filter="all">
              <span class="pill-dot dot-all"></span>
              <span>All Seats</span>
              <span class="pill-count" id="count-all">0</span>
            </button>
            <button type="button" class="filter-pill pill-avail" data-filter="available">
              <span class="pill-dot dot-avail"></span>
              <span>Available</span>
              <span class="pill-count" id="count-avail">0</span>
            </button>
            <button type="button" class="filter-pill pill-locked" data-filter="locked">
              <span class="pill-dot dot-locked"></span>
              <span>Held / Locked</span>
              <span class="pill-count" id="count-locked">0</span>
            </button>
            <button type="button" class="filter-pill pill-res" data-filter="reserved">
              <span class="pill-dot dot-res"></span>
              <span>Reserved</span>
              <span class="pill-count" id="count-res">0</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const searchInput = this.container.querySelector('#toolbar-search-input');
    const clearBtn = this.container.querySelector('#search-clear-btn');
    const sectionTabs = this.container.querySelectorAll('.sec-tab');
    const filterPills = this.container.querySelectorAll('.filter-pill');

    // Live search handling
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q) {
        clearBtn.classList.remove('hidden');
      } else {
        clearBtn.classList.add('hidden');
      }
      this.onSearch(q);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.add('hidden');
      searchInput.focus();
      this.onSearch('');
    });

    // Section Tab Switching
    sectionTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        sectionTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeSection = tab.dataset.section;
        this.onSectionChange(this.activeSection);
      });
    });

    // Status Filter Switching
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.dataset.filter;
        this.onFilterChange(this.activeFilter);
      });
    });
  }

  updateCounts(seats) {
    this.seats = seats;
    const seatArr = Object.values(seats);
    
    const total = seatArr.length;
    const avail = seatArr.filter(s => s.status === 'available').length;
    const locked = seatArr.filter(s => s.status === 'locked').length;
    const res = seatArr.filter(s => s.status === 'reserved' || s.status === 'checked_in').length;

    const countAll = this.container.querySelector('#count-all');
    const countAvail = this.container.querySelector('#count-avail');
    const countLocked = this.container.querySelector('#count-locked');
    const countRes = this.container.querySelector('#count-res');

    if (countAll) countAll.textContent = total;
    if (countAvail) countAvail.textContent = avail;
    if (countLocked) countLocked.textContent = locked;
    if (countRes) countRes.textContent = res;
  }
}
