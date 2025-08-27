// Página para solicitar un crédito.
// Muestra saldo disponible y métodos de retiro.
// Solo accesible si hay sesión activa.
"use client";
import { useAppStore } from '../../store';
import Navbar from '../../components/Navbar';
import { useState } from 'react';

const withdrawalMethods = [
  {
    key: 'bancaria',
    label: 'Transferencia bancaria',
    description: 'Transferencia bancaria',
    icon: '🏦',
  },
  {
    key: 'mercadopago',
    label: 'Mercado Pago',
    description: 'Transferencia a tu cuenta de Mercado Pago',
    icon: '💳',
  },
];

export default function SolicitaCreditoPage() {
  // Demo: saldo depende del score del usuario
  const user = useAppStore((state) => state.user);
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
  const score = user?.score ?? 720;
  // Ejemplo: saldo = score * 800
  const saldoDisponible = score * 800;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center">Retirá tu crédito</h2>
          <div className="mb-6">
            <div className="text-gray-500 text-sm">Saldo disponible</div>
            <div className="text-3xl font-bold text-green-600">${saldoDisponible.toLocaleString()}</div>
          </div>
          <div className="mb-4 font-semibold">Método de retiro</div>
          <div className="flex flex-col gap-3 mb-8">
            {withdrawalMethods.map((method) => (
              <button
                key={method.key}
                className={`flex items-center gap-3 p-4 rounded-lg border transition shadow-sm text-left ${selected === method.key ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white'} hover:border-green-500`}
                onClick={() => setSelected(method.key)}
              >
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <div className="font-semibold">{method.label}</div>
                  <div className="text-gray-500 text-sm">{method.description}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <button
              className={`w-full py-2 rounded-lg font-semibold ${selected ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!selected}
            >
              Continuar
            </button>
            <button
              className="w-full py-2 rounded-lg font-semibold bg-gray-500 text-white hover:bg-gray-600 cursor-pointer"
              onClick={() => window.location.href = '/dashboard'}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
