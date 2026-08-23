import api from './api';
import { clientStore } from './clientDb';

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return clientStore.login(email, password);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.login(email, password);
  }
};

export const registerUser = async (name, email, password, role = 'CUSTOMER') => {
  try {
    const response = await api.post('/auth/register', { name, email, password, role });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    return clientStore.register(name, email, password, role);
  } catch (error) {
    if (error.response) throw error;
    return clientStore.register(name, email, password, role);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    if (response.data && response.data.data && response.data.data.user) {
      return response.data.data.user;
    }
    const u = localStorage.getItem('ticket_app_user');
    return u ? JSON.parse(u) : null;
  } catch {
    const u = localStorage.getItem('ticket_app_user');
    return u ? JSON.parse(u) : null;
  }
};
