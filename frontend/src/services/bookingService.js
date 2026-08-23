import api from './api';
import { clientStore } from './clientDb';

export const createBooking = async (eventId, seatIds) => {
  try {
    const response = await api.post('/bookings', { eventId, seatIds });
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.createBooking(eventId, seatIds);
    }
    throw error;
  }
};

export const fetchUserBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data.data.bookings;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.getBookings();
    }
    return clientStore.getBookings();
  }
};

export const fetchBookingById = async (id) => {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data.booking;
  } catch (error) {
    const all = clientStore.getBookings();
    return all.find((b) => b.id === parseInt(id, 10)) || all[0];
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data.data;
  } catch (error) {
    return clientStore.cancelBooking(id);
  }
};
