"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User, Role } from "@/types";
import { apiFetch, authFetch, setStoredToken, clearStoredToken, getStoredToken } from "@/lib/apiFetch";
import { useToast } from "@/components/ui/toast";

const ALLOWED_ROLES: Role[] = ["writer", "user"];

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
  const router = useRouter();
  const { error } = useToast();

  const handleDisallowedRole = (role: string) => {
    error("Access denied", `Your account role (${role}) is not permitted here.`);
    clearStoredToken();
    setUser(null);
    router.replace("/login");
  };

  useEffect(() => {
    if (!getStoredToken()) { setLoading(false); return; }
    authFetch<{ user: User }>("/auth/me")
      .then(({ data }) => {
        if (!ALLOWED_ROLES.includes(data.user.role)) {
          handleDisallowedRole(data.user.role);
          return;
        }
        setUser(data.user);
      })
      .catch(() => clearStoredToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await apiFetch<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    if (!ALLOWED_ROLES.includes(data.user.role)) {
      throw new Error(`Access denied. Your account role (${data.user.role}) is not permitted here.`);
    }

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