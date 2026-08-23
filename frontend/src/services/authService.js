import api from './api';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const registerUser = async (name, email, password, role = 'CUSTOMER') => {
  const response = await api.post('/auth/register', { name, email, password, role });
  return response.data.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
