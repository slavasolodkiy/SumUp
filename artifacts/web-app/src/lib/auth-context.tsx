import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const BASE = () => {
  const base = (import.meta as any).env.BASE_URL?.replace(/\/$/, "") || "";
  return `${base}/api`;
};

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE()}${path}`, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string>) } });

  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        const retryRes = await fetch(`${BASE()}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${data.access_token}` },
        });
        if (!retryRes.ok) throw new Error("Request failed");
        return retryRes.json();
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = `${(import.meta as any).env.BASE_URL?.replace(/\/$/, "") || ""}/login`;
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

interface Merchant {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  business_name?: string;
  business_category?: string;
  country?: string;
  status: string;
  onboarding_status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  merchant: Merchant | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  refetchMerchant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("access_token"));
  }, []);

  const fetchMerchant = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { setIsLoading(false); return; }
    try {
      const data = await apiFetch("/merchants/me");
      setMerchant(data);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setMerchant(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMerchant(); }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setMerchant(data.merchant);
  };

  const logout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAuthTokenGetter(null);
    setMerchant(null);
  };

  const register = async (formData: { email: string; password: string; first_name: string; last_name: string }) => {
    const data = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(formData) });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setAuthTokenGetter(() => localStorage.getItem("access_token"));
    setMerchant(data.merchant);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!merchant,
      isLoading,
      merchant,
      login,
      logout,
      register,
      refetchMerchant: fetchMerchant,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { apiFetch };
