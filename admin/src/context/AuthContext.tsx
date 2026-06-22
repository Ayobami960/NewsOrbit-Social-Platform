import {
  createContext, useContext, useState, useEffect,
  type ReactNode,
} from "react";
import type { User, Role } from "../types";
import {
  authFetch, setStoredToken, clearStoredToken,
  getStoredToken, apiFetch,
} from "../lib/apiFetch";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isRole: (...roles: Role[]) => boolean;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_ROLES: Role[] = ["super_admin", "manager", "admin", "writer"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }

    authFetch<{ user: User }>("/auth/me")
      .then(({ data }) => {
        if (!ADMIN_ROLES.includes(data.user.role)) {
          clearStoredToken();
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

    if (!ADMIN_ROLES.includes(data.user.role)) {
      throw new Error("Access denied. This portal is for admin accounts only.");
    }

    setStoredToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    await authFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearStoredToken();
    setUser(null);
  };

  const isRole = (...roles: Role[]): boolean =>
    user !== null && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isLoggedIn: !!user, isRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}