import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);

  // Centralized logout function
  const performLogout = () => {
    console.log("Session expired - logging out");
    setCurrentUser(null);
    setCsrfToken(null);
    window.location.href = '/login';
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = await getHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      credentials: "include",
    });

    // Auto-logout on authentication failure
    if (response.status === 401 || response.status === 403) {
      performLogout();
      throw new Error("Session expired");
    }

    return response;
  };

  // Periodic session validation
  useEffect(() => {
    if (!currentUser) return;

    const validateSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          credentials: "include",
        });
        
        if (!res.ok) {
          performLogout();
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        performLogout();
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Fetch CSRF token
  const fetchCsrfToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    return null;
  };

  // Get headers with CSRF token
  const getHeaders = async () => {
    let token = csrfToken;
    if (!token) {
      token = await fetchCsrfToken();
    }
    return {
      "Content-Type": "application/json",
      ...(token && { "X-CSRF-Token": token }),
    };
  };

  function normalizeUser(user) {
    if (!user) return null;
    return {
      ...user,
      role_id: user.role_id ? Number(user.role_id) : null,
      role_name: user.role_name || null,
    };
  }

  useEffect(() => {
    async function fetchMe() {
      try {
        await fetchCsrfToken();
        
        const res = await fetch(`${API_BASE_URL}/api/me`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Unauthenticated");

        const user = await res.json();
        setCurrentUser(normalizeUser(user));
        console.log("Auto-login user fetched:", user);
      } catch (err) {
        console.log("No active session or invalid token");
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  async function handleLogin(credentials) {
    console.log("Logging in with credentials:", credentials);
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Login failed:", errorData);
      throw new Error(errorData.message || "Login failed");
    }

    const data = await res.json();
    const { user } = data;

    setCurrentUser(normalizeUser(user));
  }

  async function handleRegister(credentials) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Registration failed:", errorData);

      const firstErrorMsg =
        errorData.errors && errorData.errors.length > 0
          ? errorData.errors[0].msg
          : "Registration failed";

      throw new Error(firstErrorMsg);
    }

    const data = await res.json();
    const { user } = data;

    setCurrentUser(normalizeUser(user));
  }

  async function handleLogout() {
    console.log("Logging out...");
    const headers = await getHeaders();
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    performLogout();
    window.location.reload();
  }

  function hasRole(...roleNames) {
    if (!currentUser) return false;
    const currentRole = currentUser.role_name;
    return roleNames.includes(currentRole);
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        handleLogin,
        handleRegister,
        handleLogout,
        hasRole,
        fetchCsrfToken, 
        getHeaders,
        makeAuthenticatedRequest 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}