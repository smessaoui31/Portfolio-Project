"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Role = "USER" | "ADMIN";
type AuthContextType = {
  token: string | null;
  role: Role | null;
  email: string | null;

  login: (token: string, role: Role, email: string) => void;
  loginFromApi: (data: any) => void;
  logout: () => void;
  authHeaders: () => HeadersInit;

  /** IMPORTANT : indique que la lecture du localStorage est finie */
  ready: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  email: null,
  login: () => {},
  loginFromApi: () => {},
  logout: () => {},
  authHeaders: () => ({}),
  ready: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        setToken(parsed.token ?? null);
        setRole(parsed.role ?? null);
        setEmail(parsed.email ?? null);
      }
    } catch {}
    setReady(true); // <- on ne redirige qu’après ça
  }, []);

  const login = (newToken: string, newRole: Role, newEmail: string) => {
    setToken(newToken);
    setRole(newRole);
    setEmail(newEmail);
    localStorage.setItem("auth", JSON.stringify({ token: newToken, role: newRole, email: newEmail }));
  };

  const loginFromApi = (data: any) => {
    const newToken: string | null = data?.accessToken ?? data?.token ?? null;
    const deducedRole: Role = (data?.user?.role ?? data?.role ?? "USER") as Role;
    const deducedEmail: string | null = data?.user?.email ?? data?.email ?? null;

    if (!newToken) throw new Error("Réponse de login invalide : accessToken manquant");

    setToken(newToken);
    setRole(deducedRole);
    setEmail(deducedEmail);
    localStorage.setItem("auth", JSON.stringify({ token: newToken, role: deducedRole, email: deducedEmail }));
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem("auth");
  };

  const authHeaders = (): HeadersInit => (token ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider value={{ token, role, email, login, loginFromApi, logout, authHeaders, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}