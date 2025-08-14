// Componente LogoutButton
// Permite cerrar sesión y limpiar el estado de usuario.
"use client";
import { useAppStore } from '../store';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const setUser = useAppStore((state) => state.setUser);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    router.push('/');
  };

  return (
    <button
      className="ml-4 bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
      onClick={handleLogout}
    >
      Cerrar sesión
    </button>
  );
}
