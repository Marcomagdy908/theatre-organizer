// Venue Layout & System Constants
// Event: SEF_امرا جديدا
// Exact Theater Layout: Rows A-Q across Part 1 (Front: A-H) & Part 2 (Rear: I-Q)
// Structured in 3 Columns: Left Wing (Odds), Center Section, Right Wing (Evens)

export const EVENT_ID = 'evt_sef_amran_jadidan_2026';
export const EVENT_TITLE = 'SEF_امرا جديدا';

export const LOCK_TTL_MS = 60000; // 60-second hold lock TTL

export const ORGANIZERS = [
  {
    id: 'org_1',
    name: 'Organizer 1',
    role: 'Organizer',
    avatar: 'O1',
    color: '#10B981', // Emerald
    badge: 'Organizer'
  },
  {
    id: 'org_2',
    name: 'Organizer 2',
    role: 'Organizer',
    avatar: 'O2',
    color: '#6366F1', // Indigo
    badge: 'Organizer'
  },
  {
    id: 'org_3',
    name: 'Organizer 3',
    role: 'Organizer',
    avatar: 'O3',
    color: '#F59E0B', // Amber
    badge: 'Organizer'
  },
  {
    id: 'org_4',
    name: 'Organizer 4',
    role: 'Organizer',
    avatar: 'O4',
    color: '#EC4899', // Pink
    badge: 'Organizer'
  }
];

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
        wing: colWing, // 'left' | 'center' | 'right'
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
