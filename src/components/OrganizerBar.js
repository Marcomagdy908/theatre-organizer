// Organizer Collaboration Bar & Simulator Controls
import { ORGANIZERS } from '../utils/constants.js';
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class OrganizerBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentOrganizer = options.initialOrganizer || ORGANIZERS[0];
    this.onOrganizerChange = options.onOrganizerChange || (() => {});
    this.onOpenFirebaseModal = options.onOpenFirebaseModal || (() => {});
    this.onOpenActivityFeed = options.onOpenActivityFeed || (() => {});

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <header class="app-header">
        <div class="header-left">
          <div class="brand-logo">
            <div class="brand-icon">🎭</div>
            <div class="brand-text">
              <h1 class="brand-title">OPERA ROYALE</h1>
              <span class="brand-subtitle">Real-Time Theater Seat Management</span>
            </div>
          </div>

          <!-- Live Sync Status Pill -->
          <button type="button" id="header-sync-pill" class="sync-status-pill mode-mesh" title="Click to configure Firebase Firestore">
            <span class="sync-dot"></span>
            <span id="header-sync-label">Local Realtime Mesh</span>
            <span class="sync-latency">&lt;20ms</span>
          </button>
        </div>

        <div class="header-right">
          <!-- Multi-Device / Concurrent Window Launcher -->
          <div class="device-actions">
            <button type="button" class="btn btn-secondary-compact" id="btn-open-multi-window" title="Open a 2nd organizer window to test live sync side-by-side">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span>+ Open 2nd Window</span>
            </button>

            <button type="button" class="btn btn-warning-compact" id="btn-sim-conflict" title="Simulate simultaneous click collision to test atomic lock rejection">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>Test Double-Booking</span>
            </button>
          </div>

          <!-- Organizer Identity Switcher -->
          <div class="organizer-dropdown-wrapper">
            <div class="organizer-profile-pill" id="organizer-pill-trigger">
              <div class="organizer-avatar-sm" id="org-avatar-badge" style="background-color: ${this.currentOrganizer.color};">
                ${this.currentOrganizer.avatar}
              </div>
              <div class="organizer-meta">
                <span class="org-name" id="org-name-text">${this.currentOrganizer.name}</span>
                <span class="org-role" id="org-role-text">${this.currentOrganizer.badge}</span>
              </div>
              <svg class="dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <!-- Switcher Menu -->
            <div class="organizer-menu" id="organizer-menu">
              <div class="menu-header">Switch Active Organizer Session</div>
              ${ORGANIZERS.map(org => `
                <button type="button" class="org-menu-item ${org.id === this.currentOrganizer.id ? 'selected' : ''}" data-org-id="${org.id}">
                  <span class="org-menu-avatar" style="background-color: ${org.color};">${org.avatar}</span>
                  <div class="org-menu-info">
                    <span class="org-menu-name">${org.name}</span>
                    <span class="org-menu-desc">${org.role}</span>
                  </div>
                  ${org.id === this.currentOrganizer.id ? '<span class="check-mark">✓</span>' : ''}
                </button>
              `).join('')}
              <div class="menu-divider"></div>
              <button type="button" class="org-menu-item item-reset" id="btn-menu-reset-venue">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset Venue Layout</span>
              </button>
            </div>
          </div>

          <!-- Activity Log Toggle -->
          <button type="button" class="btn-icon-activity" id="btn-toggle-activity" title="Live Audit Activity Feed">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span class="pulse-badge"></span>
          </button>
        </div>
      </header>
    `;
  }

  bindEvents() {
    const trigger = this.container.querySelector('#organizer-pill-trigger');
    const menu = this.container.querySelector('#organizer-menu');
    const orgItems = this.container.querySelectorAll('.org-menu-item[data-org-id]');
    const resetBtn = this.container.querySelector('#btn-menu-reset-venue');
    const syncPill = this.container.querySelector('#header-sync-pill');
    const openMultiBtn = this.container.querySelector('#btn-open-multi-window');
    const simConflictBtn = this.container.querySelector('#btn-sim-conflict');
    const activityBtn = this.container.querySelector('#btn-toggle-activity');

    // Toggle menu
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      menu.classList.remove('active');
    });

    // Select organizer
    orgItems.forEach(item => {
      item.addEventListener('click', () => {
        const orgId = item.dataset.orgId;
        const targetOrg = ORGANIZERS.find(o => o.id === orgId);
        if (targetOrg) {
          this.setOrganizer(targetOrg);
          this.onOrganizerChange(targetOrg);
          toast.info('Session Switched', `Logged in as ${targetOrg.name} (${targetOrg.badge})`);
        }
        menu.classList.remove('active');
      });
    });

    // Reset venue
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset all 160 seats back to initial state? This will clear all ongoing holds and custom bookings.')) {
        await syncEngine.resetAllSeats();
        toast.info('Venue Reset', 'Seating map re-initialized.');
        menu.classList.remove('active');
      }
    });

    // Firebase Modal
    syncPill.addEventListener('click', () => {
      this.onOpenFirebaseModal();
    });

    // Activity Log
    activityBtn.addEventListener('click', () => {
      this.onOpenActivityFeed();
    });

    // Open Second Window for Live Sync Demo
    openMultiBtn.addEventListener('click', () => {
      const nextOrg = this.currentOrganizer.id === 'org_alice' ? 'org_bob' : 'org_alice';
      const url = `${window.location.origin}${window.location.pathname}?org=${nextOrg}`;
      window.open(url, '_blank', 'width=1100,height=800');
      toast.success('Simulated Window Opened', 'Position windows side-by-side to see instant real-time hold syncing!');
    });

    // Simulate Race Condition Double-Booking Prevention
    simConflictBtn.addEventListener('click', async () => {
      // Find an available seat
      const seats = syncEngine.getSeats();
      const availableSeat = Object.values(seats).find(s => s.status === 'available');
      if (!availableSeat) {
        toast.warning('No Available Seat', 'Please free at least one seat to test race condition.');
        return;
      }

      toast.info('Simulating Collision', `Organizer Alice and Organizer Bob clicking ${availableSeat.seatCode} at the exact same millisecond...`);

      // Simultaneous lock attempts
      const orgA = ORGANIZERS[0]; // Alice
      const orgB = ORGANIZERS[1]; // Bob

      const [resA, resB] = await Promise.all([
        syncEngine.acquireSeatLock(availableSeat.id, orgA),
        syncEngine.acquireSeatLock(availableSeat.id, orgB)
      ]);

      if (resA.success && !resB.success) {
        toast.success('Winner: Alice', `Alice successfully acquired lock on ${availableSeat.seatCode}.`);
        toast.conflict(`Collision Rejection: Bob's request rejected! "${resB.error}"`);
      } else if (resB.success && !resA.success) {
        toast.success('Winner: Bob', `Bob successfully acquired lock on ${availableSeat.seatCode}.`);
        toast.conflict(`Collision Rejection: Alice's request rejected! "${resA.error}"`);
      }
    });
  }

  setOrganizer(org) {
    this.currentOrganizer = org;
    const avatarBadge = this.container.querySelector('#org-avatar-badge');
    const nameText = this.container.querySelector('#org-name-text');
    const roleText = this.container.querySelector('#org-role-text');

    if (avatarBadge) {
      avatarBadge.style.backgroundColor = org.color;
      avatarBadge.textContent = org.avatar;
    }
    if (nameText) nameText.textContent = org.name;
    if (roleText) roleText.textContent = org.badge;

    // Update selected in menu
    const items = this.container.querySelectorAll('.org-menu-item[data-org-id]');
    items.forEach(item => {
      if (item.dataset.orgId === org.id) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }

  updateSyncStatus(mode) {
    const syncPill = this.container.querySelector('#header-sync-pill');
    const syncLabel = this.container.querySelector('#header-sync-label');

    if (mode === 'firebase') {
      syncPill.className = 'sync-status-pill mode-firebase';
      syncLabel.textContent = 'Firebase Firestore (Live)';
    } else {
      syncPill.className = 'sync-status-pill mode-mesh';
      syncLabel.textContent = 'Local Realtime Mesh';
    }
  }
}
