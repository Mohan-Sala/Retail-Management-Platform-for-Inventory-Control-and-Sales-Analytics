import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "@/lib/api";

export type Role = "admin" | "vendor";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessName?: string;
  phone?: string;
  avatar?: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: Role) => Promise<AuthUser>;
  register: (data: Omit<AuthUser, "id" | "avatar"> & { password: string }) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
};

const AuthCtx = createContext<AuthState | null>(null);
const STORAGE_USER_KEY = "shopsense.auth.user";
const STORAGE_TOKEN_KEY = "shopsense.auth.token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        const storedUser = localStorage.getItem(STORAGE_USER_KEY);
        
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
          
          // Verify JWT against backend and sync profile
          const res: any = await api.get("/auth/me");
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.data));
          }
        }
      } catch (error) {
        console.error("Token verification failed, logging out:", error);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login: AuthState["login"] = async (email, password, role) => {
    const res: any = await api.post("/auth/login", { email, password });
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to login");
    }

    const { user: u, token } = res.data;
    if (u.role !== role) {
      throw new Error(`Account role is not ${role}`);
    }

    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register: AuthState["register"] = async (data) => {
    const res: any = await api.post("/auth/register", data);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Failed to register");
    }

    const { user: u, token } = res.data;
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...patch };
    setUser(updated);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
  };

  // Prevent flash of loading/routes during initial render check
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem(STORAGE_TOKEN_KEY);
  if (loading && hasToken) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading ShopSense...
      </div>
    );
  }

  return (
    <AuthCtx.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
