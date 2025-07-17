import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function normalizeUser(user) {
    return {
      ...user,
      role_id: typeof user.role_id === "string" ? Number(user.role_id) : user.role_id,
    };
  }

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
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
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    await fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    });

    setCurrentUser(null);
  }

  function hasRole(...roleIds) {
    if (!currentUser) return false;
    const currentRole = Number(currentUser.role_id);
    return roleIds.includes(currentRole);
  }

  function isContentManager() {
    return hasRole(3);
  }

  function isAdmin() {
    return Number(currentUser?.role_id) === 4;
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
        isAdmin,
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
