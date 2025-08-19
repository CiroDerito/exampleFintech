

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TiendaNubeCallback() {
  const router = useRouter();
  const [tiendaDomain, setTiendaDomain] = useState("");
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_TIENDANUBE_CLIENT_ID || "20528";


  const handleConnect = async () => {
    if (!tiendaDomain || tiendaDomain.trim().length < 3) {
      setError("Debes ingresar el dominio de tu tienda (mínimo 3 caracteres).");
      return;
    }
    setError("");
    // Simula el flujo OAuth: redirige y luego recibe el code en el backend
    // Aquí deberías obtener el code de la URL después del redirect
    // Para demo, lo dejamos como ejemplo:
    const userId = localStorage.getItem("userId");
    // Redirige al OAuth de TiendaNube
    window.location.href = `https://${tiendaDomain}.mitiendanube.com/admin/apps/${clientId}/authorize?userId=${userId}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Conectar TiendaNube</h2>
        <p className="mb-4">Ingresá el dominio de tu tienda para iniciar la conexión OAuth.</p>
        <input
          type="text"
          className="border rounded px-4 py-2 w-full mb-2"
          placeholder="Ejemplo: mitienda42"
          value={tiendaDomain}
          onChange={e => setTiendaDomain(e.target.value)}
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2"
          onClick={handleConnect}
        >
          Conectar
        </button>
        <button
          className="w-full px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 mt-4"
          onClick={() => router.replace("/fuentes-datos")}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
