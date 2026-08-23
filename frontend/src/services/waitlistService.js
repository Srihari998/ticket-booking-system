import api from './api';
import { clientStore } from './clientDb';

export const joinWaitlist = async (eventId, categoryId, quantity = 1) => {
  try {
    const response = await api.post(`/events/${eventId}/waitlist`, { categoryId, quantity });
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.joinWaitlist(eventId, categoryId, quantity);
    }
    throw error;
  }
};

export const fetchUserWaitlists = async () => {
  try {
    const response = await api.get('/waitlist');
    return response.data.data.waitlists;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.getWaitlists();
    }
    return clientStore.getWaitlists();
  }
};

export const cancelWaitlistEntry = async (id) => {
  try {
    const response = await api.delete(`/waitlist/${id}`);
    return response.data.data;
  } catch (error) {
    return clientStore.cancelWaitlist(id);
  }
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
  try {
    const response = await api.get('/organiser/events');
    return response.data.data.events;
  } catch {
    return clientStore.getEvents();
  }
};

export const fetchOrganiserSummary = async (eventId) => {
  try {
    const response = await api.get(`/organiser/events/${eventId}/summary`);
    return response.data.data;
  } catch {
    const evt = clientStore.getEventById(eventId);
    return {
      event: evt.event,
      total_revenue: 12850,
      total_bookings: 14,
      total_seats_sold: 18,
      occupancy_percentage: 60,
      waitlist_count: 2
    };
  }
};
