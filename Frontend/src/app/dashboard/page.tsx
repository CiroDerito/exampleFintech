// Página principal del dashboard.
// Muestra score, recomendaciones y navegación a otras secciones.
// Solo accesible si hay sesión activa.
"use client";
import Navbar from '../../components/Navbar';
import { useAppStore } from '../../store';
import Link from 'next/link';
import React from 'react';

export default function DashboardPage() {
  const user = useAppStore((state) => state.user);
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }


  return (
    <>
      <Navbar />
      <main className="min-h-screen flex w-full bg-gray-300 mt-3 mh-100vh">
        {/* Score y recomendaciones lado izquierdo */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-start p-10 mt-8">
          <div className="w-full max-w-md bg-white rounded shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-center">Tu Score</h2>
            {/* Simple gráfico de score (placeholder) */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-700 border-4 border-blue-400">
                720
              </div>
              <span className="mt-2 text-gray-600">Score actual</span>
            </div>
          </div>
          <div className="w-full max-w-md bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold mb-2">¿Cómo mejorar tu score?</h3>
            <ul className="list-disc pl-5 text-gray-700 mb-6">
              <li>Mantén tus cuentas al día</li>
              <li>Evita atrasos en pagos</li>
              <li>Incrementa tu volumen de ventas</li>
              <li>Conecta más plataformas</li>
              <li>Solicita financiamiento responsablemente</li>
            </ul>
            <div className="flex flex-row gap-3 justify-center">
              <button className="inline-block bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 cursor-pointer" onClick={() => window.location.href = '/solicita-credito'}>Solicita un crédito</button>
              <button className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer" onClick={() => window.location.href = '/creditos'}>Tus créditos</button>
              <button className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 cursor-pointer" onClick={() => window.location.href = '/proximos-pagos'}>Tus próximos pagos</button>
            </div>
          </div>
          {/* Renderiza el botón solo si el usuario NO tiene DNI válido */}
          {user && (
            <button
              className={`mt-6 px-6 py-2 rounded shadow ${user.dni && !isNaN(Number(user.dni)) && String(user.dni).length >= 7 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              onClick={() => {
                if (!(user.dni && !isNaN(Number(user.dni)) && String(user.dni).length >= 7)) {
                  window.location.href = "/register-dni";
                }
              }}
              disabled={user.dni && !isNaN(Number(user.dni)) && String(user.dni).length >= 7}
            >
              Completar DNI
            </button>
          )}
        </div>
        {/* Info y pasos lado derecho */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-10 mt-3">
          <div className="bg-white rounded shadow p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-2">Conectá tus cuentas, recibí tu oferta y empezá a crecer.</h2>
            <p className="mb-6 text-gray-700">Sin vueltas, sin papeleo, 100% online.</p>
            <div className="space-y-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="bg-gray-200 rounded-full p-2">🔗</span>
                <div>
                  <span className="font-semibold">Conectá tus plataformas</span>
                  <p className="text-gray-600 text-sm">Vinculá tu tienda online, tus cuentas de publicidad y tu procesador de pagos. Usamos estos datos para entender el ritmo real de tu negocio.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gray-200 rounded-full p-2">💲</span>
                <div>
                  <span className="font-semibold">Recibí tu oferta personalizada</span>
                  <p className="text-gray-600 text-sm">En minutos, analizamos tus métricas y te mostramos una propuesta de financiamiento adaptada a tu operación.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gray-200 rounded-full p-2">✔️</span>
                <div>
                  <span className="font-semibold">Aceptá y usá el capital</span>
                  <p className="text-gray-600 text-sm">Elegí el monto, confirmá las condiciones y recibí el dinero. Usalo para campañas, stock, logística o lo que tu negocio necesite.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-gray-200 rounded-full p-2">🔄</span>
                <div>
                  <span className="font-semibold">Devolvé según tus ingresos</span>
                  <p className="text-gray-600 text-sm">Opciones de devolución flexibles, alineadas a tu flujo de ventas o en cuotas fijas, según lo que te convenga.</p>
                </div>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-4" onClick={() => window.location.href = '/fuentes-datos'}>Conectá tus datos ahora</button>
          </div>
        </div>
      </main>
    </>
  );
}
