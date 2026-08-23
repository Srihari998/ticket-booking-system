import api from './api';
import { clientStore } from './clientDb';

export const fetchEvents = async (params = {}) => {
  try {
    const response = await api.get('/events', { params });
    return response.data.data.events;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.getEvents(params);
    }
    return clientStore.getEvents(params);
  }
};

export const fetchEventById = async (id) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.getEventById(id);
    }
    return clientStore.getEventById(id);
  }
};

export const fetchEventSeats = async (id) => {
  try {
    const response = await api.get(`/events/${id}/seats`);
    return response.data.data.seats;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.getSeats(id);
    }
    return clientStore.getSeats(id);
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data.data.event;
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (id, eventData) => {
  const response = await api.put(`/events/${id}`, eventData);
  return response.data.data;
};

export const cancelEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data.data;
};

export const holdSeats = async (eventId, seatIds) => {
  try {
    const response = await api.post(`/events/${eventId}/holds`, { seatIds });
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.holdSeats(eventId, seatIds);
    }
    throw error;
  }
};

export const releaseSeats = async (eventId, seatIds) => {
  try {
    const response = await api.delete(`/events/${eventId}/holds`, { data: { seatIds } });
    return response.data.data;
  } catch {
    return { success: true };
  }
};
