import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const fullName = localStorage.getItem('user_name');
    return token ? { token, role, fullName } : null;
  });

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, role, full_name } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', full_name);

    setUser({ token: access_token, role, fullName: full_name });
    return role;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);