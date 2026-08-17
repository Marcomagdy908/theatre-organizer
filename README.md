# 🎭 Opera Royale — Real-Time Theater Seat Management System

A real-time theater seat management system designed for venue organizers, box-office teams, and front-of-house staff. The system guarantees **zero double-booking** through atomic concurrency control, provides **sub-100ms real-time synchronization** via Firebase Firestore and Local Real-Time Mesh, and visualizes the complete **3-Column Rows A–Q** theater layout.

---

## 🏛️ Exact Venue Seating Structure

The theater layout is organized into **two vertical sections** and **three horizontal columns**:

### **Part 1: Front Section (Rows A – H)**
- **Left Wing (Odds):** Odd numbers decreasing toward center (e.g., `... 19, 17, 15, 13, 11`)
- **Center Section:** Continuous numbers (`9, 7, 5, 3, 1` | `2, 4, 6, 8, 10`)
- **Right Wing (Evens):** Even numbers increasing away from center (`10, 12, 14, 16, 18, 20...`)
- *Row A:* Open central walkway between Left and Right wings.

### **Part 2: Rear Section (Rows I – Q)**
- **Left Wing (Odds):** Odd numbers (up to `31, 29... 11`)
- **Center Section:** Continuous numbers (`9, 7, 5, 3, 1` | `2, 4, 6, 8`)
- **Right Wing (Evens):** Even numbers (up to `10, 12... 30`)
- *Row Q:* Open central walkway.

---

## ⚡ Core Technical Pillars

### 1. Data Schema
```json
{
  "id": "seat_B_7",
  "eventId": "evt_grand_theater_2026",
  "section": "Part 1: Front (Rows A-H)",
  "row": "B",
  "number": 7,
  "seatCode": "B7",
  "wing": "center",
  "status": "reserved",
  "assignedTo": {
    "name": "Sarah Connor",
    "ticketId": "TCK-8821"
  },
  "lockedBy": null,
  "lockedUntil": null,
  "checkedInAt": null,
  "updatedAt": 1786973340000
}
```

### 2. Concurrency Control (Zero Double-Booking)
- **Atomic 60s Hold Lock:** Clicking an available seat executes an atomic transaction lock with an animated 60s TTL countdown.
- **Collision Protection:** If another organizer attempts to select the seat at the exact same moment, the system rejects the second request and displays a collision alert toast.
- **Auto-Expiration:** If details aren't submitted within 60s, the seat automatically reverts to `available`.
- **Atomic Booking Commit:** Confirms the reservation with `{ name, ticketId }` only if the organizer holds the active lock.

### 3. Dual Synchronization
- **Zero-Config Local Mesh (`BroadcastChannel` + `localStorage`):** Seamless real-time synchronization between browser tabs and windows without setup.
- **Firebase Firestore (`onSnapshot` + `runTransaction`):** Connects to cloud Firestore for cross-device global synchronization via the in-app Firebase setup modal.

---

## 🚀 Quick Start & Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
```

---

## 🌐 Deploy to Production

### Option 1: Vercel (Recommended — 1-Click)
```bash
npx vercel
```

### Option 2: Firebase Hosting
```bash
npm run build
npx firebase login
npx firebase init hosting
npx firebase deploy --only hosting
```

### Option 3: Netlify
```bash
npx netlify deploy --prod --dir=dist
```

---

## 👥 Organizer Roles & Access
All organizers have unified equal access with full permissions across all sections and rows:
- **Organizer 1 (Alice)**
- **Organizer 2 (Bob)**
- **Organizer 3 (Charlie)**
- **Organizer 4 (Diana)**
