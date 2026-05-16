import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

interface AuthState {
  authed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await api.login(email, password);
    api.setToken(token);
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    setAuthed(false);
  }, []);

  const value = useMemo(
    () => ({ authed, login, logout }),
    [authed, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
