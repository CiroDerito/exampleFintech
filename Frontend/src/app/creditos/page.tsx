// Página de créditos del usuario.
// Solo accesible si hay sesión activa.
"use client"
import router from 'next/router';
import { useAppStore } from '../../store';
import Image from 'next/image';

const creditos = [
  {
    nombre: 'Crédito Loopi',
    descripcion: 'Tu línea de crédito flexible',
    disponible: 6000,
    vencimiento: '2025-09-15',
    diasDisponibles: 32,
    saldoDisponible: 2000,
    actualizado: 'hace 2 horas',
  imagen: '/backgrondcredit-sec.jpg',
  }
];

export default function CreditosPage() {
  const user = useAppStore((state) => state.user);
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Acceso restringido</h2>
          <p>Debes iniciar sesión para ver tus créditos.</p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-200 pt-8">
    <div className="bg-white rounded shadow p-8 w-full max-w-lg mt-10">
        <h2 className="text-2xl font-bold mb-6">Tu Cuenta Corriente</h2>
        {creditos.map((credito, idx) => (
          <div key={idx} className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-gray-200 flex items-center justify-center">
              <Image src={credito.imagen} alt={credito.nombre} width={112} height={112} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            </div>
            <div className="text-xl font-semibold mb-1">{credito.nombre}</div>
            <div className="text-gray-500 mb-4">{credito.descripcion}</div>
            <div className="w-full flex justify-between items-center mb-2">
              <span className="font-medium">Crédito Disponible</span>
              <span className="font-bold">{credito.disponible}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded mb-2">
              <div className="h-3 bg-gray-800 rounded" style={{ width: `${(credito.saldoDisponible / credito.disponible) * 100}%` }} />
            </div>
            <div className="text-xs text-gray-400 mb-4">Actualizado {credito.actualizado}</div>
            <div className="w-full grid grid-cols-3 gap-4 text-center mt-4">
              <div>
                <div className="text-sm text-gray-500">Fecha de vencimiento</div>
                <div className="font-bold text-gray-700">{credito.vencimiento}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Días disponibles</div>
                <div className="font-bold text-gray-700">{credito.diasDisponibles}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Saldo disponible</div>
                <div className="font-bold text-gray-700">{credito.saldoDisponible}</div>
              </div>
            </div>
          </div>
        ))}
  <button className="mt-8 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 cursor-pointer" onClick={() =>  window.location.href = '/dashboard'}>
          Volver
        </button>
      </div>
    </main>
  );
}
