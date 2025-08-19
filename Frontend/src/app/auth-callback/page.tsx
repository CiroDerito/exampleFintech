// Página de callback para autenticación OAuth.
// Procesa los tokens y redirige según el resultado.
"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../store';
import axios from 'axios';

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const email = params.get('email');
    const name = params.get('name');

    // Solo procesa los tokens, no los muestra ni los expone en la UI
    if (access_token && email) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('email', email);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
      localStorage.setItem('session_expires_at', expiresAt.toString());
      if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
      setUser({ email, name, isActive: true });
      // Obtener el usuario actual usando el token
      axios.get('/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
        .then(res => {
          const user = res.data;
          if (user?.id) {
            localStorage.setItem('userId', user.id);
            if (!user.dni) {
              router.replace(`/register-dni?id=${user.id}`);
            } else {
              router.replace('/');
            }
          } else {
            router.replace('/');
          }
        })
        .catch(() => {
          router.replace('/');
        });
    } else {
      router.replace('/login-google');
    }
  }, [router, setUser]);

  if (!mounted) return null;
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-300">
      <div className="p-4 bg-white rounded shadow">Procesando autenticación...</div>
    </main>
  );
}
