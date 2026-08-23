import api from './api';

export const joinWaitlist = async (eventId, categoryId, quantity = 1) => {
  const response = await api.post(`/events/${eventId}/waitlist`, { categoryId, quantity });
  return response.data.data;
};

export const fetchUserWaitlists = async () => {
  const response = await api.get('/waitlist');
  return response.data.data.waitlists;
};

export const cancelWaitlistEntry = async (id) => {
  const response = await api.delete(`/waitlist/${id}`);
  return response.data.data;
};

export const fetchOfferByToken = async (token) => {
  const response = await api.get(`/waitlist-offers/${token}`);
  return response.data.data.offer;
};

export const acceptWaitlistOffer = async (token) => {
  const response = await api.post(`/waitlist-offers/${token}/accept`);
  return response.data.data;
};

export const fetchOrganiserEvents = async () => {
  const response = await api.get('/organiser/events');
  return response.data.data.events;
};

export const fetchOrganiserSummary = async (eventId) => {
  const response = await api.get(`/organiser/events/${eventId}/summary`);
  return response.data.data;
};
