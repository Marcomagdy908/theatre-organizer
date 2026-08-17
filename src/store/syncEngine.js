// Real-Time Synchronization & Concurrency Engine
// Supports: Firebase Realtime Database (RTDB) + Firestore + Local Multi-Tab Mesh
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref as dbRef, 
  onValue, 
  set as dbSet, 
  update as dbUpdate, 
  runTransaction as rtdbRunTransaction 
} from 'firebase/database';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  runTransaction as firestoreRunTransaction, 
  writeBatch 
} from 'firebase/firestore';
// Production Realtime Database Configuration for SEF_امرا جديدا
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3o6pjdT9dX6kjWtp8X2T4cNasI9xlMIU",
  authDomain: "theatre-d3b45.firebaseapp.com",
  databaseURL: "https://theatre-d3b45-default-rtdb.firebaseio.com",
  projectId: "theatre-d3b45",
  storageBucket: "theatre-d3b45.firebasestorage.app",
  messagingSenderId: "49926890858",
  appId: "1:49926890858:web:eb90c3225dc2945a80b113",
  measurementId: "G-CKBTZRJFKE"
};

const STORAGE_KEY_SEATS = 'theatre_sef_amran_jadidan_seats_v1';
const STORAGE_KEY_LOGS = 'theatre_sef_amran_jadidan_logs_v1';
const STORAGE_KEY_FIREBASE_CONFIG = 'theatre_firebase_config_v1';

class SyncEngine {
  constructor() {
    this.mode = 'rtdb'; // Connect to Firebase Realtime Database automatically
    this.seats = {};
    this.logs = [];
    this.listeners = new Set();
    this.firebaseApp = null;
    this.rtdb = null;
    this.firestore = null;
    this.unsubscribeRealtime = null;
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

  // Automatically connect to Firebase Cloud Realtime Database
  loadFirebaseConfig() {
    try {
      const activeConfig = {
        apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey).trim(),
        authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain).trim(),
        databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL || FIREBASE_CONFIG.databaseURL).trim(),
        projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId).trim(),
        storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket).trim(),
        messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId).trim(),
        appId: (import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId).trim(),
        measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || FIREBASE_CONFIG.measurementId)?.trim()
      };

      this.initFirebase(activeConfig);
    } catch (e) {
      console.warn('Auto Firebase init failed, trying direct default:', e);
      this.initFirebase(FIREBASE_CONFIG);
    }
  }

  // Connect to Firebase Realtime Database (RTDB) with Firestore fallback
  async initFirebase(config) {
    try {
      if (this.unsubscribeRealtime) {
        this.unsubscribeRealtime();
      }

      this.firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));

      // 1. Try Firebase Realtime Database (RTDB) first if databaseURL is provided
      if (config.databaseURL) {
        try {
          this.rtdb = getDatabase(this.firebaseApp, config.databaseURL);
          const seatsPath = `theater_events/${EVENT_ID}/seats`;
          const seatsDbRef = dbRef(this.rtdb, seatsPath);

          // Realtime listener
          this.unsubscribeRealtime = onValue(seatsDbRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
              this.seedRTDB();
              return;
            }
            this.seats = data;
            this.notifyListeners();
          }, (err) => {
            console.warn('RTDB onValue error, trying Firestore...', err);
            this.fallbackToFirestore(config);
          });

          this.mode = 'rtdb';
          this.addLog({
            id: 'log_' + Date.now(),
            time: Date.now(),
            type: 'system',
            text: `Connected to Firebase Realtime Database (${config.projectId})`
          });
          this.notifyListeners();
          return { success: true, mode: 'rtdb' };
        } catch (rtdbErr) {
          console.warn('RTDB init error:', rtdbErr);
          return this.fallbackToFirestore(config);
        }
      } else {
        return this.fallbackToFirestore(config);
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.mode = 'mesh';
      return { success: false, error: error.message };
    }
  }

  // Fallback to Cloud Firestore
  async fallbackToFirestore(config) {
    try {
      this.firestore = getFirestore(this.firebaseApp);
      const seatsCol = collection(this.firestore, 'theater_events', EVENT_ID, 'seats');
      this.unsubscribeRealtime = onSnapshot(seatsCol, (snapshot) => {
        if (snapshot.empty) {
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

      this.mode = 'firestore';
      this.addLog({
        id: 'log_' + Date.now(),
        time: Date.now(),
        type: 'system',
        text: `Connected to Firebase Firestore (${config.projectId})`
      });
      this.notifyListeners();
      return { success: true, mode: 'firestore' };
    } catch (err) {
      this.mode = 'mesh';
      return { success: false, error: err.message };
    }
  }

  // Disconnect Firebase and revert to local mesh
  disconnectFirebase() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
    this.rtdb = null;
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

  // Seed Realtime Database
  async seedRTDB() {
    if (!this.rtdb) return;
    try {
      const initial = generateInitialSeats();
      const seatsDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats`);
      await dbSet(seatsDbRef, initial);
      console.log(`Successfully seeded Firebase RTDB for ${EVENT_TITLE}`);
    } catch (e) {
      console.error('Failed to seed RTDB:', e);
    }
  }

  // Seed Firestore
  async seedFirestore() {
    if (!this.firestore) return;
    try {
      const initial = generateInitialSeats();
      const batch = writeBatch(this.firestore);
      Object.values(initial).forEach((seat) => {
        const seatDocRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seat.id);
        batch.set(seatDocRef, seat);
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
          seat.lockedBy = null;
          seat.lockedUntil = null;
          seat.updatedAt = now;
          changed = true;

          this.addLog({
            id: 'log_' + Date.now() + '_' + seat.id,
            time: now,
            type: 'lock_expire',
            text: `Hold on Seat ${seat.seatCode} expired (auto-released)`
          });

          // Sync lock expiration to RTDB / Firestore
          if (this.mode === 'rtdb' && this.rtdb) {
            const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seat.id}`);
            dbUpdate(seatDbRef, {
              status: 'available',
              lockedBy: null,
              lockedUntil: null,
              updatedAt: now
            }).catch(() => {});
          } else if (this.mode === 'firestore' && this.firestore) {
            const seatDocRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seat.id);
            firestoreRunTransaction(this.firestore, async (t) => {
              t.update(seatDocRef, {
                status: 'available',
                lockedBy: null,
                lockedUntil: null,
                updatedAt: now
              });
            }).catch(() => {});
          }
        }
      });

      if (changed) {
        this.saveLocalSeats();
        this.broadcastState();
        this.notifyListeners();
      }
    }, 1000);
  }

  // 1. Atomic Lock Acquisition (60-second TTL)
  async acquireSeatLock(seatId, organizer) {
    const now = Date.now();
    const lockedUntil = now + LOCK_TTL_MS;

    // A. Firebase Realtime Database (RTDB) Atomic Transaction
    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        const result = await rtdbRunTransaction(seatDbRef, (currentData) => {
          if (!currentData) return currentData;

          const isLockExpired = currentData.status === 'locked' && currentData.lockedUntil && currentData.lockedUntil < now;
          const isOwnedByMe = currentData.status === 'locked' && currentData.lockedBy?.organizerId === organizer.id;

          if (currentData.status !== 'available' && !isLockExpired && !isOwnedByMe) {
            return; // Abort transaction
          }

          return {
            ...currentData,
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
        });

        if (!result.committed) {
          const freshSeat = this.seats[seatId];
          const holderName = freshSeat?.lockedBy?.name || 'another organizer';
          return {
            success: false,
            error: `Seat ${freshSeat?.seatCode || seatId} is already held by ${holderName}!`
          };
        }

        this.addLog({
          id: 'log_' + Date.now(),
          time: now,
          type: 'lock',
          text: `${organizer.name} locked Seat ${result.snapshot.val().seatCode} (60s hold)`
        });

        return { success: true, seat: result.snapshot.val() };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // B. Firebase Firestore Atomic Transaction
    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        const result = await firestoreRunTransaction(this.firestore, async (transaction) => {
          const seatDoc = await transaction.get(seatRef);
          if (!seatDoc.exists()) throw new Error('Seat does not exist');
          const data = seatDoc.data();

          const isLockExpired = data.status === 'locked' && data.lockedUntil && data.lockedUntil < now;
          const isOwnedByMe = data.status === 'locked' && data.lockedBy?.organizerId === organizer.id;

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

    // C. Local Mesh Atomic Transaction
    const seat = this.seats[seatId];
    if (!seat) return { success: false, error: 'Seat not found' };

    const isLockExpired = seat.status === 'locked' && seat.lockedUntil && seat.lockedUntil < now;
    const isOwnedByMe = seat.status === 'locked' && seat.lockedBy?.organizerId === organizer.id;

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

  // 2. Release Lock
  async releaseSeatLock(seatId, organizerId) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat) return;

    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        await rtdbRunTransaction(seatDbRef, (current) => {
          if (current && current.status === 'locked' && current.lockedBy?.organizerId === organizerId) {
            return {
              ...current,
              status: 'available',
              lockedBy: null,
              lockedUntil: null,
              updatedAt: now
            };
          }
          return current;
        });
      } catch (e) {
        console.error('RTDB release error:', e);
      }
      return;
    }

    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        await firestoreRunTransaction(this.firestore, async (transaction) => {
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
        console.error('Firestore release error:', e);
      }
      return;
    }

    if (seat.status === 'locked' && seat.lockedBy?.organizerId === organizerId) {
      seat.status = 'available';
      seat.lockedBy = null;
      seat.lockedUntil = null;
      seat.updatedAt = now;
      this.saveLocalSeats();
      this.broadcastSeatUpdate(seat);
      this.notifyListeners();
    }
  }

  // 3. Atomic Reservation Commit
  async reserveSeat(seatId, attendeeData, organizer, autoCheckIn = false) {
    const now = Date.now();
    const finalStatus = autoCheckIn ? 'checked_in' : 'reserved';

    const sanitizedAttendee = {
      name: attendeeData.name.trim(),
      ticketId: attendeeData.ticketId.trim()
    };

    // A. RTDB Atomic Commit
    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        const result = await rtdbRunTransaction(seatDbRef, (current) => {
          if (!current) return current;

          const isOwnedByMe = current.status === 'locked' && current.lockedBy?.organizerId === organizer.id;
          const isAvailable = current.status === 'available';

          if (!isOwnedByMe && !isAvailable) {
            return; // Abort
          }

          return {
            ...current,
            status: finalStatus,
            assignedTo: sanitizedAttendee,
            lockedBy: null,
            lockedUntil: null,
            checkedInAt: autoCheckIn ? now : null,
            updatedAt: now
          };
        });

        if (!result.committed) {
          return { success: false, error: 'Double-booking prevented! Seat is no longer available.' };
        }

        this.addLog({
          id: 'log_' + Date.now(),
          time: now,
          type: 'booking',
          text: `${organizer.name} assigned Seat ${result.snapshot.val().seatCode} to ${sanitizedAttendee.name} (${sanitizedAttendee.ticketId})`
        });

        return { success: true, seat: result.snapshot.val() };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // B. Firestore Atomic Commit
    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        const result = await firestoreRunTransaction(this.firestore, async (transaction) => {
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

    // C. Local Mesh Atomic Commit
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

  // 4. Front-of-house Check-in
  async checkInSeat(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat || seat.status !== 'reserved') return { success: false, error: 'Seat cannot be checked in' };

    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        await dbUpdate(seatDbRef, {
          status: 'checked_in',
          checkedInAt: now,
          updatedAt: now
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        await firestoreRunTransaction(this.firestore, async (transaction) => {
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

  // 5. Undo Check-In
  async undoCheckIn(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat || seat.status !== 'checked_in') return { success: false };

    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        await dbUpdate(seatDbRef, {
          status: 'reserved',
          checkedInAt: null,
          updatedAt: now
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        await firestoreRunTransaction(this.firestore, async (transaction) => {
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

  // 6. Cancel Reservation & Release Seat
  async cancelReservation(seatId, organizer) {
    const now = Date.now();
    const seat = this.seats[seatId];
    if (!seat) return { success: false };
    const prevGuest = seat.assignedTo?.name || 'Guest';

    if (this.mode === 'rtdb' && this.rtdb) {
      try {
        const seatDbRef = dbRef(this.rtdb, `theater_events/${EVENT_ID}/seats/${seatId}`);
        await dbUpdate(seatDbRef, {
          status: 'available',
          assignedTo: null,
          lockedBy: null,
          lockedUntil: null,
          checkedInAt: null,
          updatedAt: now
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    if (this.mode === 'firestore' && this.firestore) {
      try {
        const seatRef = doc(this.firestore, 'theater_events', EVENT_ID, 'seats', seatId);
        await firestoreRunTransaction(this.firestore, async (transaction) => {
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

  // 7. Reset Venue
  async resetAllSeats() {
    this.seats = generateInitialSeats();
    this.saveLocalSeats();
    
    if (this.mode === 'rtdb' && this.rtdb) {
      await this.seedRTDB();
    } else if (this.mode === 'firestore' && this.firestore) {
      await this.seedFirestore();
    }

    const logItem = {
      id: 'log_' + Date.now(),
      time: Date.now(),
      type: 'system',
      text: 'Venue reset: All seats re-initialized to available'
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
