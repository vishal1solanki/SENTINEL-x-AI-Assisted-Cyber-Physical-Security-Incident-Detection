import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: 'ADMIN' | 'SOC_ANALYST' | 'VIEWER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('sentinel_token'),
    user: null,
    isAuthenticated: !!localStorage.getItem('sentinel_token'),
  });

  useEffect(() => {
    api.getMe()
      .then((user) => {
        setState((prev) => ({ ...prev, user, isAuthenticated: true }));
      })
      .catch(() => {
        login('analyst@sentinel.local', 'Analyst@SentinelX2026!').catch(() => {});
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('sentinel_token', res.access_token);
    const userProfile = await api.getMe();
    setState({
      token: res.access_token,
      user: userProfile,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  };

  const switchDemoRole = async (role: 'ADMIN' | 'SOC_ANALYST' | 'VIEWER') => {
    const emailMap = {
      ADMIN: 'admin@sentinel.local',
      SOC_ANALYST: 'analyst@sentinel.local',
      VIEWER: 'viewer@sentinel.local',
    };
    const passMap = {
      ADMIN: 'Admin@SentinelX2026!',
      SOC_ANALYST: 'Analyst@SentinelX2026!',
      VIEWER: 'Viewer@SentinelX2026!',
    };
    await login(emailMap[role], passMap[role]);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
