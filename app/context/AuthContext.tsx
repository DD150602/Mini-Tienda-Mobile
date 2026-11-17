import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

type User = { id: number; nombre_completo: string; correo: string };
type AuthValue = { user: User | null; loading: boolean; login: (correo: string, contrasena: string) => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<any>("/users/me").then((result) => setUser(result?.user ?? null)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);
  const login = useCallback(async (correo: string, contrasena: string) => {
    const result = await api<any>("/users/login", { method: "POST", body: JSON.stringify({ correo, contrasena }) });
    const loggedUser = result?.user ?? result?.data?.user;
    if (!loggedUser) throw new Error(result?.msg || "El servidor no devolvió los datos de sesión.");
    setUser(loggedUser);
  }, []);
  const logout = useCallback(async () => {
    try { await api("/users/logout", { method: "POST" }); } finally { setUser(null); }
  }, []);
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}
