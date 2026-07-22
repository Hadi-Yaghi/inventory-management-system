import React, { useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore the documented local JWT state after a page refresh.
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedActiveStore = localStorage.getItem('activeStore');
    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    if (storedActiveStore) {
      try {
        setActiveStore(JSON.parse(storedActiveStore));
      } catch {
        localStorage.removeItem('activeStore');
      }
    }
    
    // Listen for unauthorized events to log out
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    
    setLoading(false);
  
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { accessToken, refreshToken, role, assignedStores, defaultStore, organization } = response.data;
    
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const userData = { username: response.data.username, role, assignedStores, defaultStore, organization };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    const initialActive = defaultStore || (assignedStores && assignedStores.length > 0 ? assignedStores[0] : null);
    if (initialActive) {
      localStorage.setItem('activeStore', JSON.stringify(initialActive));
      setActiveStore(initialActive);
    } else {
      localStorage.removeItem('activeStore');
      setActiveStore(null);
    }
  };

  const loginWithGoogle = async (idToken) => {
    const response = await api.post('/auth/google', { idToken });
    const { accessToken, refreshToken, role, assignedStores, defaultStore, organization } = response.data;
    
    setAccessToken(accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    const userData = { username: response.data.username, role, assignedStores, defaultStore, organization };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    const initialActive = defaultStore || (assignedStores && assignedStores.length > 0 ? assignedStores[0] : null);
    if (initialActive) {
      localStorage.setItem('activeStore', JSON.stringify(initialActive));
      setActiveStore(initialActive);
    } else {
      localStorage.removeItem('activeStore');
      setActiveStore(null);
    }
  };

  const changeActiveStore = (store) => {
    setActiveStore(store);
    if (store) {
      localStorage.setItem('activeStore', JSON.stringify(store));
    } else {
      localStorage.removeItem('activeStore');
    }
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('activeStore');
    setUser(null);
    setActiveStore(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading, activeStore, changeActiveStore }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
