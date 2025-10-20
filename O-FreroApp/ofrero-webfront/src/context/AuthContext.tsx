"use client";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  token: string | null;
  role: "USER" | "ADMIN" | null;
  email: string | null;
  login: (token: string, role: "USER" | "ADMIN", email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  email: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      setToken(parsed.token);
      setRole(parsed.role);
      setEmail(parsed.email);
    }
  }, []);

  const login = (newToken: string, newRole: "USER" | "ADMIN", newEmail: string) => {
    setToken(newToken);
    setRole(newRole);
    setEmail(newEmail);
    localStorage.setItem("auth", JSON.stringify({ token: newToken, role: newRole, email: newEmail }));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ token, role, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}