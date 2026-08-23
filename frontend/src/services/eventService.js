import api from './api';

export const fetchEvents = async (params = {}) => {
  const response = await api.get('/events', { params });
  return response.data.data.events;
};

export const fetchEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data.data;
};

export const fetchEventSeats = async (id) => {
  const response = await api.get(`/events/${id}/seats`);
  return response.data.data.seats;
};

export const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data.data.event;
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
  const response = await api.post(`/events/${eventId}/holds`, { seatIds });
  return response.data.data;
};

export const releaseSeats = async (eventId, seatIds) => {
  const response = await api.delete(`/events/${eventId}/holds`, { data: { seatIds } });
  return response.data.data;
};
