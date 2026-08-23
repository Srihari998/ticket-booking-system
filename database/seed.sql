INSERT INTO users (id, name, email, password_hash, role) VALUES
(1, 'System Administrator', 'admin@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ADMIN'),
(2, 'Master Organiser', 'organiser@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'ORGANISER'),
(3, 'Jane Customer', 'customer@example.com', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO seat_categories (id, name, description) VALUES
(1, 'Premium (Balcony/VIP)', 'Prime center viewing with plush push-back seats and extra legroom'),
(2, 'Standard (First Class)', 'Comfortable auditorium seating with crystal clear sightlines')
ON CONFLICT (id) DO NOTHING;

INSERT INTO venues (id, name, location, created_by) VALUES
(1, 'Hollywood Bollywood Multiplex', 'Arundelpet Main Road, Guntur', 1),
(2, 'Cine Square 4K Dolby Atmos', 'Lakshmipuram 4th Line, Guntur', 1),
(3, 'Naz Deluxe Theatre 4K', 'Station Road, Guntur', 1),
(4, 'Saraswathi Picture Palace', 'Brodipet 6th Lane, Guntur', 1),
(5, 'Sri Krishna Complex', 'Kothapet, Guntur', 1),
(6, 'Venkateswara Theatre 70mm', 'Nallapadu Road, Guntur', 1),
(7, 'Brahmananda Reddy Stadium Arena', 'Kanna Vari Thota, Guntur', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, organiser_id, venue_id, title, description, event_type, event_date, start_time, status) VALUES
(1, 2, 2, 'Devara: Part 1 (Telugu)', 'High-octane coastal action drama starring Jr NTR, Janhvi Kapoor, and Saif Ali Khan. Directed by Koratala Siva with electrifying music by Anirudh.', 'MOVIE', CURRENT_DATE + INTERVAL '1 day', '18:30:00', 'PUBLISHED'),
(2, 2, 1, 'Pushpa 2: The Rule (Telugu)', 'Allu Arjun returns as Pushpa Raj in the grandest mass action sequel directed by Sukumar. Featuring Rashmika Mandanna and Fahadh Faasil.', 'MOVIE', CURRENT_DATE + INTERVAL '2 days', '19:00:00', 'PUBLISHED'),
(3, 2, 3, 'Kalki 2898 AD (Telugu)', 'Epic dystopian sci-fi mytho blockbuster starring Prabhas, Amitabh Bachchan, Kamal Haasan, and Deepika Padukone. Directed by Nag Ashwin.', 'MOVIE', CURRENT_DATE + INTERVAL '1 day', '21:15:00', 'PUBLISHED'),
(4, 2, 4, 'Game Changer (Telugu)', 'Intense political action thriller starring Mega Powerstar Ram Charan and Kiara Advani. Directed by visionary director Shankar.', 'MOVIE', CURRENT_DATE + INTERVAL '3 days', '14:30:00', 'PUBLISHED'),
(5, 2, 2, 'Deadpool & Wolverine (English 3D)', 'Marvel blockbuster team-up starring Ryan Reynolds and Hugh Jackman in crisp 4K Dolby Atmos 3D with unhinged action and multiverse chaos.', 'MOVIE', CURRENT_DATE + INTERVAL '1 day', '22:00:00', 'PUBLISHED'),
(6, 2, 1, 'Dune: Part Two (English IMAX)', 'Denis Villeneuve sci-fi masterpiece exploring Paul Atreides mythic journey with Chani and the Fremen across the deserts of Arrakis.', 'MOVIE', CURRENT_DATE + INTERVAL '2 days', '15:30:00', 'PUBLISHED'),
(7, 2, 6, 'Gladiator II (English)', 'Ridley Scott legendary arena return starring Paul Mescal, Pedro Pascal, and Denzel Washington in an epic saga of Roman empire revenge.', 'MOVIE', CURRENT_DATE + INTERVAL '3 days', '20:00:00', 'PUBLISHED'),
(8, 2, 1, 'Stree 2: Sarkate Ka Aatank (Hindi)', 'Record-breaking blockbuster horror comedy starring Shraddha Kapoor, Rajkummar Rao, Pankaj Tripathi, and Abhishek Banerjee.', 'MOVIE', CURRENT_DATE + INTERVAL '1 day', '16:00:00', 'PUBLISHED'),
(9, 2, 2, 'Singham Again (Hindi)', 'Rohit Shetty cop universe extravaganza starring Ajay Devgn, Kareena Kapoor Khan, Ranveer Singh, Akshay Kumar, Deepika Padukone, and Tiger Shroff.', 'MOVIE', CURRENT_DATE + INTERVAL '2 days', '18:00:00', 'PUBLISHED'),
(10, 2, 5, 'Saripodhaa Sanivaaram (Telugu)', 'Action thriller starring Nani as Surya battling against a ruthless corrupt inspector played by SJ Suryah. Directed by Vivek Athreya.', 'MOVIE', CURRENT_DATE + INTERVAL '1 day', '19:45:00', 'PUBLISHED'),
(11, 2, 7, 'Anirudh Ravichander "Hukum" Live Concert - Guntur Tour', 'The Rockstar Anirudh performs his biggest Telugu and Tamil chartbusters live with full orchestra, stage pyrotechnics, and laser lights.', 'CONCERT', CURRENT_DATE + INTERVAL '10 days', '18:00:00', 'PUBLISHED'),
(12, 2, 7, 'DSP Rockstar Mega Musical Night', 'Devi Sri Prasad live musical storm featuring energetic dancers, hit songs from Pushpa 2, and grand special guest appearances.', 'CONCERT', CURRENT_DATE + INTERVAL '15 days', '19:00:00', 'PUBLISHED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO event_category_prices (event_id, category_id, price) VALUES
(1, 1, 295.00), (1, 2, 175.00),
(2, 1, 295.00), (2, 2, 175.00),
(3, 1, 295.00), (3, 2, 175.00),
(4, 1, 295.00), (4, 2, 175.00),
(5, 1, 295.00), (5, 2, 175.00),
(6, 1, 295.00), (6, 2, 175.00),
(7, 1, 295.00), (7, 2, 175.00),
(8, 1, 295.00), (8, 2, 175.00),
(9, 1, 295.00), (9, 2, 175.00),
(10, 1, 295.00), (10, 2, 175.00),
(11, 1, 2500.00), (11, 2, 999.00),
(12, 1, 2500.00), (12, 2, 999.00)
ON CONFLICT (event_id, category_id) DO NOTHING;
