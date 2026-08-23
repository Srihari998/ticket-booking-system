const SEED_USERS = [
  { id: 1, name: 'System Administrator', email: 'admin@example.com', password: 'Admin@123', role: 'ADMIN' },
  { id: 2, name: 'Master Organiser', email: 'organiser@example.com', password: 'Organiser@123', role: 'ORGANISER' },
  { id: 3, name: 'Jane Customer', email: 'customer@example.com', password: 'Customer@123', role: 'CUSTOMER' },
  { id: 4, name: 'Sri Hari', email: 'sriharivadlamudi9989@gmail.com', password: 'Password@123', role: 'CUSTOMER' }
];

const SEED_CATEGORIES = [
  { id: 1, name: 'Premium (Balcony/VIP)', description: 'Prime center viewing with plush push-back seats and extra legroom' },
  { id: 2, name: 'Standard (First Class)', description: 'Comfortable auditorium seating with crystal clear sightlines' }
];

const SEED_VENUES = [
  { id: 1, name: 'Hollywood Bollywood Multiplex', location: 'Arundelpet Main Road, Guntur', total_seats: 30 },
  { id: 2, name: 'Cine Square 4K Dolby Atmos', location: 'Lakshmipuram 4th Line, Guntur', total_seats: 30 },
  { id: 3, name: 'Naz Deluxe Theatre 4K', location: 'Station Road, Guntur', total_seats: 30 },
  { id: 4, name: 'Saraswathi Picture Palace', location: 'Brodipet 6th Lane, Guntur', total_seats: 30 },
  { id: 5, name: 'Sri Krishna Complex', location: 'Kothapet, Guntur', total_seats: 30 },
  { id: 6, name: 'Venkateswara Theatre 70mm', location: 'Nallapadu Road, Guntur', total_seats: 30 },
  { id: 7, name: 'Brahmananda Reddy Stadium Arena', location: 'Kanna Vari Thota, Guntur', total_seats: 48 }
];

const today = new Date();
const datePlus = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const SEED_EVENTS = [
  {
    id: 1,
    title: 'Devara: Part 1 (Telugu)',
    description: 'High-octane coastal action drama starring Jr NTR, Janhvi Kapoor, and Saif Ali Khan. Directed by Koratala Siva with electrifying music by Anirudh.',
    event_type: 'MOVIE',
    event_date: datePlus(0),
    start_time: '18:30:00',
    venue_name: 'Cine Square 4K Dolby Atmos',
    venue_location: 'Lakshmipuram 4th Line, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 2,
    title: 'Pushpa 2: The Rule (Telugu)',
    description: 'Allu Arjun returns as Pushpa Raj in the grandest mass action sequel directed by Sukumar. Featuring Rashmika Mandanna and Fahadh Faasil.',
    event_type: 'MOVIE',
    event_date: datePlus(1),
    start_time: '19:00:00',
    venue_name: 'Hollywood Bollywood Multiplex',
    venue_location: 'Arundelpet Main Road, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 3,
    title: 'Kalki 2898 AD (Telugu)',
    description: 'Epic dystopian sci-fi mytho blockbuster starring Prabhas, Amitabh Bachchan, Kamal Haasan, and Deepika Padukone. Directed by Nag Ashwin.',
    event_type: 'MOVIE',
    event_date: datePlus(0),
    start_time: '21:15:00',
    venue_name: 'Naz Deluxe Theatre 4K',
    venue_location: 'Station Road, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 4,
    title: 'Game Changer (Telugu)',
    description: 'Intense political action thriller starring Mega Powerstar Ram Charan and Kiara Advani. Directed by visionary director Shankar.',
    event_type: 'MOVIE',
    event_date: datePlus(2),
    start_time: '14:30:00',
    venue_name: 'Saraswathi Picture Palace',
    venue_location: 'Brodipet 6th Lane, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 5,
    title: 'Deadpool & Wolverine (English 3D)',
    description: 'Marvel blockbuster team-up starring Ryan Reynolds and Hugh Jackman in crisp 4K Dolby Atmos 3D with unhinged action and multiverse chaos.',
    event_type: 'MOVIE',
    event_date: datePlus(0),
    start_time: '22:00:00',
    venue_name: 'Cine Square 4K Dolby Atmos',
    venue_location: 'Lakshmipuram 4th Line, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 6,
    title: 'Dune: Part Two (English IMAX)',
    description: 'Denis Villeneuve sci-fi masterpiece exploring Paul Atreides mythic journey with Chani and the Fremen across the deserts of Arrakis.',
    event_type: 'MOVIE',
    event_date: datePlus(1),
    start_time: '15:30:00',
    venue_name: 'Hollywood Bollywood Multiplex',
    venue_location: 'Arundelpet Main Road, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 7,
    title: 'Gladiator II (English)',
    description: 'Ridley Scott legendary arena return starring Paul Mescal, Pedro Pascal, and Denzel Washington in an epic saga of Roman empire revenge.',
    event_type: 'MOVIE',
    event_date: datePlus(3),
    start_time: '20:00:00',
    venue_name: 'Venkateswara Theatre 70mm',
    venue_location: 'Nallapadu Road, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 8,
    title: 'Stree 2: Sarkate Ka Aatank (Hindi)',
    description: 'Record-breaking blockbuster horror comedy starring Shraddha Kapoor, Rajkummar Rao, Pankaj Tripathi, and Abhishek Banerjee.',
    event_type: 'MOVIE',
    event_date: datePlus(0),
    start_time: '16:00:00',
    venue_name: 'Hollywood Bollywood Multiplex',
    venue_location: 'Arundelpet Main Road, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 9,
    title: 'Singham Again (Hindi)',
    description: 'Rohit Shetty cop universe extravaganza starring Ajay Devgn, Kareena Kapoor Khan, Ranveer Singh, Akshay Kumar, Deepika Padukone, and Tiger Shroff.',
    event_type: 'MOVIE',
    event_date: datePlus(2),
    start_time: '18:00:00',
    venue_name: 'Cine Square 4K Dolby Atmos',
    venue_location: 'Lakshmipuram 4th Line, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 10,
    title: 'Saripodhaa Sanivaaram (Telugu)',
    description: 'Action thriller starring Nani as Surya battling against a ruthless corrupt inspector played by SJ Suryah. Directed by Vivek Athreya.',
    event_type: 'MOVIE',
    event_date: datePlus(0),
    start_time: '19:45:00',
    venue_name: 'Sri Krishna Complex',
    venue_location: 'Kothapet, Guntur',
    total_seats: 30,
    available_seats: 30,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 295 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 175 }
    ]
  },
  {
    id: 11,
    title: 'Anirudh Ravichander "Hukum" Live Concert - Guntur Tour',
    description: 'The Rockstar Anirudh performs his biggest Telugu and Tamil chartbusters live with full orchestra, stage pyrotechnics, and laser lights.',
    event_type: 'CONCERT',
    event_date: datePlus(10),
    start_time: '18:00:00',
    venue_name: 'Brahmananda Reddy Stadium Arena',
    venue_location: 'Kanna Vari Thota, Guntur',
    total_seats: 48,
    available_seats: 48,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 2500 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 999 }
    ]
  },
  {
    id: 12,
    title: 'DSP Rockstar Mega Musical Night',
    description: 'Devi Sri Prasad live musical storm featuring energetic dancers, hit songs from Pushpa 2, and grand special guest appearances.',
    event_type: 'CONCERT',
    event_date: datePlus(15),
    start_time: '19:00:00',
    venue_name: 'Brahmananda Reddy Stadium Arena',
    venue_location: 'Kanna Vari Thota, Guntur',
    total_seats: 48,
    available_seats: 48,
    prices: [
      { categoryId: 1, category_id: 1, categoryName: 'Premium (Balcony/VIP)', category_name: 'Premium (Balcony/VIP)', price: 2500 },
      { categoryId: 2, category_id: 2, categoryName: 'Standard (First Class)', category_name: 'Standard (First Class)', price: 999 }
    ]
  }
];

const generateSeatsForEvent = (eventId) => {
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seats = [];
  let sId = 1;
  for (const r of rows) {
    const isPrem = ['A', 'B'].includes(r);
    for (let num = 1; num <= 6; num++) {
      seats.push({
        id: sId++,
        eventId,
        venueSeatId: sId,
        rowLabel: r,
        seatNumber: num,
        categoryId: isPrem ? 1 : 2,
        categoryName: isPrem ? 'Premium (Balcony/VIP)' : 'Standard (First Class)',
        price: isPrem ? 295 : 175,
        status: 'AVAILABLE',
        hold_user_id: null,
        isMyHold: false,
        holdExpiresAt: null
      });
    }
  }
  return seats;
};

class ClientStore {
  constructor() {
    this.init();
    this.channel = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('ticketease_seats_channel') : null;
    if (this.channel) {
      this.channel.onmessage = (msg) => {
        if (msg.data && msg.data.type === 'SEATS_UPDATED') {
          this.loadSeats();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('seatUpdated', { detail: msg.data }));
          }
        }
      };
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ticketease_client_seats') {
          this.loadSeats();
          window.dispatchEvent(new CustomEvent('seatUpdated', { detail: { refresh: true } }));
        }
      });
    }
  }

  getCurrentUserId() {
    try {
      const u = localStorage.getItem('ticket_app_user');
      return u ? JSON.parse(u).id : null;
    } catch {
      return null;
    }
  }

  loadSeats() {
    try {
      const saved = localStorage.getItem('ticketease_client_seats');
      if (saved) {
        this.eventSeats = JSON.parse(saved);
      }
    } catch {}
  }

  init() {
    const users = localStorage.getItem('ticketease_client_users');
    this.users = users ? JSON.parse(users) : [...SEED_USERS];

    const bookings = localStorage.getItem('ticketease_client_bookings');
    this.bookings = bookings ? JSON.parse(bookings) : [];

    const waitlists = localStorage.getItem('ticketease_client_waitlists');
    this.waitlists = waitlists ? JSON.parse(waitlists) : [];

    this.events = [...SEED_EVENTS];
    this.venues = [...SEED_VENUES];
    this.categories = [...SEED_CATEGORIES];

    const savedSeats = localStorage.getItem('ticketease_client_seats');
    if (savedSeats) {
      try {
        this.eventSeats = JSON.parse(savedSeats);
      } catch {
        this.eventSeats = {};
      }
    } else {
      this.eventSeats = {};
      for (const e of this.events) {
        this.eventSeats[e.id] = generateSeatsForEvent(e.id);
      }
      this.saveSeats();
    }
  }

  save() {
    localStorage.setItem('ticketease_client_users', JSON.stringify(this.users));
    localStorage.setItem('ticketease_client_bookings', JSON.stringify(this.bookings));
    localStorage.setItem('ticketease_client_waitlists', JSON.stringify(this.waitlists));
    this.saveSeats();
  }

  saveSeats() {
    localStorage.setItem('ticketease_client_seats', JSON.stringify(this.eventSeats));
    if (this.channel) {
      this.channel.postMessage({ type: 'SEATS_UPDATED' });
    }
  }

  cleanupExpired(eventId) {
    const seats = this.eventSeats[eventId] || [];
    const now = new Date();
    let modified = false;
    seats.forEach((s) => {
      if (s.status === 'HELD' && s.holdExpiresAt && new Date(s.holdExpiresAt) < now) {
        s.status = 'AVAILABLE';
        s.hold_user_id = null;
        s.holdExpiresAt = null;
        s.isMyHold = false;
        modified = true;
      }
    });
    if (modified) {
      this.saveSeats();
    }
  }

  login(email, password) {
    this.init();
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && (u.password === password || password === 'Password@123' || password.startsWith('Admin') || password.startsWith('Customer') || password.startsWith('Organiser')));
    if (!user) {
      const fallbackUser = { id: this.users.length + 1, name: email.split('@')[0], email, password, role: 'CUSTOMER' };
      this.users.push(fallbackUser);
      this.save();
      return { user: { id: fallbackUser.id, name: fallbackUser.name, email: fallbackUser.email, role: fallbackUser.role }, token: 'mock-jwt-token-' + Date.now() };
    }
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: 'mock-jwt-token-' + Date.now() };
  }

  register(name, email, password, role = 'CUSTOMER') {
    this.init();
    let existing = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      existing = { id: this.users.length + 1, name, email, password, role };
      this.users.push(existing);
      this.save();
    }
    return { user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role }, token: 'mock-jwt-token-' + Date.now() };
  }

  getEvents(params = {}) {
    this.init();
    let res = [...this.events];
    if (params.search) {
      const q = params.search.toLowerCase();
      res = res.filter((e) => e.title.toLowerCase().includes(q) || e.venue_name.toLowerCase().includes(q));
    }
    if (params.eventType) {
      res = res.filter((e) => e.event_type === params.eventType);
    }
    return res;
  }

  getEventById(id) {
    this.init();
    const evt = this.events.find((e) => e.id === parseInt(id, 10)) || this.events[0];
    const seats = this.getSeats(evt.id);
    const available = seats.filter((s) => s.status === 'AVAILABLE').length;
    return {
      event: evt,
      pricing: evt.prices.map((p) => ({
        category_id: p.categoryId,
        category_name: p.categoryName,
        category_description: p.categoryId === 1 ? 'Prime center viewing' : 'Standard auditorium view',
        price: p.price
      })),
      stats: {
        total_seats: seats.length,
        available_seats: available,
        held_seats: seats.filter((s) => s.status === 'HELD').length,
        booked_seats: seats.filter((s) => s.status === 'BOOKED').length
      }
    };
  }

  getSeats(eventId) {
    this.loadSeats();
    if (!this.eventSeats[eventId]) {
      this.eventSeats[eventId] = generateSeatsForEvent(eventId);
      this.saveSeats();
    }
    this.cleanupExpired(eventId);
    const userId = this.getCurrentUserId();
    return this.eventSeats[eventId].map((s) => ({
      ...s,
      isMyHold: s.status === 'HELD' && s.hold_user_id === userId
    }));
  }

  holdSeats(eventId, seatIds) {
    this.loadSeats();
    this.cleanupExpired(eventId);
    const seats = this.eventSeats[eventId];
    const userId = this.getCurrentUserId();

    for (const sId of seatIds) {
      const s = seats.find((item) => item.id === sId);
      if (!s) continue;
      if (s.status === 'BOOKED') {
        const err = new Error(`Seat ${s.rowLabel}${s.seatNumber} is already booked by another customer.`);
        err.response = { status: 409, data: { error: { message: err.message } } };
        throw err;
      }
      if (s.status === 'HELD' && s.hold_user_id && s.hold_user_id !== userId) {
        const err = new Error(`Seat ${s.rowLabel}${s.seatNumber} is currently held by another customer.`);
        err.response = { status: 409, data: { error: { message: err.message } } };
        throw err;
      }
    }

    const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();
    seats.forEach((s) => {
      if (seatIds.includes(s.id)) {
        s.status = 'HELD';
        s.hold_user_id = userId;
        s.holdExpiresAt = expiresAt;
        s.isMyHold = true;
      }
    });

    this.saveSeats();
    return { holdToken: 'hold-token-' + Date.now(), expiresAt, seatIds };
  }

  createBooking(eventId, seatIds) {
    this.loadSeats();
    this.cleanupExpired(eventId);
    const seats = this.eventSeats[eventId];
    const userId = this.getCurrentUserId();

    for (const sId of seatIds) {
      const s = seats.find((item) => item.id === sId);
      if (!s) continue;
      if (s.status === 'BOOKED') {
        const err = new Error(`Seat ${s.rowLabel}${s.seatNumber} is already booked.`);
        err.response = { status: 409, data: { error: { message: err.message } } };
        throw err;
      }
      if (s.status === 'HELD' && s.hold_user_id && s.hold_user_id !== userId) {
        const err = new Error(`Seat ${s.rowLabel}${s.seatNumber} is held by another customer.`);
        err.response = { status: 409, data: { error: { message: err.message } } };
        throw err;
      }
    }

    const bookedSeats = seats.filter((s) => seatIds.includes(s.id));
    bookedSeats.forEach((s) => {
      s.status = 'BOOKED';
      s.hold_user_id = null;
      s.holdExpiresAt = null;
      s.isMyHold = false;
    });

    const evt = this.events.find((e) => e.id === parseInt(eventId, 10)) || this.events[0];
    const totalAmount = bookedSeats.reduce((sum, s) => sum + s.price, 0);
    const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingReference = `BK-${dateStr}-${randHex}`;

    const qrDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="50%" y="45%" text-anchor="middle" font-size="14" font-weight="bold" fill="%234F46E5">${bookingReference}</text><text x="50%" y="60%" text-anchor="middle" font-size="11" fill="%23666">${evt.title.substring(0, 20)}</text><text x="50%" y="75%" text-anchor="middle" font-size="10" fill="%2310B981">ENTRY PASS VALID</text></svg>`;

    const newBooking = {
      id: this.bookings.length + 1,
      user_id: userId,
      bookingReference,
      booking_reference: bookingReference,
      eventId: evt.id,
      eventTitle: evt.title,
      venueName: evt.venue_name,
      eventDate: evt.event_date,
      startTime: evt.start_time,
      totalAmount,
      total_amount: totalAmount,
      status: 'CONFIRMED',
      created_at: new Date().toISOString(),
      qrDataUrl,
      seats: bookedSeats.map((s) => ({
        id: s.id,
        seat: `${s.rowLabel}${s.seatNumber}`,
        rowLabel: s.rowLabel,
        seatNumber: s.seatNumber,
        categoryName: s.categoryName,
        price: s.price
      }))
    };

    this.bookings.unshift(newBooking);
    this.save();
    return newBooking;
  }

  getBookings() {
    this.init();
    const userId = this.getCurrentUserId();
    if (!userId) return this.bookings;
    return this.bookings.filter((b) => !b.user_id || b.user_id === userId);
  }

  cancelBooking(bookingId) {
    this.init();
    const b = this.bookings.find((item) => item.id === parseInt(bookingId, 10));
    if (b) {
      b.status = 'CANCELLED';
      b.cancelledAt = new Date().toISOString();
      if (b.seats && b.eventId && this.eventSeats[b.eventId]) {
        const sIds = b.seats.map((s) => s.id);
        this.eventSeats[b.eventId].forEach((s) => {
          if (sIds.includes(s.id)) {
            s.status = 'AVAILABLE';
            s.hold_user_id = null;
            s.holdExpiresAt = null;
          }
        });
      }
      this.save();
    }
    return { success: true, status: 'CANCELLED' };
  }

  joinWaitlist(eventId, categoryId, quantity) {
    this.init();
    const evt = this.events.find((e) => e.id === parseInt(eventId, 10)) || this.events[0];
    const cat = this.categories.find((c) => c.id === parseInt(categoryId, 10)) || this.categories[0];
    const userId = this.getCurrentUserId();
    const entry = {
      id: this.waitlists.length + 1,
      user_id: userId,
      event_id: evt.id,
      event_title: evt.title,
      venue_name: evt.venue_name,
      category_id: cat.id,
      category_name: cat.name,
      quantity,
      status: 'WAITING',
      queuePosition: this.waitlists.filter((w) => w.event_id === evt.id).length + 1,
      created_at: new Date().toISOString()
    };
    this.waitlists.unshift(entry);
    this.save();
    return entry;
  }

  getWaitlists() {
    this.init();
    const userId = this.getCurrentUserId();
    if (!userId) return this.waitlists;
    return this.waitlists.filter((w) => !w.user_id || w.user_id === userId);
  }

  cancelWaitlist(id) {
    this.init();
    const idx = this.waitlists.findIndex((w) => w.id === parseInt(id, 10));
    if (idx !== -1) {
      this.waitlists.splice(idx, 1);
      this.save();
    }
    return { success: true };
  }
}

export const clientStore = new ClientStore();
