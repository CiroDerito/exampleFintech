"use client";

import { redirect } from "next/dist/server/api-utils";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id: string; // ← aseguramos el id
  [k: string]: any;
};

interface AppState {
  user: User | null;
  userId: string | null;
  sessionExpiresAt: number | null;

  // acciones
  setUser: (user: User, ttlMs?: number) => void; // ttl opcional (default 10m)
  logout: () => void;
  isSessionActive: () => boolean;
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null;

// programa un timeout para desloguear cuando expire
function scheduleExpiryCheck(get: () => AppState, logout: () => void) {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  const { sessionExpiresAt } = get();
  if (!sessionExpiresAt) return;

  const msLeft = sessionExpiresAt - Date.now();
  if (msLeft <= 0) {
    // ya expiró
    logout();
    return;
  }
  expiryTimer = setTimeout(() => {
    logout();
  }, msLeft);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      sessionExpiresAt: null,

      setUser: (user, ttlMs = 10 * 60 * 1000) => {
        // Limpia timer y estado anterior antes de setear usuario nuevo
        if (expiryTimer) {
          clearTimeout(expiryTimer);
          expiryTimer = null;
        }
        set({ user: null, userId: null, sessionExpiresAt: null });
        const expiresAt = Date.now() + ttlMs;
        set({ user, userId: user?.id ?? null, sessionExpiresAt: expiresAt });
        // reprograma el timer cada vez que seteás usuario
        scheduleExpiryCheck(get, () => get().logout());
      },

      logout: () => {
        // limpia estado
        set({ user: null, userId: null, sessionExpiresAt: null });
        // limpia tokens y datos locales
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("userId");
          localStorage.removeItem("email");
          localStorage.removeItem("session_expires_at");
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
        // limpia timer
        if (expiryTimer) {
          clearTimeout(expiryTimer);
          expiryTimer = null;
        }
      },

      isSessionActive: () => {
  const { sessionExpiresAt, user } = get();
  return !!user && !!sessionExpiresAt && Date.now() < sessionExpiresAt;
      },
    }),
    {
      name: "app-store", // key en localStorage
      storage: createJSONStorage(() =>
        // SSR-safe: solo usa localStorage en el cliente
        typeof window !== "undefined" ? window.localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          length: 0,
          clear: () => {},
          key: () => null,
        } as Storage
      ),
      // solo persistimos lo necesario
      partialize: (state) => ({
        user: state.user,
        userId: state.userId,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
      // cuando rehidrata del storage, reprograma el timer y expira si corresponde
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        // se ejecuta DESPUÉS de rehidratar
        queueMicrotask(() => {
          const get = () => useAppStore.getState();
          const logout = () => useAppStore.getState().logout();
          scheduleExpiryCheck(get, logout);
          if (!useAppStore.getState().isSessionActive()) {
         
          }
        });
      },
      version: 1,
    }
  )
);
