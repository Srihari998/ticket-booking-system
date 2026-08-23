import api from './api';

export const fetchVenues = async () => {
  const response = await api.get('/venues');
  return response.data.data.venues;
};

export const fetchVenueById = async (id) => {
  const response = await api.get(`/venues/${id}`);
  return response.data.data;
};

export const fetchSeatCategories = async () => {
  const response = await api.get('/venues/categories');
  return response.data.data.categories;
};

export const createVenue = async (venueData) => {
  const response = await api.post('/venues', venueData);
  return response.data.data.venue;
};

export const updateVenue = async (id, venueData) => {
  const response = await api.put(`/venues/${id}`, venueData);
  return response.data.data.venue;
};

export const deleteVenue = async (id) => {
  const response = await api.delete(`/venues/${id}`);
  return response.data.data;
};

export const createVenueSeats = async (venueId, seats) => {
  const response = await api.post(`/venues/${venueId}/seats`, { seats });
  return response.data.data.seats;
};
