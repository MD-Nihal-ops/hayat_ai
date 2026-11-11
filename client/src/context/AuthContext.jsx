import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

function readStoredAuth() {
  return {
    token: window.localStorage.getItem("hayat-token")
  };
}

function tokenHasDemoClaim(token) {
  if (!token) return false;
  try {
    const encodedPayload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = encodedPayload.padEnd(encodedPayload.length + ((4 - encodedPayload.length % 4) % 4), "=");
    return JSON.parse(window.atob(payload)).demo === true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const saveAuth = useCallback(({ token }) => {
    window.localStorage.setItem("hayat-token", token);
    window.localStorage.removeItem("hayat-user-id");
    setAuth({ token });
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("hayat-token");
    window.localStorage.removeItem("hayat-user-id");
    setAuth({ token: null });
  }, []);

  useLayoutEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common.Authorization = ["Bearer", auth.token].join(" ");
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const requestUrl = error.config?.url || "";
        const isAuthRequest = requestUrl.startsWith("/api/auth/");
        if (error.response?.status === 401 && !isAuthRequest) {
          window.localStorage.removeItem("hayat-token");
          window.localStorage.removeItem("hayat-user-id");
          setAuth({ token: null });
          if (window.location.pathname !== "/login") {
            const returnToLink = window.location.pathname === "/link" ? "?returnTo=%2Flink" : "";
            window.location.assign(`/login${returnToLink}`);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [auth.token]);

  const value = useMemo(() => ({
    token: auth.token,
    isAuthenticated: Boolean(auth.token),
    isDemoSession: tokenHasDemoClaim(auth.token),
    saveAuth,
    logout
  }), [auth, saveAuth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
