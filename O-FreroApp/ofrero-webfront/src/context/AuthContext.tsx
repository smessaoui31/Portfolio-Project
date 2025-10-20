"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Role = "USER" | "ADMIN";
type PublicUser = {
  id?: string | null;
  email: string | null;
  fullName?: string | null;
  role: Role | null;
};

type AuthContextType = {
  token: string | null;
  role: Role | null;
  email: string | null;

  /** Ancienne API (compat) : tu peux toujours appeler login(token, role, email) */
  login: (token: string, role: Role, email: string) => void;

  /** Nouvelle API pratique : passe-lui directement la réponse JSON d'/auth/login */
  loginFromApi: (data: any) => void;

  logout: () => void;

  /** Optionnel : headers prêts à l’emploi pour fetch */
  authHeaders: () => HeadersInit;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  email: null,
  login: () => {},
  loginFromApi: () => {},
  logout: () => {},
  authHeaders: () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        setToken(parsed.token ?? null);
        setRole(parsed.role ?? null);
        setEmail(parsed.email ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Ancienne signature (compatible avec ton code actuel)
  const login = (newToken: string, newRole: Role, newEmail: string) => {
    setToken(newToken);
    setRole(newRole);
    setEmail(newEmail);
    localStorage.setItem("auth", JSON.stringify({ token: newToken, role: newRole, email: newEmail }));
  };

  // Nouvelle méthode : accepter n'importe quelle forme de réponse backend
  // Exemples supportés:
  // { accessToken, user: { email, role, ... } }
  // { accessToken, role, email }
  // { token, user? ... }
  const loginFromApi = (data: any) => {
    const newToken: string | null =
      data?.accessToken ?? data?.token ?? null;

    const deducedRole: Role =
      (data?.user?.role ?? data?.role ?? "USER") as Role;

    const deducedEmail: string | null =
      data?.user?.email ?? data?.email ?? null;

    if (!newToken) {
      throw new Error("Réponse de login invalide : accessToken manquant");
    }

    setToken(newToken);
    setRole(deducedRole);
    setEmail(deducedEmail);

    localStorage.setItem(
      "auth",
      JSON.stringify({ token: newToken, role: deducedRole, email: deducedEmail })
    );
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem("auth");
  };

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ token, role, email, login, loginFromApi, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}