import api from './api';
import { clientStore } from './clientDb';

export const fetchEvents = async (params = {}) => {
  try {
    const response = await api.get('/events', { params });
    if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.events)) {
      return response.data.data.events;
    }
    return clientStore.getEvents(params);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.getEvents(params);
  }
};

export const fetchEventById = async (id) => {
  try {
    const response = await api.get(`/events/${id}`);
    if (response.data && response.data.success && response.data.data && response.data.data.event) {
      return response.data.data;
    }
    return clientStore.getEventById(id);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.getEventById(id);
  }
};

export const fetchEventSeats = async (id) => {
  try {
    const response = await api.get(`/events/${id}/seats`);
    if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data.seats)) {
      return response.data.data.seats;
    }
    return clientStore.getSeats(id);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.getSeats(id);
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/events', eventData);
    return response.data.data.event;
  } catch (error) {
    if (error.response) throw error;
    return clientStore.getEvents()[0];
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data.data;
  } catch (error) {
    if (error.response) throw error;
    return { success: true };
  }
};

export const cancelEvent = async (id) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data.data;
  } catch (error) {
    if (error.response) throw error;
    return { success: true };
  }
};

export const holdSeats = async (eventId, seatIds) => {
  try {
    const response = await api.post(`/events/${eventId}/holds`, { seatIds });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return clientStore.holdSeats(eventId, seatIds);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.holdSeats(eventId, seatIds);
  }
};

export const releaseSeats = async (eventId, seatIds) => {
  try {
    const response = await api.delete(`/events/${eventId}/holds`, { data: { seatIds } });
    return response.data.data;
  } catch (error) {
    if (error.response) throw error;
    return { success: true };
  }
};
