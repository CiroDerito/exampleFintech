// Página de fuentes de datos conectadas.
// Permite ver y conectar plataformas externas.
"use client"
import { useAppStore } from '../../store';
import Image from 'next/image';
import Navbar from '../../components/Navbar';

const fuentes = [
  {
    nombre: 'Mercado Meta',
    icon: '/icons/meta-icon.png',
    conectada: true,
    descripcion: 'Conectada a Meta Ads para analizar campañas.'
  },
  {
    nombre: 'Tienda Nube',
    icon: '/icons/tn-icon.png',
    conectada: false,
    descripcion: 'Sin conexión a Tienda Nube.'
  }
];

export default function FuentesDatosPage() {
  const user = useAppStore((state) => state.user);
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold mb-4">Acceso restringido</h2>
            <p>Debes iniciar sesión para ver tus fuentes de datos.</p>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-start bg-gray-100 pt-8">
  <div className="bg-white rounded shadow p-8 w-full max-w-4xl mt-10">
          <h2 className="text-2xl font-bold mb-6">Tus fuentes de datos</h2>
          <ul className="divide-y divide-gray-200">
            {fuentes.map((fuente, idx) => (
              <li key={idx} className="flex items-center py-4">
                <Image src={fuente.icon} alt={fuente.nombre} width={40} height={40} className="mr-4" />
                <div className="flex-1">
                  <div className="font-semibold">{fuente.nombre}</div>
                  <div className="text-sm text-gray-600">{fuente.descripcion}</div>
                </div>
                {fuente.conectada ? (
                  <>
                    <span className="ml-2 mr-12 text-green-600 text-xl">✔️</span>
                    <button className="w-40 px-4 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>Conectado</button>
                  </>
                ) : (
                  <>
                    <span className="ml-2 mr-12 text-red-600 text-xl">❌</span>
                    <button className="w-40 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">Conectala</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <button className="mt-8 w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 cursor-pointer" onClick={() => window.location.href = '/'}>
            Volver
            Volver
          </button>
        </div>
      </main>
    </>
  );
}
