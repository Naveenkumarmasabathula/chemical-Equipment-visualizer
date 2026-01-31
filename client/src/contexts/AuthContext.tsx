import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { AUTH_STORAGE_KEY } from "@/lib/authConstants";

type AuthContextType = {
  credentials: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | Record<string, never>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentialsState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setCredentials = useCallback((value: string | null) => {
    setCredentialsState(value);
    try {
      if (value) sessionStorage.setItem(AUTH_STORAGE_KEY, value);
      else sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  }, []);

  const login = useCallback((username: string, password: string) => {
    const encoded = btoa(`${username}:${password}`);
    setCredentials(encoded);
  }, [setCredentials]);

  const logout = useCallback(() => {
    setCredentials(null);
  }, [setCredentials]);

  const getAuthHeader = useCallback((): { Authorization: string } | Record<string, never> => {
    if (!credentials) return {};
    return { Authorization: `Basic ${credentials}` };
  }, [credentials]);

  const value = useMemo(
    () => ({
      credentials,
      isAuthenticated: !!credentials,
      login,
      logout,
      getAuthHeader,
    }),
    [credentials, login, logout, getAuthHeader]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
