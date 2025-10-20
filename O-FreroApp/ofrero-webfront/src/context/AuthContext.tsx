"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthState = {
  token: string | null;
  role: "ADMIN" | "USER" | null;
  login: (token: string, role?: "ADMIN" | "USER" | null) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState>({
  token: null, role: null, login: () => {}, logout: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole]   = useState<"ADMIN" | "USER" | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("ofrero_token");
    const r = localStorage.getItem("ofrero_role") as "ADMIN" | "USER" | null;
    if (t) setToken(t);
    if (r) setRole(r);
  }, []);

  const login = (t: string, r: "ADMIN" | "USER" | null = null) => {
    setToken(t); setRole(r);
    localStorage.setItem("ofrero_token", t);
    if (r) localStorage.setItem("ofrero_role", r);
  };

  const logout = () => {
    setToken(null); setRole(null);
    localStorage.removeItem("ofrero_token");
    localStorage.removeItem("ofrero_role");
  };

  return <AuthCtx.Provider value={{ token, role, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);