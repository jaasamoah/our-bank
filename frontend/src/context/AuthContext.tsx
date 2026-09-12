import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import type { MockUser } from '../mock/data';
import {
  getCurrentUser,
  loginRequest,
  logoutRequest,
  verifyLoginOtp,
  verifySecurityQuestions,
  type ApiSecurityQuestion,
} from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MockUser | null;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    stage?: 'security_questions' | 'otp';
    challengeToken?: string;
    questions?: ApiSecurityQuestion[];
    error?: string;
  }>;
  verifySecurityQuestions: (challengeToken: string, answers: Array<{ question_id: number; answer: string }>) => Promise<{ success: boolean; error?: string }>;
  verifyLoginOtp: (challengeToken: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((apiUser) => setUser(mapUser(apiUser)))
      .catch(() => {
        localStorage.removeItem('access_token');
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    if (email.trim().length === 0 || password.trim().length === 0) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    try {
      const result = await loginRequest(email, password);
      if (result.stage !== 'complete') {
        return {
          success: false,
          stage: result.stage,
          challengeToken: result.challenge_token,
          questions: result.questions,
          error: result.message,
        };
      }

      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        if (result.role === 'admin' || result.role === 'super_admin') {
          localStorage.setItem('admin_access_token', result.access_token);
        }
      }

      const apiUser = await getCurrentUser();
      setUser(mapUser(apiUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.response?.data?.detail ?? 'Invalid email or password.' : 'Invalid email or password.',
      };
    }
  };

  const completeLogin = async () => {
    const apiUser = await getCurrentUser();
    setUser(mapUser(apiUser));
    return { success: true as const };
  };

  const completeSecurityQuestions = async (challengeToken: string, answers: Array<{ question_id: number; answer: string }>) => {
    try {
      await verifySecurityQuestions(challengeToken, answers);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.response?.data?.detail ?? 'The security answers are incorrect.' : 'The security answers are incorrect.',
      };
    }
  };

  const completeOtp = async (challengeToken: string, otp: string) => {
    try {
      const result = await verifyLoginOtp(challengeToken, otp);

      // Store the token immediately so subsequent requests and redirects stay authenticated on iOS Safari
      if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
        if (result.role === 'admin' || result.role === 'super_admin') {
          localStorage.setItem('admin_access_token', result.access_token);
        }
      }

      return await completeLogin();
    } catch (error) {
      return {
        success: false,
        error: axios.isAxiosError(error) ? error.response?.data?.detail ?? 'The verification code is incorrect.' : 'The verification code is incorrect.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('admin_access_token');
    void logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: Boolean(user), isLoading, user, login, verifySecurityQuestions: completeSecurityQuestions, verifyLoginOtp: completeOtp, logout }}>
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