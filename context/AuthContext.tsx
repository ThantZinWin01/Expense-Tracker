import { getOne, run } from "@/lib/db/database";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthUser = { id: number; username: string; email: string };

type AuthContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isBooting: boolean;
  setUser: (user: AuthUser | null) => void;
  register: (u: string, e: string, p: string) => Promise<AuthUser>;
  login: (u: string, p: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const SESSION_KEY = "session_user_id";
const AuthContext = createContext<AuthContextValue | null>(null);

const nowIso = () => new Date().toISOString();

// CASE-SENSITIVE 
function normalizeUsernameExact(username: string) {
  return username.trim();
}


function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedId = await SecureStore.getItemAsync(SESSION_KEY);
        if (savedId) {
          const row = getOne<AuthUser>(
            "SELECT id, username, email FROM users WHERE id = ?",
            [Number(savedId)]
          );
          if (row) setUser(row);
        }
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    const u = normalizeUsernameExact(username);
    const e = normalizeEmail(email);

    if (!u) throw new Error("Username is required.");
    if (!e) throw new Error("Email is required.");
    if (!password?.trim()) throw new Error("Password is required.");

    //  pre-check duplicates account
    const existsU = getOne<{ id: number }>(
      "SELECT id FROM users WHERE username = ? COLLATE BINARY",
      [u]
    );
    if (existsU) throw new Error("Username already exists.");

    const existsE = getOne<{ id: number }>("SELECT id FROM users WHERE email = ?", [e]);
    if (existsE) throw new Error("Email already exists.");

    const hash = await hashPassword(password);

    try {
      run(
        "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
        [u, e, hash, nowIso()]
      );
    } catch (err: any) {
      // fallback if UNIQUE constraint error happens
      const msg = String(err?.message ?? "");
      if (msg.toLowerCase().includes("users.username")) throw new Error("Username already exists.");
      if (msg.toLowerCase().includes("users.email")) throw new Error("Email already exists.");
      throw new Error("Failed to create account.");
    }

    const created = getOne<AuthUser>(
      "SELECT id, username, email FROM users WHERE username = ? COLLATE BINARY",
      [u]
    );
    if (!created) throw new Error("Failed to create account.");

    // ✅ IMPORTANT: Do NOT save session on register (so it won't auto-login)
    // await SecureStore.setItemAsync(SESSION_KEY, String(created.id));  <-- removed

    return created;
  };

  const login = async (username: string, password: string) => {
    const u = normalizeUsernameExact(username);

    if (!u) throw new Error("Username is required.");
    if (!password?.trim()) throw new Error("Password is required.");

    // ✅ EXACT match (case-sensitive)
    const row = getOne<AuthUser & { password_hash: string }>(
      "SELECT id, username, email, password_hash FROM users WHERE username = ? COLLATE BINARY",
      [u]
    );

    if (!row) throw new Error("User not found");

    const hash = await hashPassword(password);
    if (hash !== row.password_hash) throw new Error("Invalid password.");

    await SecureStore.setItemAsync(SESSION_KEY, String(row.id));
    return { id: row.id, username: row.username, email: row.email };
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isBooting,
        setUser,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
