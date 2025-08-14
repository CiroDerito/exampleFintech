// Componente Navbar
// Barra de navegación principal, muestra opciones según el estado de sesión.

import Link from 'next/link';
import { useAppStore } from '../store';
import { useCallback } from 'react';

export default function Navbar() {
  const user = useAppStore((state) => state.user);
  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAppStore.getState().setUser(null);
      window.location.href = '/'; // Redirige al layout principal
    }
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-600/80 backdrop-blur-md text-white px-6 h-14 flex justify-between items-center w-full rounded-b-lg shadow-lg">
      <div className="font-bold text-xl m-5">Loopi</div>
      <div className="space-x-4">
        <Link href="/" className="hover:underline">Inicio</Link>
        {user ? (
          <button
            className="ml-2 px-3 py-1 rounded text-white hover:underline transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <Link href="/login" className="hover:underline">Iniciar Sesión</Link>
        )}
      </div>
    </nav>
  );
}
