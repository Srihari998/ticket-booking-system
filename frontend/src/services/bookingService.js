import api from './api';

export const createBooking = async (eventId, seatIds) => {
  const response = await api.post('/bookings', { eventId, seatIds });
  return response.data.data;
};

export const fetchUserBookings = async () => {
  const response = await api.get('/bookings');
  return response.data.data.bookings;
};

export const fetchBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data.data.booking;
};

export const cancelBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/cancel`);
  return response.data.data;
};
