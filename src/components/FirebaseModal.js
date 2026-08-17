// Firebase Connection Configuration Modal
import { syncEngine } from '../store/syncEngine.js';
import { toast } from './Toast.js';

export class FirebaseModal {
  constructor(containerId, onStatusChange) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.onStatusChange = onStatusChange || (() => {});

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="modal-backdrop" id="firebase-backdrop">
        <div class="modal-card modal-firebase animate-pop-in">
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-badge-status" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;">
                🔥 Cloud Database Sync
              </div>
              <h2 class="modal-title">Firebase Firestore Setup</h2>
              <p class="modal-subtitle">Connect your Firebase project for globally distributed multi-organizer syncing.</p>
            </div>
            <button type="button" class="modal-close-btn" id="firebase-close-btn">&times;</button>
          </div>

          <div class="firebase-info-box">
            <p><strong>Zero Setup Mode Active:</strong> The application automatically operates using a high-speed local real-time synchronization mesh (BroadcastChannel + LocalStorage) that seamlessly syncs across multiple tabs and browser windows with sub-20ms latency!</p>
            <p class="mt-2 text-muted">To sync across separate devices in different networks, paste your Firebase project config below.</p>
          </div>

          <form id="firebase-form" class="firebase-form">
            <div class="form-group">
              <label class="form-label" for="fb-config-json">Firebase Web Config (JSON or JS Object)</label>
              <textarea 
                id="fb-config-json" 
                class="form-textarea font-mono" 
                rows="6" 
                placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "my-theater.firebaseapp.com",
  "projectId": "my-theater-project",
  "storageBucket": "my-theater.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef"
}'
              ></textarea>
            </div>

            <div class="modal-actions space-between">
              <button type="button" class="btn btn-ghost" id="fb-disconnect-btn">
                Use Local Mesh Mode
              </button>
              <div class="action-group-right">
                <button type="button" class="btn btn-secondary" id="fb-cancel-btn">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" id="fb-connect-btn">
                  Connect Firestore
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.container) return;
    const backdrop = this.container.querySelector('#firebase-backdrop');
    const closeBtn = this.container.querySelector('#firebase-close-btn');
    const cancelBtn = this.container.querySelector('#fb-cancel-btn');
    const disconnectBtn = this.container.querySelector('#fb-disconnect-btn');
    const form = this.container.querySelector('#firebase-form');
    const textarea = this.container.querySelector('#fb-config-json');

    const handleClose = () => this.close();
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) handleClose();
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        syncEngine.disconnectFirebase();
        toast.info('Local Mesh Active', 'Switched to zero-latency local synchronization.');
        this.onStatusChange('mesh');
        this.close();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const raw = textarea ? textarea.value.trim() : '';
        if (!raw) {
          toast.error('Config Required', 'Please paste your Firebase configuration object.');
          return;
        }

        try {
          let config;
          try {
            config = JSON.parse(raw);
          } catch {
            const jsonString = raw
              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ')
              .replace(/'/g, '"');
            config = JSON.parse(jsonString);
          }

          if (!config.apiKey || !config.projectId) {
            throw new Error('Config must contain at least "apiKey" and "projectId"');
          }

          toast.info('Connecting', 'Initializing Firebase connection...');
          const res = await syncEngine.initFirebase(config);

          if (res.success) {
            toast.success('Connected!', `Successfully connected to Firebase Firestore (${config.projectId}).`);
            this.onStatusChange('firebase');
            this.close();
          } else {
            toast.error('Connection Failed', res.error);
          }
        } catch (err) {
          toast.error('Invalid Config', 'Could not parse config. Please verify format.');
        }
      });
    }
  }

  open() {
    if (!this.container) return;
    const textarea = this.container.querySelector('#fb-config-json');
    try {
      const saved = localStorage.getItem('theatre_firebase_config_v1');
      if (saved && textarea) {
        textarea.value = JSON.stringify(JSON.parse(saved), null, 2);
      }
    } catch (e) {}

    const backdrop = this.container.querySelector('#firebase-backdrop');
    if (backdrop) backdrop.classList.add('active');
  }

  close() {
    if (!this.container) return;
    const backdrop = this.container.querySelector('#firebase-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }
}
