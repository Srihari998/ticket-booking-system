import api from './api';
import { clientStore } from './clientDb';

export const createBooking = async (eventId, seatIds) => {
  try {
    const response = await api.post('/bookings', { eventId, seatIds });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return clientStore.createBooking(eventId, seatIds);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.createBooking(eventId, seatIds);
  }
};

export const fetchUserBookings = async () => {
  try {
    const response = await api.get('/bookings');
    if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.bookings)) {
      return response.data.data.bookings;
    }
    return clientStore.getBookings();
  } catch (error) {
    if (error.response) throw error;
    return clientStore.getBookings();
  }
};

export const fetchBookingById = async (id) => {
  try {
    const response = await api.get(`/bookings/${id}`);
    if (response.data && response.data.success && response.data.data && response.data.data.booking) {
      return response.data.data.booking;
    }
    const all = clientStore.getBookings();
    return all.find((b) => b.id === parseInt(id, 10)) || all[0];
  } catch (error) {
    if (error.response) throw error;
    const all = clientStore.getBookings();
    return all.find((b) => b.id === parseInt(id, 10)) || all[0];
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await api.post(`/bookings/${id}/cancel`);
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return clientStore.cancelBooking(id);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.cancelBooking(id);
  }
};
