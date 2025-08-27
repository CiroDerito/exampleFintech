// Página de próximos pagos del usuario.
// Muestra el monto de crédito y las fechas de pago.
"use client";
import Link from 'next/link';
import Navbar from '../../components/Navbar';

const creditAmount = 6000;
const payments = [
  { label: 'Pago 1', date: '15 de Julio', amount: 1200 },
  { label: 'Pago 2', date: '15 de Agosto', amount: 1200 },
  { label: 'Pago 3', date: '15 de Septiembre', amount: 1200 },
  { label: 'Pago 4', date: '15 de Octubre', amount: 1200 },
  { label: 'Pago 5', date: '15 de Noviembre', amount: 1200 },
];

export default function ProximosPagos() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Tu crédito actual es de:</h2>
          <div className="text-3xl font-semibold text-blue-600 mb-6 text-center">${`$${creditAmount.toLocaleString()}`}</div>
          <h3 className="text-xl font-bold mb-4 text-center">Próximos Pagos</h3>
          <ul className="divide-y divide-gray-200">
            {payments.map((pago, idx) => (
              <li key={idx} className="flex justify-between items-center py-3">
                <div>
                  <div className="font-semibold">{pago.label}</div>
                  <div className="text-gray-500 text-sm">{pago.date}</div>
                </div>
                <div className="font-bold text-gray-700">${`$${pago.amount.toLocaleString()}`}</div>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Link href="/dashboard">
              <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg shadow cursor-pointer hover:bg-gray-600 transition">Volver</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
