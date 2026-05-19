import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  customer: any | null;
  setCustomer: (customer: any | null) => void;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });
  const [customer, setCustomer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_API_URL || 'http://localhost:3000/api'

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("auth_token", newToken);
    } else {
      localStorage.removeItem("auth_token");
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
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
      const res = await fetch(`${BACKEND_URL}/auth`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${storedToken}`,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.user);
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