"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "USER" | "ADMIN" | null;

type AuthContextType = {
  token: string | null;
  role: Role;
  login: (tok: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);

  // charger depuis localStorage
  useEffect(() => {
    const t = localStorage.getItem("ofrero:token");
    const r = localStorage.getItem("ofrero:role") as Role | null;
    if (t) setToken(t);
    if (r) setRole(r);
  }, []);

  const login = (tok: string) => {
    // décoder le payload (sans vérifier la signature côté client)
    try {
      const payload = JSON.parse(atob(tok.split(".")[1] || ""));
      const r = (payload?.role as Role) || null;
      setToken(tok);
      setRole(r);
      localStorage.setItem("ofrero:token", tok);
      localStorage.setItem("ofrero:role", r || "");
    } catch {
      // fallback minimal si le décodage échoue
      setToken(tok);
      setRole(null);
      localStorage.setItem("ofrero:token", tok);
      localStorage.removeItem("ofrero:role");
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem("ofrero:token");
    localStorage.removeItem("ofrero:role");
  };

  const value = useMemo(() => ({ token, role, login, logout }), [token, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}