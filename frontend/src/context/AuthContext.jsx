import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ticket_app_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ticket_app_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const freshUser = await getCurrentUser();
          setUser(freshUser);
          localStorage.setItem('ticket_app_user', JSON.stringify(freshUser));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ticket_app_token', data.token);
    localStorage.setItem('ticket_app_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await registerUser(name, email, password, role);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ticket_app_token', data.token);
    localStorage.setItem('ticket_app_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ticket_app_token');
    localStorage.removeItem('ticket_app_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
