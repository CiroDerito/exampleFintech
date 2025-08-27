"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/services/back-api";


function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function TiendaNubeConnect() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_TIENDANUBE_CLIENT_ID || "20528";

  const [tiendaDomain, setTiendaDomain] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [hasTN, setHasTN] = useState<boolean | null>(null); // null = verificando

  // Saca userId del access_token (sub)
  useEffect(() => {
    const at = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const claims = at ? parseJwt<any>(at) : null;
    const sub = claims?.sub as string | undefined;
    setUserId(sub ?? null);
  }, []);

  // Llama al backend: GET /users/:id y detecta tiendaNube
  const checkConnection = useCallback(async () => {
    if (!userId) {
      setHasTN(false);
      return;
    }
    try {
      const at = localStorage.getItem("access_token");
      const resp = await api.get(`/users/${userId}`, {
        headers: at ? { Authorization: `Bearer ${at}` } : undefined,
      });
      const u = resp.data;
      const tnId =
        u?.tiendaNubeId ??
        u?.tiendaNube?.id ??
        u?.metadata?.tiendaNubeId ??
        null;
      setHasTN(Boolean(tnId));
    } catch (e) {
      setHasTN(false);
    }
  }, [userId]);

  // Verifica al montar y cada vez que vuelve el foco (útil tras el OAuth)
  useEffect(() => {
    checkConnection();
    const onFocus = () => checkConnection();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [checkConnection]);

  const status = useMemo(() => {
    if (hasTN === null) return "⏳ Verificando conexión…";
    return hasTN ? "✅ Tienda Nube conectada" : "❌ Sin conexión a Tienda Nube";
  }, [hasTN]);

  const handleConnect = useCallback(() => {
    setError("");
    if (!tiendaDomain || tiendaDomain.trim().length < 3) {
      setError("Debes ingresar el dominio de tu tienda (mínimo 3 caracteres).");
      toast.error("Dominio inválido");
      return;
    }
    if (!userId) {
      setError("No se encontró el usuario en sesión.");
      toast.error("No se encontró el usuario en sesión.");
      return;
    }
    // Redirige a OAuth TiendaNube (pasamos userId para enlazar en el backend)
    window.location.href = `https://${tiendaDomain}.mitiendanube.com/admin/apps/${clientId}/authorize?userId=${encodeURIComponent(
      userId
    )}`;
  }, [tiendaDomain, clientId, userId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Conectar TiendaNube</h2>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={hasTN ? "text-green-700" : "text-red-700"}>{status}</span>
        </div>

        <p className="mb-4 text-gray-600">
          Ingresá el dominio de tu tienda para iniciar la conexión OAuth.
        </p>

        <input
          type="text"
          className="border rounded px-4 py-2 w-full mb-2"
          placeholder="Ejemplo: mitienda42"
          value={tiendaDomain}
          onChange={(e) => setTiendaDomain(e.target.value)}
          disabled={hasTN === true}
        />

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <button
          className={`w-full px-4 py-2 text-white rounded mt-2 ${
            hasTN ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleConnect}
          disabled={hasTN === true}
        >
          {hasTN ? "Ya conectada" : "Conectar"}
        </button>

        <button
          className="w-full px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 mt-4"
          onClick={() => {
            router.replace("/fuentes-datos");
            toast.success("Volviendo…");
          }}
        >
          Volver
        </button>

        {/* Botón para re-chequear manualmente si lo necesitás */}
        {/* <button onClick={checkConnection} className="mt-3 text-sm underline">Revisar estado</button> */}
      </div>
    </div>
  );
}
