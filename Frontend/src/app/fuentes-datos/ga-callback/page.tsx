"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/store";

import {
  getUserById,
  getGaInstallUrl,
  gaLinkProperty,
  gaSnapshot,
  getGaProperties,
} from "@/services/back-api";

type GaProperty = { id: string; name: string };

export default function GaCallbackPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [properties, setProperties] = useState<GaProperty[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);

  // Auto-redirect después de vincular exitosamente
  useEffect(() => {
    if (linked) {
      const timer = setTimeout(() => {
        router.replace("/fuentes-datos");
      }, 500); // Redirect más rápido después de vincular
      return () => clearTimeout(timer);
    }
  }, [linked, router]);

  // Verifica conexión y trae propiedades si corresponde
  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setConnected(false);
      setProperties([]);
      setSelectedProperty("");
      return;
    }
    try {
      const u = await getUserById(user.id);
      setUser(u);
      const isConnected = Boolean(u?.gaAnalytics);
      setConnected(isConnected);

      if (isConnected) {
        setLoadingProps(true);
        try {
          const props = (await getGaProperties(user.id)) as GaProperty[];
          setProperties(props || []);
          if ((props?.length ?? 0) === 1) setSelectedProperty(props[0].id);
        } catch (e) {
          console.error("[GA] getGaProperties error:", e);
          setProperties([]);
          setSelectedProperty("");
        } finally {
          setLoadingProps(false);
        }
      } else {
        setProperties([]);
        setSelectedProperty("");
      }
    } catch (e) {
      console.error("[GA] checkConnection error:", e);
      setConnected(false);
      setProperties([]);
      setSelectedProperty("");
    }
  }, [user?.id, setUser]);

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

  const handleConnect = () => {
    if (!user?.id) {
      toast.error("No se encontró el usuario en sesión.");
      return;
    }
    window.location.href = getGaInstallUrl(user.id);
  };

  const handleLinkProperty = async () => {
    if (!user?.id || !selectedProperty) {
      toast.error("Elegí una propiedad GA4.");
      return;
    }
    setLinking(true);
    try {
      await gaLinkProperty(user.id, selectedProperty);
      toast.success("Propiedad vinculada y métricas extraídas correctamente");
      setLinked(true);
      
      // El redirect se maneja en el useEffect con delay
    } catch (e: any) {
      console.error("[GA] link error:", e?.response?.data || e);
      toast.error("Error al vincular la propiedad");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <img 
              src="/icons/ga-icon.png" 
              alt="Google Analytics" 
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar Google Analytics
          </h1>
          <p className="text-gray-600">
            Conecta tu cuenta de Google Analytics para importar métricas y datos de tráfico.
          </p>
        </div>

        <div className="mb-6">
          <div className={`flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
            connected === true 
              ? 'animate-pulse bg-green-50 border-2 border-green-200' 
              : connected === null 
                ? 'animate-pulse bg-yellow-50 border-2 border-yellow-200'
                : 'bg-gray-50'
          }`}>
            <span className={`text-2xl transition-transform duration-500 ${
              connected === true ? 'animate-bounce' : ''
            }`}>
              {connected === null ? "⏳" : connected ? "🟢" : "🔴"}
            </span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Estado de conexión</p>
              <p className={`text-sm transition-colors duration-300 ${
                connected === true 
                  ? "text-green-600 font-semibold" 
                  : connected === null 
                    ? "text-yellow-600" 
                    : "text-gray-500"
              }`}>
                {connected === null ? "Verificando conexión..." : connected ? "Google Analytics conectada" : "No conectada"}
              </p>
            </div>
            {connected === null && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {!connected && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Iniciar conexión OAuth
              </h2>
              <p className="text-gray-600">
                Haz clic para autorizar el acceso a tu cuenta de Google Analytics
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={!!connected}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                connected
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {connected ? "Ya conectada" : "Conectar Google Analytics"}
            </button>
          </div>
        )}

        {connected && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Selecciona tu propiedad GA4
              </h2>
              <p className="text-gray-600">
                Elige la propiedad de Google Analytics que quieres vincular
              </p>
            </div>

            {loadingProps ? (
              <div className="flex items-center justify-center gap-3 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <span className="text-yellow-700 font-medium">Cargando propiedades...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-red-700 font-medium">No se encontraron propiedades GA4</span>
                </div>
                <p className="text-red-600 text-sm">
                  Asegúrate de tener propiedades GA4 configuradas en tu cuenta de Google Analytics
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="ga-property" className="block text-sm font-medium text-gray-700 mb-2">
                    Propiedad de Google Analytics
                  </label>
                  <select
                    id="ga-property"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    <option value="" disabled>
                      Elige una propiedad...
                    </option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleLinkProperty}
                  disabled={!selectedProperty || linking || linked}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                    linked
                      ? "bg-green-100 text-green-700 border-2 border-green-200"
                      : !selectedProperty || linking
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 transform hover:scale-105"
                  }`}
                >
                  {linked ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl animate-bounce">✅</span>
                      <span>Propiedad vinculada - Redirigiendo...</span>
                    </div>
                  ) : linking ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Vinculando propiedad...</span>
                    </div>
                  ) : (
                    "Vincular propiedad y extraer métricas"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              router.replace("/fuentes-datos");
              toast.success("Volviendo…");
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
