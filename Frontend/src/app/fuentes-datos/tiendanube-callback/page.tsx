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

  // Redirect automático cuando TiendaNube está conectada
  useEffect(() => {
    if (hasTN === true) {
      toast.success("TiendaNube conectada exitosamente. Redirigiendo...");
      setTimeout(() => {
        router.push("/fuentes-datos");
      }, 2500);
    }
  }, [hasTN, router]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7Z M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar TiendaNube
          </h1>
          <p className="text-gray-600">
            Conecta tu tienda para importar datos de productos y ventas.
          </p>
        </div>

        <div className="mb-6">
          <div className={`flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
            hasTN === true 
              ? 'animate-pulse bg-green-50 border-2 border-green-200' 
              : hasTN === null 
                ? 'animate-pulse bg-yellow-50 border-2 border-yellow-200'
                : 'bg-gray-50'
          }`}>
            <span className={`text-2xl transition-transform duration-500 ${
              hasTN === true ? 'animate-bounce' : ''
            }`}>
              {hasTN === null ? "⏳" : hasTN ? "🟢" : "🔴"}
            </span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Estado de conexión</p>
              <p className={`text-sm transition-colors duration-300 ${
                hasTN === true 
                  ? "text-green-600 font-semibold" 
                  : hasTN === null 
                    ? "text-yellow-600" 
                    : "text-gray-500"
              }`}>
                {hasTN === null ? "Verificando conexión..." : hasTN ? "TiendaNube conectada" : "No conectada"}
              </p>
            </div>
            {hasTN === null && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {!hasTN && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conectar tu TiendaNube
              </h2>
              <p className="text-gray-600">
                Ingresa el dominio de tu tienda para iniciar la conexión OAuth
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dominio de tu tienda
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Ejemplo: mitienda42"
                    value={tiendaDomain}
                    onChange={(e) => setTiendaDomain(e.target.value)}
                    disabled={hasTN === true}
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    .mitiendanube.com
                  </div>
                </div>
                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleConnect}
                disabled={hasTN === true || !tiendaDomain.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  hasTN === true || !tiendaDomain.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {hasTN ? "Ya conectada" : "Conectar TiendaNube"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              router.push("/fuentes-datos");
            }}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Volver a fuentes de datos
          </button>
        </div>
      </div>
    </div>
  );
}
