// Real-Time Synchronization & Concurrency Engine (Firebase Firestore + Multi-Tab Live Mesh)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  runTransaction, 
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { LOCK_TTL_MS, generateInitialSeats, EVENT_ID, EVENT_TITLE } from '../utils/constants.js';

const STORAGE_KEY_SEATS = 'theatre_sef_amran_jadidan_seats_v1';
const STORAGE_KEY_LOGS = 'theatre_sef_amran_jadidan_logs_v1';
const STORAGE_KEY_FIREBASE_CONFIG = 'theatre_firebase_config_v1';

class SyncEngine {
  constructor() {
    this.mode = 'mesh'; // 'firebase' or 'mesh' (BroadcastChannel + LocalStorage)
    this.seats = {};
    this.logs = [];
    this.listeners = new Set();
    this.firebaseApp = null;
    this.firestore = null;
    this.unsubscribeFirestore = null;
    this.broadcastChannel = null;

    this.initBroadcastChannel();
    this.loadFirebaseConfig();
    this.loadInitialData();
    this.startLockExpirySweep();
  }

  // Initialize BroadcastChannel for instant local multi-tab sync
  initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('theatre_seat_sync_v1');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_ALL_SEATS') {
          this.seats = payload.seats;
          this.notifyListeners();
        } else if (type === 'SEAT_UPDATED') {
          this.seats[payload.seat.id] = payload.seat;
          if (payload.log) this.addLog(payload.log, false);
          this.notifyListeners();
        } else if (type === 'AUDIT_LOG') {
          this.addLog(payload.log, false);
          this.notifyListeners();
        }
      };
    }
  }

  // Load Firebase config from .env or localStorage
  loadFirebaseConfig() {
    try {
      // 1. Check Vite Environment Variables (.env)
      const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

      if (envApiKey && envProjectId && envApiKey.trim() !== '') {
        const envConfig = {
          apiKey: envApiKey.trim(),
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || `${envProjectId.trim()}.firebaseapp.com`,
          projectId: envProjectId.trim(),
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || `${envProjectId.trim()}.appspot.com`,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
          appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || ''
        };
        this.initFirebase(envConfig);
        return;
      }

      // 2. Check localStorage saved config from UI modal
      const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      if (saved) {
        const config = JSON.parse(saved);
        if (config && config.apiKey && config.projectId) {
          this.initFirebase(config);
        }
      }
    } catch (e) {
      console.warn('Could not load Firebase config:', e);
    }
  }

  // Connect to live Firebase Firestore
  async initFirebase(config) {
    try {
      if (this.unsubscribeFirestore) {
        this.unsubscribeFirestore();
      }

      this.firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
      this.firestore = getFirestore(this.firebaseApp);
      this.mode = 'firebase';
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));

      // Listen to Firestore real-time snapshot
      const seatsCol = collection(this.firestore, 'theater_events', EVENT_ID, 'seats');
      this.unsubscribeFirestore = onSnapshot(seatsCol, (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed initial seats
          this.seedFirestore();
          return;
        }

        const newSeats = {};
        snapshot.forEach((docSnap) => {
          newSeats[docSnap.id] = docSnap.data();
        });
        this.seats = newSeats;
        this.notifyListeners();
      }, (error) => {
        console.error('Firestore snapshot error:', error);
        this.mode = 'mesh';
        this.notifyListeners();
      });

      this.addLog({
        id: 'log_' + Date.now(),
        time: Date.now(),
        type: 'system',
        text: `Connected to Live Firebase Firestore (${config.projectId})`
      });

      return { success: true };
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.mode = 'mesh';
      return { success: false, error: error.message };
    }
  }

  // Disconnect Firebase and revert to local mesh
  disconnectFirebase() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    this.firestore = null;
    this.firebaseApp = null;
    this.mode = 'mesh';
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    this.loadInitialData();
    this.addLog({
      id: 'log_' + Date.now(),
      time: Date.now(),
      type: 'system',
      text: 'Switched to Local Real-Time Synchronization Mesh'
    });
    this.notifyListeners();
  }

  // Seed Firestore with initial venue layout
  async seedFirestore() {
    if (!this.firestore) return;
    try {
      const initial = generateInitialSeats();
      const batch = writeBatch(this.firestore);
      
      Object.values(initial).forEach((seat) => {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seat.id);
        batch.set(seatRef, seat);
      });

      await batch.commit();
      console.log(`Successfully seeded Firestore for ${EVENT_TITLE}`);
    } catch (e) {
      console.error('Failed to seed Firestore:', e);
    }
  }

  // Load initial local data
  loadInitialData() {
    try {
      const savedSeats = localStorage.getItem(STORAGE_KEY_SEATS);
      if (savedSeats) {
        this.seats = JSON.parse(savedSeats);
      } else {
        this.seats = generateInitialSeats();
        this.saveLocalSeats();
      }

      const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      } else {
        this.logs = [
          {
            id: 'log_init',
            time: Date.now(),
            type: 'system',
            text: `Event "${EVENT_TITLE}" initialized. All seats available for assignment.`
          }
        ];
      }
    } catch (e) {
      this.seats = generateInitialSeats();
      this.logs = [];
    }
  }

  saveLocalSeats() {
    try {
      localStorage.setItem(STORAGE_KEY_SEATS, JSON.stringify(this.seats));
    } catch (e) {
      console.error('Storage quota exceeded:', e);
    }
  }

  // Periodic sweep to release expired locks (TTL = 60s)
  startLockExpirySweep() {
    setInterval(() => {
      const now = Date.now();
      let changed = false;

      Object.values(this.seats).forEach((seat) => {
        if (seat.status === 'locked' && seat.lockedUntil && seat.lockedUntil < now) {
          seat.status = 'available';
          const expiredOrganizer = seat.lockedBy ? seat.lockedBy.name : 'Unknown';
          seat.lockedBy = null;
          seat.lockedUntil = null;
          seat.updatedAt = now;
          changed = true;

          this.addLog({
            id: 'log_' + Date.now() + '_' + seat.id,
            time: now,
            type: 'lock_expire',
            text: `Hold on Seat ${seat.seatCode} expired (released by auto-TTL)`
          });
        }
      });

      if (changed) {
        this.saveLocalSeats();
        this.broadcastState();
        this.notifyListeners();
      }
    }, 1000);
  }

  // Concurrency Principle 1: Atomic Lock Acquisition
  async acquireSeatLock(seatId, organizer) {
    const now = Date.now();
    const lockedUntil = now + LOCK_TTL_MS;

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        const result = await runTransaction(this.firestore, async (transaction) => {
          const seatDoc = await transaction.get(seatRef);
          if (!seatDoc.exists()) {
            throw new Error('Seat does not exist');
          }
          const data = seatDoc.data();

          // Check if seat is available or lock has expired
          const isLockExpired = data.status === 'locked' && data.lockedUntil && data.lockedUntil < now;
          const isOwnedByMe = data.status === 'locked' && data.lockedBy && data.lockedBy.organizerId === organizer.id;

          if (data.status !== 'available' && !isLockExpired && !isOwnedByMe) {
            throw new Error(`Seat is currently ${data.status} ${data.lockedBy ? 'by ' + data.lockedBy.name : ''}`);
          }

          const updatedSeat = {
            ...data,
            status: 'locked',
            lockedBy: {
              organizerId: organizer.id,
              name: organizer.name,
              color: organizer.color,
              badge: organizer.badge
            },
            lockedUntil,
            updatedAt: now
          };

          transaction.update(seatRef, updatedSeat);
          return updatedSeat;
        });

        this.addLog({
          id: 'log_' + Date.now(),
          time: now,
          type: 'lock',
          text: `${organizer.name} locked Seat ${result.seatCode} (60s hold)`
        });

        return { success: true, seat: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Mesh / Atomic Local Concurrency Simulation
    const seat = this.seats[seatId];
    if (!seat) return { success: false, error: 'Seat not found' };

    const isLockExpired = seat.status === 'locked' && seat.lockedUntil && seat.lockedUntil < now;
    const isOwnedByMe = seat.status === 'locked' && seat.lockedBy && seat.lockedBy.organizerId === organizer.id;

    if (seat.status !== 'available' && !isLockExpired && !isOwnedByMe) {
      const lockerName = seat.lockedBy ? seat.lockedBy.name : 'another organizer';
      return { 
        success: false, 
        error: `Seat ${seat.seatCode} was just ${seat.status === 'locked' ? 'held by ' + lockerName : 'booked'}!` 
      };
    }

    seat.status = 'locked';
    seat.lockedBy = {
      organizerId: organizer.id,
      name: organizer.name,
      color: organizer.color,
      badge: organizer.badge
    };
    seat.lockedUntil = lockedUntil;
    seat.updatedAt = now;

    this.saveLocalSeats();
    
    const logItem = {
      id: 'log_' + Date.now(),
      time: now,
      type: 'lock',
      text: `${organizer.name} locked Seat ${seat.seatCode} (60s hold)`
    };
    this.addLog(logItem);

    this.broadcastSeatUpdate(seat, logItem);
    this.notifyListeners();

    return { success: true, seat };
  }

  // Concurrency Principle 2: Release Lock
  async releaseSeatLock(seatId, organizerId) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat) return;

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        await runTransaction(this.firestore, async (transaction) => {
          const seatDoc = await transaction.get(seatRef);
          if (!seatDoc.exists()) return;
          const data = seatDoc.data();
          if (data.status === 'locked' && data.lockedBy?.organizerId === organizerId) {
            transaction.update(seatRef, {
              status: 'available',
              lockedBy: null,
              lockedUntil: null,
              updatedAt: now
            });
          }
        });
      } catch (e) {
        console.error('Error releasing lock:', e);
      }
      return;
    }

    if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy.organizerId === organizerId) {
      seat.status = 'available';
      seat.lockedBy = null;
      seat.lockedUntil = null;
      seat.updatedAt = now;
      this.saveLocalSeats();
      this.broadcastSeatUpdate(seat);
      this.notifyListeners();
    }
  }

  // Concurrency Principle 3: Atomic Reservation Commit
  async reserveSeat(seatId, attendeeData, organizer, autoCheckIn = false) {
    const now = Date.now();
    const finalStatus = autoCheckIn ? 'checked_in' : 'reserved';

    // Attendee schema has only name and ticketId
    const sanitizedAttendee = {
      name: attendeeData.name.trim(),
      ticketId: attendeeData.ticketId.trim()
    };

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        const result = await runTransaction(this.firestore, async (transaction) => {
          const seatDoc = await transaction.get(seatRef);
          if (!seatDoc.exists()) throw new Error('Seat does not exist');
          const data = seatDoc.data();

          const isOwnedByMe = data.status === 'locked' && data.lockedBy?.organizerId === organizer.id;
          const isAvailable = data.status === 'available';

          if (!isOwnedByMe && !isAvailable) {
            throw new Error(`Double-booking prevented! Seat is no longer available.`);
          }

          const updated = {
            ...data,
            status: finalStatus,
            assignedTo: sanitizedAttendee,
            lockedBy: null,
            lockedUntil: null,
            checkedInAt: autoCheckIn ? now : null,
            updatedAt: now
          };

          transaction.update(seatRef, updated);
          return updated;
        });

        this.addLog({
          id: 'log_' + Date.now(),
          time: now,
          type: 'booking',
          text: `${organizer.name} assigned Seat ${result.seatCode} to ${sanitizedAttendee.name} (${sanitizedAttendee.ticketId})`
        });

        return { success: true, seat: result };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // Local / Mesh Transaction
    const seat = this.seats[seatId];
    if (!seat) return { success: false, error: 'Seat not found' };

    const isOwnedByMe = seat.status === 'locked' && seat.lockedBy?.organizerId === organizer.id;
    const isAvailable = seat.status === 'available';

    if (!isOwnedByMe && !isAvailable) {
      return { 
        success: false, 
        error: `Double-booking prevented! Seat ${seat.seatCode} was already assigned by another organizer.` 
      };
    }

    seat.status = finalStatus;
    seat.assignedTo = sanitizedAttendee;
    seat.lockedBy = null;
    seat.lockedUntil = null;
    seat.checkedInAt = autoCheckIn ? now : null;
    seat.updatedAt = now;

    this.saveLocalSeats();

    const logItem = {
      id: 'log_' + Date.now(),
      time: now,
      type: 'booking',
      text: `${organizer.name} assigned Seat ${seat.seatCode} to ${sanitizedAttendee.name} (${sanitizedAttendee.ticketId})`
    };
    this.addLog(logItem);

    this.broadcastSeatUpdate(seat, logItem);
    this.notifyListeners();

    return { success: true, seat };
  }

  // Front-of-house Check-in
  async checkInSeat(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat || seat.status !== 'reserved') return { success: false, error: 'Seat cannot be checked in' };

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        await runTransaction(this.firestore, async (transaction) => {
          const seatDoc = await transaction.get(seatRef);
          if (!seatDoc.exists()) throw new Error('Seat not found');
          transaction.update(seatRef, {
            status: 'checked_in',
            checkedInAt: now,
            updatedAt: now
          });
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    seat.status = 'checked_in';
    seat.checkedInAt = now;
    seat.updatedAt = now;
    this.saveLocalSeats();

    const logItem = {
      id: 'log_' + Date.now(),
      time: now,
      type: 'checkin',
      text: `${organizer.name} checked in ${seat.assignedTo?.name || 'Guest'} (${seat.seatCode})`
    };
    this.addLog(logItem);
    this.broadcastSeatUpdate(seat, logItem);
    this.notifyListeners();

    return { success: true, seat };
  }

  // Undo check-in
  async undoCheckIn(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat || seat.status !== 'checked_in') return { success: false };

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        await runTransaction(this.firestore, async (transaction) => {
          transaction.update(seatRef, {
            status: 'reserved',
            checkedInAt: null,
            updatedAt: now
          });
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    seat.status = 'reserved';
    seat.checkedInAt = null;
    seat.updatedAt = now;
    this.saveLocalSeats();

    const logItem = {
      id: 'log_' + Date.now(),
      time: now,
      type: 'system',
      text: `${organizer.name} reverted check-in for Seat ${seat.seatCode}`
    };
    this.addLog(logItem);
    this.broadcastSeatUpdate(seat, logItem);
    this.notifyListeners();

    return { success: true, seat };
  }

  // Cancel reservation & release seat to available
  async cancelReservation(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat) return { success: false };
    const prevGuest = seat.assignedTo?.name || 'Guest';

    if (this.mode === 'firebase' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', 'evt_grand_theater_2026', 'seats', seatId);
        await runTransaction(this.firestore, async (transaction) => {
          transaction.update(seatRef, {
            status: 'available',
            assignedTo: null,
            lockedBy: null,
            lockedUntil: null,
            checkedInAt: null,
            updatedAt: now
          });
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    seat.status = 'available';
    seat.assignedTo = null;
    seat.lockedBy = null;
    seat.lockedUntil = null;
    seat.checkedInAt = null;
    seat.updatedAt = now;

    this.saveLocalSeats();
    const logItem = {
      id: 'log_' + Date.now(),
      time: now,
      type: 'cancel',
      text: `${organizer.name} cancelled reservation for ${prevGuest} (${seat.seatCode})`
    };
    this.addLog(logItem);
    this.broadcastSeatUpdate(seat, logItem);
    this.notifyListeners();

    return { success: true, seat };
  }

  // Reset entire venue back to default layout
  async resetAllSeats() {
    this.seats = generateInitialSeats();
    this.saveLocalSeats();
    
    if (this.mode === 'firebase' && this.firestore) {
      await this.seedFirestore();
    }

    const logItem = {
      id: 'log_' + Date.now(),
      time: Date.now(),
      type: 'system',
      text: 'Venue reset: All seats re-initialized to initial layout'
    };
    this.addLog(logItem);
    this.broadcastState();
    this.notifyListeners();
  }

  // Broadcast single seat update
  broadcastSeatUpdate(seat, log = null) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'SEAT_UPDATED',
        payload: { seat, log }
      });
    }
  }

  // Broadcast full state
  broadcastState() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'SYNC_ALL_SEATS',
        payload: { seats: this.seats }
      });
    }
  }

  // Log management
  addLog(logItem, broadcast = true) {
    this.logs.unshift(logItem);
    if (this.logs.length > 50) this.logs.pop();
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    } catch (e) {}

    if (broadcast && this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'AUDIT_LOG',
        payload: { log: logItem }
      });
    }
  }

  // Pub/Sub listener registration
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.seats, this.logs, this.mode);
      } catch (e) {
        console.error('Subscriber notification error:', e);
      }
    });
  }

  getSeats() {
    return this.seats;
  }

  getLogs() {
    return this.logs;
  }

  getMode() {
    return this.mode;
  }
}

export const syncEngine = new SyncEngine();
