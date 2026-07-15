import React, { createContext, useContext, useState, ReactNode } from 'react';
import { adminUser } from '../mock/adminData';
import type { AdminUser } from '../mock/adminData';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'horizon_admin_session';

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'active'
  );
  const [admin, setAdmin] = useState<AdminUser | null>(isAuthenticated ? adminUser : null);

  const login = (username: string, password: string) => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your credentials.' };
    }
    if (!(username === 'admin' && password === 'admin')) {
      return { success: false, error: 'Invalid credentials. Try admin / admin.' };
    }
    localStorage.setItem(STORAGE_KEY, 'active');
    setIsAuthenticated(true);
    setAdmin(adminUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
