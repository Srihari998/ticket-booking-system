import api from './api';
import { clientStore } from './clientDb';

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.login(email, password);
    }
    throw error;
  }
};

export const registerUser = async (name, email, password, role = 'CUSTOMER') => {
  try {
    const response = await api.post('/auth/register', { name, email, password, role });
    return response.data.data;
  } catch (error) {
    if (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK') {
      return clientStore.register(name, email, password, role);
    }
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  } catch {
    const u = localStorage.getItem('ticket_app_user');
    return u ? JSON.parse(u) : null;
  }
};
