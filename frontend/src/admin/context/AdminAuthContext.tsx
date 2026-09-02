import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AdminUser } from '../mock/adminData';
import { adminLoginRequest, getAdminUser } from '../../services/api';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'admin_token';

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!token) return;
    getAdminUser()
      .then((user) => setAdmin({
        id: String(user.id),
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        role: user.role === 'super_admin' ? 'superadmin' : 'admin',
        avatarInitials: user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      }))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setAdmin(null);
      });
  }, [token]);

  const login = async (username: string, password: string) => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your credentials.' };
    }
    try {
      const result = await adminLoginRequest(username, password);
      if (!['admin', 'super_admin'].includes(result.role)) {
        return { success: false, error: 'This account does not have administrator access.' };
      }
      localStorage.setItem(STORAGE_KEY, result.access_token);
      setToken(result.access_token);
      const user = await getAdminUser();
      setAdmin({
        id: String(user.id),
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        role: user.role === 'super_admin' ? 'superadmin' : 'admin',
        avatarInitials: user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid administrator credentials.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setAdmin(null);
  };

  return (
      <AdminAuthContext.Provider value={{ isAuthenticated: Boolean(token), admin, login, logout }}>
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
