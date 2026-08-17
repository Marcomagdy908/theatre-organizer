// Real-Time Audit Activity Feed Drawer

export class ActivityFeed {
  constructor(containerId) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.logs = [];
    this.isOpen = false;

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="activity-drawer-backdrop" id="activity-backdrop">
        <aside class="activity-drawer" id="activity-drawer">
          <div class="activity-header">
            <div class="activity-title-wrap">
              <div class="live-dot-ping"></div>
              <h3>Live Activity & Audit Trail</h3>
            </div>
            <button type="button" class="btn-close-drawer" id="activity-close-btn">&times;</button>
          </div>

          <div class="activity-meta-bar">
            <span class="activity-subtitle">Sub-100ms real-time event logs across all organizers</span>
          </div>

          <div class="activity-list" id="activity-list-container">
            <!-- Rendered logs -->
          </div>
        </aside>
      </div>
    `;
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#activity-backdrop');
    const closeBtn = this.container.querySelector('#activity-close-btn');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });
  }

  updateLogs(logs) {
    this.logs = logs;
    const listEl = this.container.querySelector('#activity-list-container');
    if (!listEl) return;

    if (logs.length === 0) {
      listEl.innerHTML = `<div class="activity-empty">No activity recorded yet</div>`;
      return;
    }

    listEl.innerHTML = logs.map(log => {
      const timeStr = this.formatTime(log.time);
      const icon = this.getLogIcon(log.type);
      return `
        <div class="activity-item log-type-${log.type}">
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <p class="activity-text">${log.text}</p>
            <span class="activity-time">${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  formatTime(timestamp) {
    if (!timestamp) return 'just now';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getLogIcon(type) {
    switch (type) {
      case 'lock':
        return `<span style="color: #F59E0B;">⏳</span>`;
      case 'booking':
        return `<span style="color: #10B981;">🎟️</span>`;
      case 'checkin':
        return `<span style="color: #8B5CF6;">✓</span>`;
      case 'cancel':
        return `<span style="color: #EF4444;">✕</span>`;
      default:
        return `<span style="color: #6366F1;">⚡</span>`;
    }
  }

  open() {
    this.isOpen = true;
    this.container.querySelector('#activity-backdrop').classList.add('active');
  }

  close() {
    this.isOpen = false;
    this.container.querySelector('#activity-backdrop').classList.remove('active');
  }
}
