import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // On mount, attempt to hydrate the session from the httpOnly cookie /
    // stored token. If neither is valid, the user simply lands on Login.
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { user: u, token } = await authService.login(email, password);
    localStorage.setItem('interviewai_token', token);
    setUser(u);
  };

  const signup = async (name: string, email: string, password: string) => {
    const { user: u, token } = await authService.signup(name, email, password);
    localStorage.setItem('interviewai_token', token);
    setUser(u);
  };

  const logout = async () => {
    await authService.logout().catch(() => {});
    localStorage.removeItem('interviewai_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
