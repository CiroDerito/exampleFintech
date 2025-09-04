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
      toast.success("Propiedad vinculada correctamente");

      await gaSnapshot(user.id, {
        propertyId: selectedProperty,
        startDate: "2024-01-01",
        endDate: new Date().toISOString().slice(0, 10),
      });

      // Redirigir al final
      router.replace("/fuentes-datos");
      toast.success("Propiedad vinculada y métricas extraídas");
    } catch (e: any) {
      console.error("[GA] link/snapshot error:", e?.response?.data || e);
      toast.error("Error al vincular la propiedad o extraer métricas");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Conectar Google Analytics</h2>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={connected ? "text-green-700 text-xl" : "text-red-700 text-xl"}>
            {connected === null ? "⏳" : connected ? "🟢" : "🔴"}
          </span>
          <span className={connected ? "text-green-700 font-semibold" : "text-gray-600"}>
            {connected ? "Conectada" : "No conectada"}
          </span>
        </div>

        <p className="mb-4 text-gray-600">
          Iniciá la conexión OAuth con Google Analytics para importar tus métricas.
        </p>

        <button
          className={`w-full px-4 py-2 text-white rounded mt-2 ${
            connected ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleConnect}
          disabled={connected === true}
        >
          {connected ? "Ya conectada" : "Conectar"}
        </button>

        {connected && (
          <div className="mt-6 text-left">
            <h3 className="text-lg font-bold mb-2 text-center">
              Seleccioná tu propiedad GA4
            </h3>

            {loadingProps ? (
              <div className="text-gray-500 text-center">Cargando propiedades…</div>
            ) : properties.length === 0 ? (
              <div className="text-red-500 text-center">No se encontraron propiedades GA4.</div>
            ) : (
              <>
                <label htmlFor="ga-property" className="block text-sm text-gray-700 mb-1">
                  Propiedad
                </label>
                <select
                  id="ga-property"
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                >
                  <option value="" disabled>
                    Elegí una propiedad…
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>

                <button
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleLinkProperty}
                  disabled={!selectedProperty || linking}
                  aria-busy={linking}
                >
                  {linking ? "Vinculando..." : "Vincular propiedad y extraer métricas"}
                </button>
              </>
            )}
          </div>
        )}

        <button
          className="w-full px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 mt-4"
          onClick={() => {
            router.replace("/fuentes-datos");
            toast.success("Volviendo…");
          }}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
