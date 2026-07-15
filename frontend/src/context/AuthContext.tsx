import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockUser } from '../mock/data';
import type { MockUser } from '../mock/data';

interface AuthContextType {
  isAuthenticated: boolean;
  user: MockUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'horizon_bank_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'active'
  );
  const [user, setUser] = useState<MockUser | null>(isAuthenticated ? mockUser : null);

  const login = (username: string, password: string) => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your username and password.' };
    }
    if (!(username === 'demo' && password === 'demo')) {
      return { success: false, error: 'Invalid username or password. Try demo / demo.' };
    }
    localStorage.setItem(STORAGE_KEY, 'active');
    setIsAuthenticated(true);
    setUser(mockUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
