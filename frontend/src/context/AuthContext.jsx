import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if we already have a session in localStorage.
  // This is what keeps the user logged in after a page refresh.
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedToken = authService.getStoredToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      // Fallback: refresh from /api/auth/me in the background in case the
      // cached user object (from login/signup) is missing fields — e.g. if
      // that response shape ever gets trimmed down without email included.
      // Silently ignored on failure; the cached user still works fine either way.
      authService.getMe().then(setUser).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  };

  const signup = async (details) => {
    const data = await authService.signup(details);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook so components do: const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}