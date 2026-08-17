import './style.css';
import { getOrCreateOrganizerSession } from './utils/constants.js';
import { syncEngine } from './store/syncEngine.js';
import { OrganizerBar } from './components/OrganizerBar.js';
import { StatsDashboard } from './components/StatsDashboard.js';
import { Toolbar } from './components/Toolbar.js';
import { SeatMap } from './components/SeatMap.js';
import { AssignmentModal } from './components/AssignmentModal.js';
import { SeatDetailsModal } from './components/SeatDetailsModal.js';
import { SelectionDock } from './components/SelectionDock.js';
import { FirebaseModal } from './components/FirebaseModal.js';
import { ActivityFeed } from './components/ActivityFeed.js';
import { toast } from './components/Toast.js';

class App {
  constructor() {
    this.currentOrganizer = getOrCreateOrganizerSession();
    this.seatMap = null;
    this.toolbar = null;
    this.statsDashboard = null;
    this.organizerBar = null;
    this.assignmentModal = null;
    this.seatDetailsModal = null;
    this.selectionDock = null;
    this.firebaseModal = null;
    this.activityFeed = null;

    this.init();
  }

  init() {
    try {
      // 1. Initialize Modals
      this.assignmentModal = new AssignmentModal('assignment-modal-mount', () => {
        if (this.seatMap) this.seatMap.clearSelection();
        if (this.selectionDock) this.selectionDock.clear();
      });
      this.seatDetailsModal = new SeatDetailsModal('details-modal-mount');
      this.firebaseModal = new FirebaseModal('firebase-modal-mount', (mode) => {
        if (this.organizerBar) this.organizerBar.updateSyncStatus(mode);
      });
      this.activityFeed = new ActivityFeed('activity-feed-mount');

      // 2. Initialize Selection Dock
      this.selectionDock = new SelectionDock('selection-dock-mount', {
        onReserveClick: (selectedSeats) => {
          if (this.assignmentModal && selectedSeats.length > 0) {
            this.assignmentModal.open(selectedSeats, this.currentOrganizer);
          }
        },
        onClearClick: async () => {
          const selected = this.seatMap ? this.seatMap.getSelectedSeats() : [];
          if (selected.length > 0) {
            const ids = selected.map(s => s.id);
            await syncEngine.releaseMultipleLocks(ids, this.currentOrganizer.id);
            if (this.seatMap) this.seatMap.clearSelection();
            if (this.selectionDock) this.selectionDock.clear();
            toast.info('Holds Released', 'Selected seats released.');
          }
        }
      });

      // 3. Initialize Organizer Bar
      this.organizerBar = new OrganizerBar('organizer-bar-mount', {
        initialOrganizer: this.currentOrganizer,
        onOrganizerChange: (newOrg) => {
          this.currentOrganizer = newOrg;
          if (this.seatMap) this.seatMap.updateData(syncEngine.getSeats(), this.currentOrganizer);
        },
        onOpenFirebaseModal: () => {
          if (this.firebaseModal) this.firebaseModal.open();
        },
        onOpenActivityFeed: () => {
          if (this.activityFeed) this.activityFeed.open();
        }
      });

      // 4. Initialize Stats Dashboard
      this.statsDashboard = new StatsDashboard('stats-dashboard-mount');

      // 5. Initialize Toolbar
      this.toolbar = new Toolbar('toolbar-mount', {
        onSearch: (query) => this.handleSearch(query),
        onSectionChange: (section) => {
          if (this.seatMap) this.seatMap.setSection(section);
        },
        onFilterChange: (filter) => {
          if (this.seatMap) this.seatMap.setStatusFilter(filter);
        }
      });

      // 6. Initialize Interactive Seat Map
      this.seatMap = new SeatMap('seat-map-mount', {
        currentOrganizer: this.currentOrganizer,
        onSeatClick: (seat) => this.handleSeatClick(seat),
        onSelectionChange: (selectedSeats) => {
          if (this.selectionDock) this.selectionDock.updateSelection(selectedSeats);
        }
      });

      // 7. Connect Real-Time Sync Engine Listeners
      syncEngine.subscribe((seats, logs, mode) => {
        if (this.seatMap) this.seatMap.updateData(seats, this.currentOrganizer);
        if (this.toolbar) this.toolbar.updateCounts(seats);
        if (this.statsDashboard) this.statsDashboard.update(seats);
        if (this.activityFeed) this.activityFeed.updateLogs(logs);
        if (this.organizerBar) this.organizerBar.updateSyncStatus(mode);
      });

      // Initial render trigger
      const initialSeats = syncEngine.getSeats();
      const initialLogs = syncEngine.getLogs();
      const initialMode = syncEngine.getMode();

      if (this.seatMap) this.seatMap.updateData(initialSeats, this.currentOrganizer);
      if (this.toolbar) this.toolbar.updateCounts(initialSeats);
      if (this.statsDashboard) this.statsDashboard.update(initialSeats);
      if (this.activityFeed) this.activityFeed.updateLogs(initialLogs);
      if (this.organizerBar) this.organizerBar.updateSyncStatus(initialMode);

      toast.success(
        `Welcome, ${this.currentOrganizer.name}`, 
        `Logged in. Multi-seat selection and real-time sync active.`
      );
    } catch (err) {
      console.error('App initialization error:', err);
    }
  }

  async handleSeatClick(seat) {
    const freshSeats = syncEngine.getSeats();
    const freshSeat = freshSeats[seat.id] || seat;

    if (freshSeat.status === 'available') {
      // Acquire 60s lock & add to multi-selection
      const lockRes = await syncEngine.acquireSeatLock(freshSeat.id, this.currentOrganizer);
      if (lockRes.success) {
        if (this.seatMap) this.seatMap.toggleSeatSelection(lockRes.seat);
      } else {
        toast.conflict(lockRes.error);
      }
    } else if (freshSeat.status === 'locked') {
      const isOwnedByMe = freshSeat.lockedBy?.organizerId === this.currentOrganizer.id;
      if (isOwnedByMe) {
        // Toggle off & release lock
        await syncEngine.releaseSeatLock(freshSeat.id, this.currentOrganizer.id);
        if (this.seatMap) this.seatMap.toggleSeatSelection(freshSeat);
      } else {
        const holderName = freshSeat.lockedBy ? freshSeat.lockedBy.name : 'another organizer';
        const remainingSecs = Math.max(0, Math.ceil(((freshSeat.lockedUntil || Date.now()) - Date.now()) / 1000));
        toast.conflict(
          `Seat ${freshSeat.seatCode} is currently held by ${holderName} (${remainingSecs}s remaining).`
        );
      }
    } else if (freshSeat.status === 'reserved' || freshSeat.status === 'checked_in') {
      if (this.seatDetailsModal) this.seatDetailsModal.open(freshSeat, this.currentOrganizer);
    }
  }

  handleSearch(query) {
    if (!this.seatMap) return;

    if (!query) {
      this.seatMap.highlightSeat(null);
      return;
    }

    const q = query.toLowerCase();
    const seats = syncEngine.getSeats();
    
    let matchedSeat = Object.values(seats).find(s => 
      s.seatCode.toLowerCase() === q || 
      s.seatCode.toLowerCase().replace(/[^a-z0-9]/g, '') === q.replace(/[^a-z0-9]/g, '')
    );

    if (!matchedSeat) {
      matchedSeat = Object.values(seats).find(s => {
        if (!s.assignedTo) return false;
        const nameMatch = s.assignedTo.name && s.assignedTo.name.toLowerCase().includes(q);
        const ticketMatch = s.assignedTo.ticketId && s.assignedTo.ticketId.toLowerCase().includes(q);
        return nameMatch || ticketMatch;
      });
    }

    if (matchedSeat) {
      this.seatMap.highlightSeat(matchedSeat.id);
    }
  }
}

new App();
