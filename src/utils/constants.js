// Venue Layout & System Constants
// Exact Theater Layout: Rows A-Q across Part 1 (Front: A-H) & Part 2 (Rear: I-Q)
// Structured in 3 Columns: Left Wing (Odds), Center Section, Right Wing (Evens)

export const LOCK_TTL_MS = 60000; // 60-second hold lock TTL

export const ORGANIZERS = [
  {
    id: 'org_alice',
    name: 'Organizer 1 (Alice)',
    role: 'Organizer',
    avatar: 'O1',
    color: '#10B981', // Emerald
    badge: 'Organizer'
  },
  {
    id: 'org_bob',
    name: 'Organizer 2 (Bob)',
    role: 'Organizer',
    avatar: 'O2',
    color: '#6366F1', // Indigo
    badge: 'Organizer'
  },
  {
    id: 'org_charlie',
    name: 'Organizer 3 (Charlie)',
    role: 'Organizer',
    avatar: 'O3',
    color: '#F59E0B', // Amber
    badge: 'Organizer'
  },
  {
    id: 'org_diana',
    name: 'Organizer 4 (Diana)',
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

// Generate the initial seats matching the exact layout
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
        eventId: 'evt_grand_theater_2026',
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
        updatedAt: Date.now()
      };
    };

    left.forEach(num => createSeat(num, 'left'));
    center.forEach(num => createSeat(num, 'center'));
    right.forEach(num => createSeat(num, 'right'));
  });

  // Pre-populate sample guest reservations
  const sampleGuests = [
    { seatId: 'seat_B_1', name: 'Sarah Connor', ticketId: 'TCK-8821', status: 'checked_in' },
    { seatId: 'seat_B_2', name: 'John Connor', ticketId: 'TCK-8822', status: 'checked_in' },
    { seatId: 'seat_C_3', name: 'Michael Corleone', ticketId: 'TCK-1972', status: 'reserved' },
    { seatId: 'seat_C_4', name: 'Kay Adams', ticketId: 'TCK-1973', status: 'reserved' },
    { seatId: 'seat_D_1', name: 'Arthur Dent', ticketId: 'TCK-4242', status: 'reserved' },
    { seatId: 'seat_G_5', name: 'Elena Rostova', ticketId: 'TCK-5510', status: 'reserved' },
    { seatId: 'seat_I_1', name: 'Marcus Aurelius', ticketId: 'TCK-0180', status: 'reserved' },
    { seatId: 'seat_A_11', name: 'Bruce Wayne', ticketId: 'TCK-1939', status: 'checked_in' },
    { seatId: 'seat_A_10', name: 'Alfred Pennyworth', ticketId: 'TCK-1940', status: 'checked_in' }
  ];

  sampleGuests.forEach(g => {
    if (seats[g.seatId]) {
      seats[g.seatId].status = g.status;
      seats[g.seatId].assignedTo = {
        name: g.name,
        ticketId: g.ticketId
      };
    }
  });

  return seats;
}
