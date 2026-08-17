// Venue Layout & System Constants
// Event: SEF_امرا جديدا
// Exact Theater Layout: Rows A-Q across Part 1 (Front: A-H) & Part 2 (Rear: I-Q)
// Structured in 3 Columns: Left Wing (Odds), Center Section, Right Wing (Evens)

export const EVENT_ID = 'evt_sef_amran_jadidan_2026';
export const EVENT_TITLE = 'SEF_امرا جديدا';

export const LOCK_TTL_MS = 60000; // 60-second hold lock TTL

const ORGANIZER_COLORS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F97316'  // Orange
];

// Auto-generate or restore a unique session organizer for every device/tab
export function getOrCreateOrganizerSession() {
  try {
    const sessionKey = 'theatre_organizer_active_session_v2';
    const stored = sessionStorage.getItem(sessionKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const color = ORGANIZER_COLORS[Math.floor(Math.random() * ORGANIZER_COLORS.length)];
    const newSession = {
      id: `org_${randomNum}`,
      name: `Organizer #${randomNum}`,
      role: 'Organizer',
      avatar: `#${randomNum.toString().slice(-2)}`,
      color: color,
      badge: 'Organizer'
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(newSession));
    return newSession;
  } catch (e) {
    return {
      id: `org_${Date.now()}`,
      name: 'Organizer',
      role: 'Organizer',
      avatar: 'ORG',
      color: '#10B981',
      badge: 'Organizer'
    };
  }
}

// Generate a random ticket ID like TCK-8821
export function generateTicketId() {
  const chars = '0123456789';
  let num = '';
  for (let i = 0; i < 4; i++) {
    num += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TCK-${num}`;
}

// Complete Theater Seating Definition (Rows A - Q)
export const THEATER_ROW_DEFINITIONS = [
  // PART 1: Front Section (Rows A - H)
  {
    row: 'A',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [19, 17, 15, 13, 11],
    center: [],
    right: [10, 12, 14, 16, 18, 20]
  },
  {
    row: 'B',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [19, 17, 15, 13, 11],
    center: [7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24]
  },
  {
    row: 'C',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22]
  },
  {
    row: 'D',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8, 10],
    right: [12, 14, 16, 18, 20, 22, 24, 26]
  },
  {
    row: 'E',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8, 10],
    right: [10, 12, 14, 16, 18, 20, 22, 24]
  },
  {
    row: 'F',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8, 10],
    right: [12, 14, 16, 18, 20, 22, 24, 26, 28]
  },
  {
    row: 'G',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26]
  },
  {
    row: 'H',
    tier: 'Front (Part 1)',
    isVip: false,
    left: [27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8, 10],
    right: [12, 14, 16, 18, 20, 22, 24, 26, 28]
  },

  // PART 2: Rear Section (Rows I - Q)
  {
    row: 'I',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26]
  },
  {
    row: 'J',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
  },
  {
    row: 'K',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
  },
  {
    row: 'L',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
  },
  {
    row: 'M',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
  },
  {
    row: 'N',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24]
  },
  {
    row: 'O',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
  },
  {
    row: 'P',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [9, 7, 5, 3, 1, 2, 4, 6, 8],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
  },
  {
    row: 'Q',
    tier: 'Rear (Part 2)',
    isVip: false,
    left: [31, 29, 27, 25, 23, 21, 19, 17, 15, 13, 11],
    center: [],
    right: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
  }
];

// Generate clean initial seats (ZERO mock data, 100% available)
export function generateInitialSeats() {
  const seats = {};

  THEATER_ROW_DEFINITIONS.forEach(def => {
    const { row, tier, isVip, left, center, right } = def;
    const sectionName = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(row) 
      ? 'Part 1: Front (Rows A-H)' 
      : 'Part 2: Rear (Rows I-Q)';

    const createSeat = (num, colWing) => {
      const id = `seat_${row}_${num}`;
      const seatCode = `${row}${num}`;
      const isAccessible = (row === 'A' && (num === 11 || num === 10)) || (row === 'Q' && num === 10);

      seats[id] = {
        id,
        eventId: EVENT_ID,
        section: sectionName,
        row,
        number: num,
        seatCode,
        wing: colWing,
        tier: isVip ? 'VIP Tier' : tier,
        isAccessible,
        status: 'available',
        assignedTo: null,
        lockedBy: null,
        lockedUntil: null,
        checkedInAt: null,
        updatedAt: Date.now()
      };
    };

    left.forEach(num => createSeat(num, 'left'));
    center.forEach(num => createSeat(num, 'center'));
    right.forEach(num => createSeat(num, 'right'));
  });

  return seats;
}
