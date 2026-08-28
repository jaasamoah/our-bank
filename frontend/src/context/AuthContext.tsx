import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { MockUser } from '../mock/data';
import { getCurrentUser, loginRequest } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: MockUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

function mapUser(apiUser: Awaited<ReturnType<typeof getCurrentUser>>): MockUser {
  const fullName = apiUser.full_name;
  return {
    id: String(apiUser.id),
    fullName,
    email: apiUser.email,
    username: apiUser.username,
    memberSince: new Date(apiUser.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    avatarInitials: fullName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    getCurrentUser()
      .then((apiUser) => setUser(mapUser(apiUser)))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const login = async (username: string, password: string) => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your username and password.' };
    }

    try {
      const result = await loginRequest(username, password);
      localStorage.setItem(TOKEN_KEY, result.access_token);
      setToken(result.access_token);
      const apiUser = await getCurrentUser();
      setUser(mapUser(apiUser));
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid username or password. Try demo / demo.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(token), user, login, logout }}>
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
