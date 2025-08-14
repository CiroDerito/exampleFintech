"use client";
import React from 'react';
// Home page principal del proyecto fintech.
// Si el usuario tiene sesión activa, muestra el dashboard.
// Si no, muestra la landing con opción de registro.
import Navbar from "../components/Navbar";
import { useAppStore } from '../store';
import DashboardPage from './dashboard/page';

export default function Home() {
  const user = useAppStore((state) => state.user);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <>
      <Navbar />
      <main className="flex h-screen w-full bg-gray-300">
        {user ? (
          <DashboardPage />
        ) : (
          <>
            <div className="w-1/2 h-full relative">
              <img
                src="/background1.jpg"
                alt="Fondo fintech"
                className="object-cover w-full h-full"
                style={{ objectPosition: 'center' }}
              />
            </div>
            <div className="w-1/2 h-full flex flex-col items-center justify-center bg-gray-100">
              <h1 className="text-5xl font-bold text-gray-900 text-center px-8 mb-8">
                impulsa tu crecimiento<br />sin frenar tu operación.
              </h1>
              <button
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 shadow"
                onClick={() => window.location.href = '/register'}
              >
                Registrarse
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

