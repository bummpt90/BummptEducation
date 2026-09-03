/**
 * BummptEducation — Production React Authentication Context
 * 
 * Provides global client-side identity state, login, logout, session restoration,
 * permission checks, and synchronization with legacy security wings.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SafeUser, Permission, AuthRole } from '../auth/types';
import { unlockAllWings, updateSecuritySessionStaff, clearSecuritySession } from '../utils/securityContext';

interface AuthContextType {
  currentUser: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (...roles: AuthRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize legacy security context for backwards compatibility with existing UI wings
  const syncWithLegacyWings = (user: SafeUser | null) => {
    if (!user) {
      clearSecuritySession();
      return;
    }

    // Map role to wing
    let wing: any = 'academic';
    if (user.role === 'super_admin') wing = 'all';
    else if (user.role === 'state_officer') wing = 'benue_moe';
    else if (user.role === 'bursar') wing = 'bursary';
    else if (user.role === 'admissions_officer') wing = 'admin';

    // Unlock corresponding wings
    unlockAllWings();
    updateSecuritySessionStaff({
      name: user.fullName,
      role: user.role,
      staffId: user.id.slice(0, 8).toUpperCase(),
      wing,
      passkeyUsed: 'PRODUCTION_AUTH',
    });
  };

  // Restore authenticated session from server on initial mount
  const refreshUser = async () => {
    try {
      // In-memory or cookie token
      const storedToken = sessionStorage.getItem('bummpt_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/v1/auth/me', {
        headers,
        credentials: 'include', // Sends HTTP-only cookie
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          syncWithLegacyWings(data.user);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session verification check:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Login failed. Please check your credentials.',
        };
      }

      // Store in sessionStorage as fallback token for iframe preview
      if (data.token) {
        sessionStorage.setItem('bummpt_token', data.token);
      }

      setCurrentUser(data.user);
      syncWithLegacyWings(data.user);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'A network error occurred while connecting to the authentication server.',
      };
    }
  };

  const logout = async () => {
    try {
      const storedToken = sessionStorage.getItem('bummpt_token');
      const headers: Record<string, string> = {};
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (err) {
      console.warn('[AuthContext] Logout warning:', err);
    } finally {
      sessionStorage.removeItem('bummpt_token');
      setCurrentUser(null);
      clearSecuritySession();
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.isSuperAdmin) return true;
    return currentUser.permissions.includes(permission);
  };

  const hasRole = (...roles: AuthRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return roles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
