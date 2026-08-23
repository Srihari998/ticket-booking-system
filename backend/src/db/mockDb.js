const bcrypt = require('bcryptjs');

class MockDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = [
      { id: 1, name: 'System Administrator', email: 'admin@example.com', password_hash: bcrypt.hashSync('Admin@123', 10), role: 'ADMIN', created_at: new Date() },
      { id: 2, name: 'Master Organiser', email: 'organiser@example.com', password_hash: bcrypt.hashSync('Organiser@123', 10), role: 'ORGANISER', created_at: new Date() },
      { id: 3, name: 'Jane Customer', email: 'customer@example.com', password_hash: bcrypt.hashSync('Customer@123', 10), role: 'CUSTOMER', created_at: new Date() },
      { id: 4, name: 'Second Customer', email: 'customer2@example.com', password_hash: bcrypt.hashSync('Customer@123', 10), role: 'CUSTOMER', created_at: new Date() }
    ];

    this.seatCategories = [
      { id: 1, name: 'Premium (Balcony/VIP)', description: 'Prime center viewing with plush push-back seats and extra legroom' },
      { id: 2, name: 'Standard (First Class)', description: 'Comfortable auditorium seating with crystal clear sightlines' }
    ];

    this.venues = [
      { id: 1, name: 'Hollywood Bollywood Multiplex', location: 'Arundelpet Main Road, Guntur', created_by: 1, created_at: new Date() },
      { id: 2, name: 'Cine Square 4K Dolby Atmos', location: 'Lakshmipuram 4th Line, Guntur', created_by: 1, created_at: new Date() },
      { id: 3, name: 'Naz Deluxe Theatre 4K', location: 'Station Road, Guntur', created_by: 1, created_at: new Date() },
      { id: 4, name: 'Saraswathi Picture Palace', location: 'Brodipet 6th Lane, Guntur', created_by: 1, created_at: new Date() },
      { id: 5, name: 'Sri Krishna Complex', location: 'Kothapet, Guntur', created_by: 1, created_at: new Date() },
      { id: 6, name: 'Venkateswara Theatre 70mm', location: 'Nallapadu Road, Guntur', created_by: 1, created_at: new Date() },
      { id: 7, name: 'Brahmananda Reddy Stadium Arena', location: 'Kanna Vari Thota, Guntur', created_by: 1, created_at: new Date() }
    ];

    this.venueSeats = [];
    let vsId = 1;
    for (let vId = 1; vId <= 7; vId++) {
      const rows = vId === 7 ? ['A', 'B', 'C', 'D', 'E', 'F'] : ['A', 'B', 'C', 'D', 'E'];
      const seatsCount = vId === 7 ? 8 : 6;
      for (const r of rows) {
        const catId = ['A', 'B'].includes(r) ? 1 : 2;
        for (let s = 1; s <= seatsCount; s++) {
          this.venueSeats.push({ id: vsId++, venue_id: vId, row_label: r, seat_number: s, category_id: catId });
        }
      }
    }

    const today = new Date();
    const datePlus = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    this.events = [
      {
        id: 1,
        organiser_id: 2,
        venue_id: 2,
        title: 'Devara: Part 1 (Telugu)',
        description: 'High-octane coastal action drama starring Jr NTR, Janhvi Kapoor, and Saif Ali Khan. Directed by Koratala Siva with electrifying music by Anirudh.',
        event_type: 'MOVIE',
        event_date: datePlus(0),
        start_time: '18:30:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 2,
        organiser_id: 2,
        venue_id: 1,
        title: 'Pushpa 2: The Rule (Telugu)',
        description: 'Allu Arjun returns as Pushpa Raj in the grandest mass action sequel directed by Sukumar. Featuring Rashmika Mandanna and Fahadh Faasil.',
        event_type: 'MOVIE',
        event_date: datePlus(1),
        start_time: '19:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 3,
        organiser_id: 2,
        venue_id: 3,
        title: 'Kalki 2898 AD (Telugu)',
        description: 'Epic dystopian sci-fi mytho blockbuster starring Prabhas, Amitabh Bachchan, Kamal Haasan, and Deepika Padukone. Directed by Nag Ashwin.',
        event_type: 'MOVIE',
        event_date: datePlus(0),
        start_time: '21:15:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 4,
        organiser_id: 2,
        venue_id: 4,
        title: 'Game Changer (Telugu)',
        description: 'Intense political action thriller starring Mega Powerstar Ram Charan and Kiara Advani. Directed by visionary director Shankar.',
        event_type: 'MOVIE',
        event_date: datePlus(2),
        start_time: '14:30:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 5,
        organiser_id: 2,
        venue_id: 2,
        title: 'Deadpool & Wolverine (English 3D)',
        description: 'Marvel blockbuster team-up starring Ryan Reynolds and Hugh Jackman in crisp 4K Dolby Atmos 3D with unhinged action and multiverse chaos.',
        event_type: 'MOVIE',
        event_date: datePlus(0),
        start_time: '22:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 6,
        organiser_id: 2,
        venue_id: 1,
        title: 'Dune: Part Two (English IMAX)',
        description: 'Denis Villeneuve sci-fi masterpiece exploring Paul Atreides mythic journey with Chani and the Fremen across the deserts of Arrakis.',
        event_type: 'MOVIE',
        event_date: datePlus(1),
        start_time: '15:30:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 7,
        organiser_id: 2,
        venue_id: 6,
        title: 'Gladiator II (English)',
        description: 'Ridley Scott legendary arena return starring Paul Mescal, Pedro Pascal, and Denzel Washington in an epic saga of Roman empire revenge.',
        event_type: 'MOVIE',
        event_date: datePlus(3),
        start_time: '20:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 8,
        organiser_id: 2,
        venue_id: 1,
        title: 'Stree 2: Sarkate Ka Aatank (Hindi)',
        description: 'Record-breaking blockbuster horror comedy starring Shraddha Kapoor, Rajkummar Rao, Pankaj Tripathi, and Abhishek Banerjee.',
        event_type: 'MOVIE',
        event_date: datePlus(0),
        start_time: '16:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 9,
        organiser_id: 2,
        venue_id: 2,
        title: 'Singham Again (Hindi)',
        description: 'Rohit Shetty cop universe extravaganza starring Ajay Devgn, Kareena Kapoor Khan, Ranveer Singh, Akshay Kumar, Deepika Padukone, and Tiger Shroff.',
        event_type: 'MOVIE',
        event_date: datePlus(2),
        start_time: '18:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 10,
        organiser_id: 2,
        venue_id: 5,
        title: 'Saripodhaa Sanivaaram (Telugu)',
        description: 'Action thriller starring Nani as Surya battling against a ruthless corrupt inspector played by SJ Suryah. Directed by Vivek Athreya.',
        event_type: 'MOVIE',
        event_date: datePlus(0),
        start_time: '19:45:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 11,
        organiser_id: 2,
        venue_id: 7,
        title: 'Anirudh Ravichander "Hukum" Live Concert - Guntur Tour',
        description: 'The Rockstar Anirudh performs his biggest Telugu and Tamil chartbusters live with full orchestra, stage pyrotechnics, and laser lights.',
        event_type: 'CONCERT',
        event_date: datePlus(10),
        start_time: '18:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      },
      {
        id: 12,
        organiser_id: 2,
        venue_id: 7,
        title: 'DSP Rockstar Mega Musical Night',
        description: 'Devi Sri Prasad live musical storm featuring energetic dancers, hit songs from Pushpa 2, and grand special guest appearances.',
        event_type: 'CONCERT',
        event_date: datePlus(15),
        start_time: '19:00:00',
        status: 'PUBLISHED',
        created_at: new Date()
      }
    ];

    this.eventCategoryPrices = [];
    let ecpId = 1;
    for (const evt of this.events) {
      if (evt.event_type === 'CONCERT') {
        this.eventCategoryPrices.push({ id: ecpId++, event_id: evt.id, category_id: 1, price: 2500.00 });
        this.eventCategoryPrices.push({ id: ecpId++, event_id: evt.id, category_id: 2, price: 999.00 });
      } else {
        this.eventCategoryPrices.push({ id: ecpId++, event_id: evt.id, category_id: 1, price: 295.00 });
        this.eventCategoryPrices.push({ id: ecpId++, event_id: evt.id, category_id: 2, price: 175.00 });
      }
    }

    this.eventSeats = [];
    let esId = 1;
    for (const evt of this.events) {
      const vSeats = this.venueSeats.filter((vs) => vs.venue_id === evt.venue_id);
      for (const vs of vSeats) {
        this.eventSeats.push({
          id: esId++,
          event_id: evt.id,
          venue_seat_id: vs.id,
          status: 'AVAILABLE',
          hold_token: null,
          hold_user_id: null,
          hold_expires_at: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    this.bookings = [];
    this.bookingSeats = [];
    this.waitlistEntries = [];
    this.waitlistOffers = [];
    this.waitlistOfferSeats = [];
  }

  normalize(sql) {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async query(text, params = []) {
    const norm = this.normalize(text);

    if (norm.includes('from users where email = $1')) {
      const user = this.users.find((u) => u.email.toLowerCase() === params[0].toLowerCase());
      return { rows: user ? [{ ...user }] : [] };
    }

    if (norm.includes('from users where id = $1')) {
      const user = this.users.find((u) => u.id === parseInt(params[0], 10));
      return { rows: user ? [{ id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }] : [] };
    }

    if (norm.startsWith('insert into users')) {
      const newUser = {
        id: this.users.length + 1,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3],
        created_at: new Date()
      };
      this.users.push(newUser);
      return { rows: [{ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, created_at: newUser.created_at }] };
    }

    if (norm.startsWith('select v.id, v.name, v.location')) {
      const rows = this.venues.map((v) => ({
        id: v.id,
        name: v.name,
        location: v.location,
        created_by: v.created_by,
        created_at: v.created_at,
        total_seats: this.venueSeats.filter((vs) => vs.venue_id === v.id).length
      }));
      return { rows };
    }

    if (norm.startsWith('select * from venues where id = $1') || norm.startsWith('select id from venues where id = $1')) {
      const v = this.venues.find((item) => item.id === parseInt(params[0], 10));
      return { rows: v ? [{ ...v }] : [] };
    }

    if (norm.startsWith('insert into venues')) {
      const newV = {
        id: this.venues.length + 1,
        name: params[0],
        location: params[1],
        created_by: params[2],
        created_at: new Date()
      };
      this.venues.push(newV);
      return { rows: [{ ...newV }] };
    }

    if (norm.startsWith('update venues set')) {
      const v = this.venues.find((item) => item.id === parseInt(params[params.length - 1], 10));
      if (v) {
        if (params.length === 3) {
          v.name = params[0];
          v.location = params[1];
        } else if (params[0] && norm.includes('name = $2')) {
          v.name = params[0];
        } else if (params[0] && norm.includes('location = $2')) {
          v.location = params[0];
        }
        return { rows: [{ ...v }] };
      }
      return { rows: [] };
    }

    if (norm.startsWith('delete from venues where id = $1')) {
      const idx = this.venues.findIndex((item) => item.id === parseInt(params[0], 10));
      if (idx !== -1) {
        const deleted = this.venues.splice(idx, 1)[0];
        return { rows: [{ id: deleted.id }] };
      }
      return { rows: [] };
    }

    if (norm.startsWith('select id, name, description from seat_categories')) {
      return { rows: [...this.seatCategories] };
    }

    if (norm.startsWith('select vs.id, vs.venue_id, vs.row_label, vs.seat_number')) {
      const venueId = parseInt(params[0], 10);
      const seats = this.venueSeats
        .filter((vs) => vs.venue_id === venueId)
        .map((vs) => {
          const cat = this.seatCategories.find((c) => c.id === vs.category_id);
          return {
            id: vs.id,
            venue_id: vs.venue_id,
            row_label: vs.row_label,
            seat_number: vs.seat_number,
            category_id: vs.category_id,
            category_name: cat ? cat.name : 'Standard'
          };
        });
      return { rows: seats };
    }

    if (norm.startsWith('insert into venue_seats')) {
      const venueId = parseInt(params[0], 10);
      const rowLabel = params[1];
      const seatNumber = parseInt(params[2], 10);
      const categoryId = parseInt(params[3], 10);

      let existing = this.venueSeats.find((s) => s.venue_id === venueId && s.row_label === rowLabel && s.seat_number === seatNumber);
      if (existing) {
        existing.category_id = categoryId;
        return { rows: [{ ...existing }] };
      } else {
        const newVs = {
          id: this.venueSeats.length + 1,
          venue_id: venueId,
          row_label: rowLabel,
          seat_number: seatNumber,
          category_id: categoryId
        };
        this.venueSeats.push(newVs);
        return { rows: [{ ...newVs }] };
      }
    }

    if (norm.startsWith('select e.id, e.title') && norm.includes('from events e') && norm.includes('where 1=1')) {
      let filtered = [...this.events];

      if (params.length > 0) {
        for (const p of params) {
          if (typeof p === 'string' && p.startsWith('%') && p.endsWith('%')) {
            const searchStr = p.replace(/%/g, '').toLowerCase();
            filtered = filtered.filter((evt) => {
              const v = this.venues.find((item) => item.id === evt.venue_id) || {};
              return evt.title.toLowerCase().includes(searchStr) || (evt.description && evt.description.toLowerCase().includes(searchStr)) || (v.name && v.name.toLowerCase().includes(searchStr));
            });
          } else if (['MOVIE', 'CONCERT', 'EVENT'].includes(p)) {
            filtered = filtered.filter((evt) => evt.event_type === p);
          }
        }
      }

      const rows = filtered.map((e) => {
        const venue = this.venues.find((v) => v.id === e.venue_id) || {};
        const organiser = this.users.find((u) => u.id === e.organiser_id) || {};
        const prices = this.eventCategoryPrices
          .filter((ecp) => ecp.event_id === e.id)
          .map((ecp) => {
            const cat = this.seatCategories.find((c) => c.id === ecp.category_id);
            return {
              categoryId: ecp.category_id,
              categoryName: cat ? cat.name : '',
              price: ecp.price
            };
          });
        const eSeats = this.eventSeats.filter((es) => es.event_id === e.id);
        const total_seats = eSeats.length;
        const available_seats = eSeats.filter((es) => es.status === 'AVAILABLE').length;

        return {
          id: e.id,
          title: e.title,
          description: e.description,
          event_type: e.event_type,
          event_date: e.event_date,
          start_time: e.start_time,
          status: e.status,
          created_at: e.created_at,
          venue_id: venue.id,
          venue_name: venue.name,
          venue_location: venue.location,
          organiser_id: organiser.id,
          organiser_name: organiser.name,
          prices,
          total_seats,
          available_seats
        };
      });
      return { rows };
    }

    if (norm.startsWith('select e.id, e.title') && norm.includes('from events e') && norm.includes('where e.id = $1')) {
      const eventId = parseInt(params[0], 10);
      const e = this.events.find((evt) => evt.id === eventId);
      if (!e) return { rows: [] };
      const venue = this.venues.find((v) => v.id === e.venue_id) || {};
      const organiser = this.users.find((u) => u.id === e.organiser_id) || {};
      return {
        rows: [{
          id: e.id,
          title: e.title,
          description: e.description,
          event_type: e.event_type,
          event_date: e.event_date,
          start_time: e.start_time,
          status: e.status,
          created_at: e.created_at,
          venue_id: venue.id,
          venue_name: venue.name,
          venue_location: venue.location,
          organiser_id: organiser.id,
          organiser_name: organiser.name
        }]
      };
    }

    if (norm.startsWith('select ecp.category_id, sc.name as category_name')) {
      const eventId = parseInt(params[0], 10);
      const prices = this.eventCategoryPrices
        .filter((ecp) => ecp.event_id === eventId)
        .map((ecp) => {
          const cat = this.seatCategories.find((c) => c.id === ecp.category_id);
          return {
            category_id: ecp.category_id,
            category_name: cat ? cat.name : '',
            category_description: cat ? cat.description : '',
            price: ecp.price
          };
        });
      return { rows: prices };
    }

    if (norm.includes('count(*)::int as total_seats') && norm.includes('from event_seats') && norm.includes('where event_id = $1')) {
      const eventId = parseInt(params[0], 10);
      const eSeats = this.eventSeats.filter((es) => es.event_id === eventId);
      return {
        rows: [{
          total_seats: eSeats.length,
          available_seats: eSeats.filter((es) => es.status === 'AVAILABLE').length,
          held_seats: eSeats.filter((es) => es.status === 'HELD').length,
          booked_seats: eSeats.filter((es) => es.status === 'BOOKED').length
        }]
      };
    }

    if (norm.startsWith('select vs.category_id, sc.name as category_name') && norm.includes('from event_seats es')) {
      const eventId = parseInt(params[0], 10);
      const res = [];
      for (const cat of this.seatCategories) {
        const seats = this.eventSeats.filter((es) => {
          if (es.event_id !== eventId) return false;
          const vs = this.venueSeats.find((v) => v.id === es.venue_seat_id);
          return vs && vs.category_id === cat.id;
        });
        if (seats.length > 0) {
          res.push({
            category_id: cat.id,
            category_name: cat.name,
            total: seats.length,
            available: seats.filter((s) => s.status === 'AVAILABLE').length,
            held: seats.filter((s) => s.status === 'HELD').length,
            booked: seats.filter((s) => s.status === 'BOOKED').length
          });
        }
      }
      return { rows: res };
    }

    if (norm.startsWith('select id, status from events where id = $1')) {
      const e = this.events.find((evt) => evt.id === parseInt(params[0], 10));
      return { rows: e ? [{ id: e.id, status: e.status }] : [] };
    }

    if (norm.startsWith('select id, title, status from events where id = $1')) {
      const e = this.events.find((evt) => evt.id === parseInt(params[0], 10));
      return { rows: e ? [{ id: e.id, title: e.title, status: e.status }] : [] };
    }

    if (norm.startsWith('select organiser_id from events where id = $1')) {
      const e = this.events.find((evt) => evt.id === parseInt(params[0], 10));
      return { rows: e ? [{ organiser_id: e.organiser_id }] : [] };
    }

    if (norm.startsWith('select es.id, es.event_id, es.venue_seat_id, es.status')) {
      const eventId = parseInt(params[0], 10);
      const seats = this.eventSeats
        .filter((es) => es.event_id === eventId)
        .map((es) => {
          const vs = this.venueSeats.find((v) => v.id === es.venue_seat_id) || {};
          const cat = this.seatCategories.find((c) => c.id === vs.category_id) || {};
          const ecp = this.eventCategoryPrices.find((p) => p.event_id === eventId && p.category_id === vs.category_id) || { price: 0 };
          return {
            id: es.id,
            event_id: es.event_id,
            venue_seat_id: es.venue_seat_id,
            status: es.status,
            hold_expires_at: es.hold_expires_at,
            hold_user_id: es.hold_user_id,
            row_label: vs.row_label,
            seat_number: vs.seat_number,
            category_id: vs.category_id,
            category_name: cat.name,
            price: ecp.price
          };
        });
      return { rows: seats };
    }

    if (norm.startsWith('insert into events')) {
      const newE = {
        id: this.events.length + 1,
        organiser_id: params[0],
        venue_id: params[1],
        title: params[2],
        description: params[3],
        event_type: params[4],
        event_date: params[5],
        start_time: params[6],
        status: 'PUBLISHED',
        created_at: new Date()
      };
      this.events.push(newE);
      return { rows: [{ ...newE }] };
    }

    if (norm.startsWith('insert into event_category_prices')) {
      const eventId = parseInt(params[0], 10);
      const catId = parseInt(params[1], 10);
      const price = parseFloat(params[2]);
      let existing = this.eventCategoryPrices.find((p) => p.event_id === eventId && p.category_id === catId);
      if (existing) {
        existing.price = price;
      } else {
        this.eventCategoryPrices.push({
          id: this.eventCategoryPrices.length + 1,
          event_id: eventId,
          category_id: catId,
          price
        });
      }
      return { rows: [] };
    }

    if (norm.startsWith('insert into event_seats (event_id, venue_seat_id, status)')) {
      const eventId = parseInt(params[0], 10);
      const venueId = parseInt(params[1], 10);
      const vSeats = this.venueSeats.filter((vs) => vs.venue_id === venueId);
      for (const vs of vSeats) {
        if (!this.eventSeats.some((es) => es.event_id === eventId && es.venue_seat_id === vs.id)) {
          this.eventSeats.push({
            id: this.eventSeats.length + 1,
            event_id: eventId,
            venue_seat_id: vs.id,
            status: 'AVAILABLE',
            hold_token: null,
            hold_user_id: null,
            hold_expires_at: null,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
      return { rows: [] };
    }

    if (norm.startsWith('update events set status = \'cancelled\' where id = $1')) {
      const e = this.events.find((evt) => evt.id === parseInt(params[0], 10));
      if (e) e.status = 'CANCELLED';
      return { rows: [] };
    }

    if (norm.startsWith('select id from event_category_prices where event_id = $1 and category_id = $2')) {
      const found = this.eventCategoryPrices.find((p) => p.event_id === parseInt(params[0], 10) && p.category_id === parseInt(params[1], 10));
      return { rows: found ? [{ id: found.id }] : [] };
    }

    if (norm.includes('from waitlist_entries') && norm.includes('status in (\'waiting\', \'offered\')')) {
      const found = this.waitlistEntries.find((we) => we.event_id === parseInt(params[0], 10) && we.category_id === parseInt(params[1], 10) && we.user_id === parseInt(params[2], 10) && ['WAITING', 'OFFERED'].includes(we.status));
      return { rows: found ? [{ id: found.id }] : [] };
    }

    if (norm.includes('count(*)::int as count') && norm.includes('from event_seats es')) {
      const eventId = parseInt(params[0], 10);
      const catId = parseInt(params[1], 10);
      const count = this.eventSeats.filter((es) => {
        if (es.event_id !== eventId || es.status !== 'AVAILABLE') return false;
        const vs = this.venueSeats.find((v) => v.id === es.venue_seat_id);
        return vs && vs.category_id === catId;
      }).length;
      return { rows: [{ count }] };
    }

    if (norm.startsWith('insert into waitlist_entries')) {
      const entry = {
        id: this.waitlistEntries.length + 1,
        event_id: parseInt(params[0], 10),
        user_id: parseInt(params[1], 10),
        category_id: parseInt(params[2], 10),
        quantity: parseInt(params[3], 10),
        status: 'WAITING',
        created_at: new Date()
      };
      this.waitlistEntries.push(entry);
      return { rows: [{ ...entry }] };
    }

    if (norm.includes('count(*)::int as position') && norm.includes('from waitlist_entries')) {
      const eventId = parseInt(params[0], 10);
      const catId = parseInt(params[1], 10);
      const pos = this.waitlistEntries.filter((we) => we.event_id === eventId && we.category_id === catId && we.status === 'WAITING').length;
      return { rows: [{ position: pos }] };
    }

    if (norm.includes('from waitlist_entries we') && norm.includes('where we.user_id = $1')) {
      const userId = parseInt(params[0], 10);
      const entries = this.waitlistEntries.filter((we) => we.user_id === userId);
      const rows = entries.map((we) => {
        const event = this.events.find((e) => e.id === we.event_id) || {};
        const venue = this.venues.find((v) => v.id === event.venue_id) || {};
        const cat = this.seatCategories.find((c) => c.id === we.category_id) || {};
        const offer = this.waitlistOffers.find((wo) => wo.waitlist_entry_id === we.id && wo.status === 'ACTIVE');
        return {
          id: we.id,
          event_id: we.event_id,
          category_id: we.category_id,
          quantity: we.quantity,
          status: we.status,
          created_at: we.created_at,
          event_title: event.title,
          event_date: event.event_date,
          start_time: event.start_time,
          venue_name: venue.name,
          category_name: cat.name,
          active_offer_token: offer ? offer.token : null,
          offer_expires_at: offer ? offer.expires_at : null,
          offer_status: offer ? offer.status : null
        };
      });
      return { rows };
    }

    if (norm.startsWith('select id, status from waitlist_entries where id = $1 and user_id = $2')) {
      const we = this.waitlistEntries.find((e) => e.id === parseInt(params[0], 10) && e.user_id === parseInt(params[1], 10));
      return { rows: we ? [{ id: we.id, status: we.status }] : [] };
    }

    if (norm.startsWith('update waitlist_entries set status = \'cancelled\' where id = $1')) {
      const we = this.waitlistEntries.find((e) => e.id === parseInt(params[0], 10));
      if (we) we.status = 'CANCELLED';
      return { rows: [] };
    }

    if (norm.startsWith('update waitlist_offers set status = \'cancelled\' where waitlist_entry_id = $1')) {
      const wo = this.waitlistOffers.find((o) => o.waitlist_entry_id === parseInt(params[0], 10) && o.status === 'ACTIVE');
      if (wo) wo.status = 'CANCELLED';
      return { rows: [] };
    }

    if (norm.includes('from waitlist_offers wo') && norm.includes('where wo.token = $1')) {
      const offer = this.waitlistOffers.find((o) => o.token === params[0]);
      if (!offer) return { rows: [] };
      const entry = this.waitlistEntries.find((e) => e.id === offer.waitlist_entry_id) || {};
      const user = this.users.find((u) => u.id === entry.user_id) || {};
      const event = this.events.find((e) => e.id === entry.event_id) || {};
      const venue = this.venues.find((v) => v.id === event.venue_id) || {};
      const cat = this.seatCategories.find((c) => c.id === entry.category_id) || {};
      const ecp = this.eventCategoryPrices.find((p) => p.event_id === event.id && p.category_id === cat.id) || { price: 0 };
      return {
        rows: [{
          id: offer.id,
          token: offer.token,
          expires_at: offer.expires_at,
          status: offer.status || 'ACTIVE',
          waitlist_entry_id: entry.id,
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          event_id: event.id,
          event_title: event.title,
          event_date: event.event_date,
          start_time: event.start_time,
          venue_id: venue.id,
          venue_name: venue.name,
          venue_location: venue.location,
          category_id: cat.id,
          category_name: cat.name,
          unit_price: ecp.price,
          quantity: entry.quantity
        }]
      };
    }

    if (norm.includes('from waitlist_offer_seats wos') && norm.includes('where wos.offer_id = $1')) {
      const offerId = parseInt(params[0], 10);
      const wosRows = this.waitlistOfferSeats.filter((w) => w.offer_id === offerId);
      const rows = wosRows.map((w) => {
        const es = this.eventSeats.find((s) => s.id === w.event_seat_id);
        const vs = this.venueSeats.find((v) => v.id === es.venue_seat_id);
        return {
          id: es.id,
          row_label: vs.row_label,
          seat_number: vs.seat_number,
          status: es.status
        };
      });
      return { rows };
    }

    if (norm.includes('from bookings b') && norm.includes('where b.user_id = $1')) {
      const userId = parseInt(params[0], 10);
      const userBookings = this.bookings.filter((b) => b.user_id === userId);
      const rows = userBookings.map((b) => {
        const e = this.events.find((evt) => evt.id === b.event_id) || {};
        const v = this.venues.find((vnt) => vnt.id === e.venue_id) || {};
        return {
          id: b.id,
          booking_reference: b.booking_reference,
          event_id: b.event_id,
          total_amount: b.total_amount,
          status: b.status,
          created_at: b.created_at,
          cancelled_at: b.cancelled_at,
          event_title: e.title,
          event_date: e.event_date,
          start_time: e.start_time,
          event_type: e.event_type,
          venue_name: v.name,
          venue_location: v.location
        };
      });
      return { rows };
    }

    if (norm.includes('from booking_seats bs') && norm.includes('where bs.booking_id = any($1)')) {
      const bookingIds = Array.isArray(params[0]) ? params[0] : [params[0]];
      const rows = [];
      for (const bs of this.bookingSeats.filter((b) => bookingIds.includes(b.booking_id))) {
        const es = this.eventSeats.find((s) => s.id === bs.event_seat_id);
        const vs = this.venueSeats.find((v) => v.id === es.venue_seat_id);
        const sc = this.seatCategories.find((c) => c.id === vs.category_id);
        rows.push({
          booking_id: bs.booking_id,
          price: bs.price,
          row_label: vs.row_label,
          seat_number: vs.seat_number,
          category_name: sc ? sc.name : ''
        });
      }
      return { rows };
    }

    if (norm.includes('from bookings b') && norm.includes('where b.id = $1')) {
      const b = this.bookings.find((bk) => bk.id === parseInt(params[0], 10));
      if (!b) return { rows: [] };
      const u = this.users.find((usr) => usr.id === b.user_id) || {};
      const e = this.events.find((evt) => evt.id === b.event_id) || {};
      const v = this.venues.find((vnt) => vnt.id === e.venue_id) || {};
      return {
        rows: [{
          id: b.id,
          booking_reference: b.booking_reference,
          user_id: b.user_id,
          event_id: b.event_id,
          total_amount: b.total_amount,
          status: b.status,
          created_at: b.created_at,
          cancelled_at: b.cancelled_at,
          user_name: u.name,
          user_email: u.email,
          event_title: e.title,
          event_date: e.event_date,
          start_time: e.start_time,
          event_type: e.event_type,
          venue_name: v.name,
          venue_location: v.location
        }]
      };
    }

    if (norm.startsWith('select sc.id as category_id, sc.name as category_name') && norm.includes('from seat_categories sc')) {
      const eventId = parseInt(params[0], 10);
      const rows = this.seatCategories.map((sc) => {
        const count = this.waitlistEntries.filter((we) => we.category_id === sc.id && we.event_id === eventId && we.status === 'WAITING').length;
        return {
          category_id: sc.id,
          category_name: sc.name,
          waiting_count: count
        };
      });
      return { rows };
    }

    if (norm.includes('update waitlist_offers set status = \'expired\' where id = $1')) {
      const wo = this.waitlistOffers.find((o) => o.id === parseInt(params[0], 10));
      if (wo) wo.status = 'EXPIRED';
      return { rows: [] };
    }

    return { rows: [] };
  }

  createClient() {
    const self = this;
    return {
      inTransaction: false,
      async query(text, params = []) {
        const norm = self.normalize(text);

        if (norm === 'begin') {
          this.inTransaction = true;
          return { rows: [] };
        }
        if (norm === 'commit') {
          this.inTransaction = false;
          return { rows: [] };
        }
        if (norm === 'rollback') {
          this.inTransaction = false;
          return { rows: [] };
        }

        if (norm.includes('count(*)::int as count') && norm.includes('from event_seats es')) {
          const eventId = parseInt(params[0], 10);
          const catId = parseInt(params[1], 10);
          const count = self.eventSeats.filter((es) => {
            if (es.event_id !== eventId || es.status !== 'AVAILABLE') return false;
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            return vs && vs.category_id === catId;
          }).length;
          return { rows: [{ count }] };
        }

        if (norm.includes('from event_seats es') && norm.includes('where es.id = any($1) and es.event_id = $2') && norm.includes('for update')) {
          const seatIds = Array.isArray(params[0]) ? params[0] : [params[0]];
          const eventId = parseInt(params[1], 10);

          const rows = [];
          for (const sId of seatIds) {
            const es = self.eventSeats.find((s) => s.id === sId && s.event_id === eventId);
            if (es) {
              const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
              const sc = self.seatCategories.find((c) => c.id === vs.category_id);
              const ecp = self.eventCategoryPrices.find((p) => p.event_id === eventId && p.category_id === vs.category_id) || { price: 0 };
              rows.push({
                id: es.id,
                event_id: es.event_id,
                status: es.status,
                hold_user_id: es.hold_user_id,
                hold_expires_at: es.hold_expires_at,
                row_label: vs.row_label,
                seat_number: vs.seat_number,
                category_id: vs.category_id,
                category_name: sc ? sc.name : '',
                category_price: ecp.price
              });
            }
          }
          return { rows };
        }

        if (norm.includes('from event_seats es') && norm.includes('for update of es')) {
          const seatIds = Array.isArray(params[0]) ? params[0] : [params[0]];
          const eventId = parseInt(params[1], 10);

          const rows = [];
          for (const sId of seatIds) {
            const es = self.eventSeats.find((s) => s.id === sId && s.event_id === eventId);
            if (es) {
              const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
              const sc = self.seatCategories.find((c) => c.id === vs.category_id);
              const ecp = self.eventCategoryPrices.find((p) => p.event_id === eventId && p.category_id === vs.category_id) || { price: 0 };
              rows.push({
                id: es.id,
                status: es.status,
                hold_user_id: es.hold_user_id,
                hold_expires_at: es.hold_expires_at,
                row_label: vs.row_label,
                seat_number: vs.seat_number,
                category_id: vs.category_id,
                category_name: sc ? sc.name : '',
                category_price: ecp.price
              });
            }
          }
          return { rows };
        }

        if (norm.startsWith('update event_seats') && norm.includes('set status = \'held\'')) {
          const userId = params[0];
          const holdToken = params[1];
          const expiresAt = params[2];
          const seatIds = Array.isArray(params[3]) ? params[3] : [params[3]];

          const updated = [];
          for (const sId of seatIds) {
            const es = self.eventSeats.find((s) => s.id === sId);
            if (es) {
              es.status = 'HELD';
              es.hold_user_id = userId;
              es.hold_token = holdToken;
              es.hold_expires_at = expiresAt;
              es.updated_at = new Date();
              updated.push({ id: es.id, event_id: es.event_id, status: es.status, hold_expires_at: es.hold_expires_at });
            }
          }
          return { rows: updated };
        }

        if (norm.startsWith('update event_seats') && norm.includes('set status = \'available\'')) {
          const seatIds = Array.isArray(params[0]) ? params[0] : [params[0]];
          for (const sId of seatIds) {
            const es = self.eventSeats.find((s) => s.id === sId);
            if (es) {
              es.status = 'AVAILABLE';
              es.hold_user_id = null;
              es.hold_token = null;
              es.hold_expires_at = null;
              es.updated_at = new Date();
            }
          }
          return { rows: [] };
        }

        if (norm.startsWith('update event_seats') && norm.includes('set status = \'booked\'')) {
          const seatIds = Array.isArray(params[0]) ? params[0] : [params[0]];
          for (const sId of seatIds) {
            const es = self.eventSeats.find((s) => s.id === sId);
            if (es) {
              es.status = 'BOOKED';
              es.hold_user_id = null;
              es.hold_token = null;
              es.hold_expires_at = null;
              es.updated_at = new Date();
            }
          }
          return { rows: [] };
        }

        if (norm.includes('from event_seats es') && norm.includes('where es.status = \'held\' and es.hold_expires_at < current_timestamp')) {
          const now = new Date();
          const expired = self.eventSeats.filter((es) => es.status === 'HELD' && es.hold_expires_at && new Date(es.hold_expires_at) < now);
          const rows = expired.map((es) => {
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            const sc = self.seatCategories.find((c) => c.id === vs.category_id);
            return {
              id: es.id,
              event_id: es.event_id,
              row_label: vs.row_label,
              seat_number: vs.seat_number,
              category_id: vs.category_id,
              category_name: sc ? sc.name : ''
            };
          });
          return { rows };
        }

        if (norm.startsWith('insert into bookings')) {
          const ref = params[0];
          const userId = params[1];
          const eventId = params[2];
          const totalAmount = params[3];
          const newBooking = {
            id: self.bookings.length + 1,
            booking_reference: ref,
            user_id: userId,
            event_id: eventId,
            total_amount: totalAmount,
            status: 'CONFIRMED',
            created_at: new Date()
          };
          self.bookings.push(newBooking);
          return { rows: [{ ...newBooking }] };
        }

        if (norm.startsWith('insert into booking_seats')) {
          const bId = params[0];
          const esId = params[1];
          const price = params[2];
          self.bookingSeats.push({
            id: self.bookingSeats.length + 1,
            booking_id: bId,
            event_seat_id: esId,
            price
          });
          return { rows: [] };
        }

        if (norm.includes('from bookings') && norm.includes('where id = $1') && norm.includes('for update')) {
          const b = self.bookings.find((item) => item.id === parseInt(params[0], 10));
          return { rows: b ? [{ ...b }] : [] };
        }

        if (norm.includes('from booking_seats bs') && norm.includes('where bs.booking_id = $1')) {
          const bId = parseInt(params[0], 10);
          const bSeats = self.bookingSeats.filter((b) => b.booking_id === bId);
          const rows = bSeats.map((bs) => {
            const es = self.eventSeats.find((s) => s.id === bs.event_seat_id);
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            const sc = self.seatCategories.find((c) => c.id === vs.category_id);
            return {
              booking_seat_id: bs.id,
              event_seat_id: bs.event_seat_id,
              seat_id: es.id,
              row_label: vs.row_label,
              seat_number: vs.seat_number,
              category_id: vs.category_id,
              category_name: sc ? sc.name : ''
            };
          });
          return { rows };
        }

        if (norm.startsWith('update bookings set status = \'cancelled\'')) {
          const b = self.bookings.find((item) => item.id === parseInt(params[0], 10));
          if (b) {
            b.status = 'CANCELLED';
            b.cancelled_at = new Date();
          }
          return { rows: [] };
        }

        if (norm.includes('from waitlist_entries we') && norm.includes('where we.event_id = $1 and we.category_id = $2 and we.status = \'waiting\'')) {
          const eventId = parseInt(params[0], 10);
          const catId = parseInt(params[1], 10);
          const entries = self.waitlistEntries.filter((we) => we.event_id === eventId && we.category_id === catId && we.status === 'WAITING');
          const rows = entries.map((we) => {
            const user = self.users.find((u) => u.id === we.user_id) || {};
            const event = self.events.find((e) => e.id === we.event_id) || {};
            const sc = self.seatCategories.find((c) => c.id === we.category_id) || {};
            return {
              id: we.id,
              event_id: we.event_id,
              user_id: we.user_id,
              category_id: we.category_id,
              quantity: we.quantity,
              user_name: user.name,
              user_email: user.email,
              event_title: event.title,
              category_name: sc.name
            };
          });
          return { rows };
        }

        if (norm.includes('from event_seats es') && norm.includes('where es.event_id = $1 and vs.category_id = $2 and es.status = \'available\'')) {
          const eventId = parseInt(params[0], 10);
          const catId = parseInt(params[1], 10);
          const limit = parseInt(params[2], 10);

          const avail = self.eventSeats.filter((es) => {
            if (es.event_id !== eventId || es.status !== 'AVAILABLE') return false;
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            return vs && vs.category_id === catId;
          }).slice(0, limit);

          const rows = avail.map((es) => {
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            return {
              id: es.id,
              row_label: vs.row_label,
              seat_number: vs.seat_number
            };
          });
          return { rows };
        }

        if (norm.startsWith('insert into waitlist_offers')) {
          const weId = parseInt(params[0], 10);
          const token = params[1];
          const expiresAt = params[2];
          const status = params[3] || 'ACTIVE';
          const offer = {
            id: self.waitlistOffers.length + 1,
            waitlist_entry_id: weId,
            token,
            expires_at: expiresAt,
            status,
            created_at: new Date()
          };
          self.waitlistOffers.push(offer);
          return { rows: [{ id: offer.id, token: offer.token, expires_at: offer.expires_at, status: offer.status }] };
        }

        if (norm.startsWith('insert into waitlist_offer_seats')) {
          const offerId = parseInt(params[0], 10);
          const esId = parseInt(params[1], 10);
          self.waitlistOfferSeats.push({
            id: self.waitlistOfferSeats.length + 1,
            offer_id: offerId,
            event_seat_id: esId
          });
          return { rows: [] };
        }

        if (norm.startsWith('update waitlist_entries set status = \'offered\' where id = $1')) {
          const we = self.waitlistEntries.find((e) => e.id === parseInt(params[0], 10));
          if (we) we.status = 'OFFERED';
          return { rows: [] };
        }

        if (norm.includes('from waitlist_offers wo') && norm.includes('where wo.token = $1') && norm.includes('for update of wo')) {
          const offer = self.waitlistOffers.find((o) => o.token === params[0]);
          if (!offer) return { rows: [] };
          const entry = self.waitlistEntries.find((e) => e.id === offer.waitlist_entry_id) || {};
          const user = self.users.find((u) => u.id === entry.user_id) || {};
          const event = self.events.find((e) => e.id === entry.event_id) || {};
          const venue = self.venues.find((v) => v.id === event.venue_id) || {};
          const cat = self.seatCategories.find((c) => c.id === entry.category_id) || {};
          const ecp = self.eventCategoryPrices.find((p) => p.event_id === event.id && p.category_id === cat.id) || { price: 0 };
          return {
            rows: [{
              id: offer.id,
              token: offer.token,
              expires_at: offer.expires_at,
              status: offer.status || 'ACTIVE',
              waitlist_entry_id: entry.id,
              user_id: user.id,
              user_name: user.name,
              user_email: user.email,
              event_id: event.id,
              event_title: event.title,
              event_date: event.event_date,
              start_time: event.start_time,
              venue_name: venue.name,
              category_id: cat.id,
              category_name: cat.name,
              unit_price: ecp.price
            }]
          };
        }

        if (norm.includes('from waitlist_offer_seats wos') && norm.includes('for update of es')) {
          const offerId = parseInt(params[0], 10);
          const wosList = self.waitlistOfferSeats.filter((w) => w.offer_id === offerId);
          const rows = wosList.map((w) => {
            const es = self.eventSeats.find((s) => s.id === w.event_seat_id);
            const vs = self.venueSeats.find((v) => v.id === es.venue_seat_id);
            return {
              id: es.id,
              status: es.status,
              row_label: vs.row_label,
              seat_number: vs.seat_number,
              category_id: vs.category_id
            };
          });
          return { rows };
        }

        if (norm.startsWith('update waitlist_offers set status = \'accepted\' where id = $1')) {
          const wo = self.waitlistOffers.find((o) => o.id === parseInt(params[0], 10));
          if (wo) wo.status = 'ACCEPTED';
          return { rows: [] };
        }

        if (norm.startsWith('update waitlist_entries set status = \'completed\' where id = $1')) {
          const we = self.waitlistEntries.find((e) => e.id === parseInt(params[0], 10));
          if (we) we.status = 'COMPLETED';
          return { rows: [] };
        }

        if (norm.includes('from waitlist_offers wo') && norm.includes('where wo.status = \'active\' and wo.expires_at < current_timestamp')) {
          const now = new Date();
          const expiredOffers = self.waitlistOffers.filter((o) => o.status === 'ACTIVE' && new Date(o.expires_at) < now);
          const rows = expiredOffers.map((o) => {
            const we = self.waitlistEntries.find((e) => e.id === o.waitlist_entry_id) || {};
            const seatIds = self.waitlistOfferSeats.filter((w) => w.offer_id === o.id).map((w) => w.event_seat_id);
            return {
              id: o.id,
              waitlist_entry_id: o.waitlist_entry_id,
              event_id: we.event_id,
              category_id: we.category_id,
              user_id: we.user_id,
              seat_ids: seatIds
            };
          });
          return { rows };
        }

        if (norm.startsWith('update waitlist_offers set status = \'expired\' where id = any($1)')) {
          const ids = Array.isArray(params[0]) ? params[0] : [params[0]];
          self.waitlistOffers.forEach((o) => {
            if (ids.includes(o.id)) o.status = 'EXPIRED';
          });
          return { rows: [] };
        }

        if (norm.startsWith('update waitlist_entries set status = \'expired\' where id = any($1)')) {
          const ids = Array.isArray(params[0]) ? params[0] : [params[0]];
          self.waitlistEntries.forEach((e) => {
            if (ids.includes(e.id)) e.status = 'EXPIRED';
          });
          return { rows: [] };
        }

        return self.query(text, params);
      },
      release() {}
    };
  }
}

const mockDbInstance = new MockDatabase();

module.exports = mockDbInstance;
