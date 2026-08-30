import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getInitialUser = () => {
    try {
      const item = localStorage.getItem('user');
      if (!item || item === 'undefined' || item === 'null') return null;
      return JSON.parse(item);
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      return null;
    }
  };

  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    return storedToken && storedToken !== 'undefined' ? storedToken : null;
  });
  const [user, setUser] = useState(getInitialUser);

  const login = (data) => {
    const userToken = data.access || data.token;
    const userData = data.user || data;

    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(userToken);
    setUser(userData);
  };

  const updateUser = (updatedUserData) => {
    const combinedData = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(combinedData));
    setUser(combinedData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};