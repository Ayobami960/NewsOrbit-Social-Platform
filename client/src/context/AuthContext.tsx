"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@/types";
import { apiFetch, authFetch, setStoredToken, clearStoredToken, getStoredToken } from "@/lib/apiFetch";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  isLoggedIn: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredToken()) { setLoading(false); return; }
    authFetch<{ user: User }>("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => clearStoredToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await apiFetch<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setStoredToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { name, email, password, confirmPassword },
    });
  };

  const logout = async () => {
    await authFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearStoredToken();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser, isLoggedIn: !!user }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
};
