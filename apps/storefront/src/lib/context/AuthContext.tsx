import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, verifyAuth, logout as apiLogout, User } from "@lib/data/backend-api";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  customer: User | null;
  setCustomer: (customer: User | null) => void;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });
  const [customer, setCustomer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
    } else {
      localStorage.removeItem("auth_token");
    }
    setTokenState(newToken);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
    } finally {
      setToken(null);
      setCustomer(null);
    }
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) {
      setToken(null);
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user } = await verifyAuth(storedToken);
      if (user) {
        setCustomer(user);
        setToken(storedToken);
      } else {
        setToken(null);
        setCustomer(null);
      }
    } catch {
      setToken(null);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, customer, setCustomer, isLoading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}