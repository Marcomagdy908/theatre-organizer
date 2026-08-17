// Organizer Bar & Live Sync Status
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class OrganizerBar {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.currentOrganizer = options.initialOrganizer;
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
              <h1 class="brand-title">SEF_امرا جديدا</h1>
              <span class="brand-subtitle">Real-Time Theater Seat Management</span>
            </div>
          </div>

          <!-- Live Sync Status Pill -->
          <button type="button" id="header-sync-pill" class="sync-status-pill mode-rtdb" title="Click to view/configure Firebase connection">
            <span class="sync-dot"></span>
            <span id="header-sync-label">Firebase Realtime Sync</span>
            <span class="sync-latency">&lt;50ms</span>
          </button>
        </div>

        <div class="header-right">
          <!-- Organizer Profile Badge -->
          <div class="organizer-profile-pill" id="organizer-pill-display" title="Your Organizer Session">
            <div class="organizer-avatar-sm" id="org-avatar-badge" style="background-color: ${this.currentOrganizer.color};">
              ${this.currentOrganizer.avatar}
            </div>
            <div class="organizer-meta">
              <span class="org-name" id="org-name-text">${this.currentOrganizer.name}</span>
              <span class="org-role" id="org-role-text">${this.currentOrganizer.badge}</span>
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
    const syncPill = this.container.querySelector('#header-sync-pill');
    const activityBtn = this.container.querySelector('#btn-toggle-activity');

    // Firebase Modal
    if (syncPill) {
      syncPill.addEventListener('click', () => {
        this.onOpenFirebaseModal();
      });
    }

    // Activity Log
    if (activityBtn) {
      activityBtn.addEventListener('click', () => {
        this.onOpenActivityFeed();
      });
    }
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
  }

  updateSyncStatus(mode) {
    const syncPill = this.container.querySelector('#header-sync-pill');
    const syncLabel = this.container.querySelector('#header-sync-label');
    if (!syncPill || !syncLabel) return;

    if (mode === 'rtdb') {
      syncPill.className = 'sync-status-pill mode-rtdb';
      syncLabel.textContent = 'Firebase Realtime DB';
    } else if (mode === 'firestore') {
      syncPill.className = 'sync-status-pill mode-firebase';
      syncLabel.textContent = 'Firebase Firestore';
    } else {
      syncPill.className = 'sync-status-pill mode-mesh';
      syncLabel.textContent = 'Local Realtime Mesh';
    }
  }
}
