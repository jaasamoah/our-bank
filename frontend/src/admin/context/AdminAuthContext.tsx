import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AdminUser } from '../mock/adminData';
import { adminLoginRequest, getAdminUser, logoutRequest } from '../../services/api';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  admin: AdminUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminUser()
      .then((user) => setAdmin({
        id: String(user.id),
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        role: user.role === 'super_admin' ? 'superadmin' : 'admin',
        avatarInitials: user.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      }))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your credentials.' };
    }
    try {
      const result = await adminLoginRequest(username, password);
      if (result.access_token) {
        localStorage.setItem("admin_access_token", result.access_token);
      }
      if (!['admin', 'super_admin'].includes(result.role)) {
        return { success: false, error: 'This account does not have administrator access.' };
      }
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
    void logoutRequest();
    setAdmin(null);
  };

  return (
      <AdminAuthContext.Provider value={{ isAuthenticated: Boolean(admin), isLoading, admin, login, logout }}>
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
