// src/context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { AuthState } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('admin_auth');
    return savedAuth ? JSON.parse(savedAuth) : { isAuthenticated: false, token: null, user: null };
  });

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { timeout: 15000 }
      );
      const { token, user } = res.data;

      if (!token || user?.role !== 'ADMIN') {
        return { success: false, error: 'Invalid admin credentials or role unauthorized.' };
      }

      const successfulAuth: AuthState = {
        isAuthenticated: true,
        token,
        user
      };

      setAuth(successfulAuth);
      localStorage.setItem('admin_auth', JSON.stringify(successfulAuth));
      localStorage.setItem('token', token);

      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);

      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Request timed out — your connection may be slow. Please try again.' };
      }
      if (!error.response) {
        return { success: false, error: 'Network error — please check your internet connection and try again.' };
      }
      if (error.response.status === 401 || error.response.status === 403) {
        return { success: false, error: 'Invalid admin credentials or role unauthorized.' };
      }

      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, token: null, user: null });
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};