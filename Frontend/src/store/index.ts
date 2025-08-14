// Store principal (Zustand)
// Maneja el estado global de usuario, sesión y expiración.
import { create } from 'zustand';

interface AppState {
  user: any;
  sessionExpiresAt: number | null;
  setUser: (user: any) => void;
  logout: () => void;
  isSessionActive: () => boolean;
}

export const useAppStore = create<AppState>((set, get) => {
  // Inicializa desde localStorage si existe
  let user = null;
  let sessionExpiresAt = null;
  try {
    const userStr = localStorage.getItem('user');
    const expiresStr = localStorage.getItem('sessionExpiresAt');
    if (userStr && expiresStr) {
      user = JSON.parse(userStr);
      sessionExpiresAt = Number(expiresStr);
    }
  } catch {}

  return {
    user,
    sessionExpiresAt,
    setUser: (user) => {
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
      set({ user, sessionExpiresAt: expiresAt });
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('sessionExpiresAt', String(expiresAt));
    },
    logout: () => {
      set({ user: null, sessionExpiresAt: null });
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionExpiresAt');
    },
    isSessionActive: () => {
      const { user, sessionExpiresAt } = get();
      return !!user && !!sessionExpiresAt && Date.now() < sessionExpiresAt;
    },
  };
});
