// app/fuentes-datos/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api, { getMetaInsights } from "@/services/back-api";
import { useAppStore } from "@/store";

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

export default function FuentesDatosPage() {
  const router = useRouter();
  const zUser = useAppStore((s) => s.user);

  const [userId, setUserId] = useState<string | null>(null);
  const [tnConnected, setTnConnected] = useState<boolean | null>(null); // null = verificando
  const [metaConnected, setMetaConnected] = useState<boolean | null>(null);
  const [metaInsights, setMetaInsights] = useState<any[] | null>(null);

  // 1) userId desde store → fallback access_token.sub
  useEffect(() => {
    if (zUser?.id) {
      setUserId(zUser.id);
      return;
    }
    const at = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const claims = at ? parseJwt<any>(at) : null;
    setUserId((claims?.sub as string) ?? null);
  }, [zUser?.id]);

  // 2) consulta al backend
  const checkConnections = useCallback(async () => {
    if (!userId) {
      setTnConnected(false);
      setMetaConnected(false);
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
      setTnConnected(Boolean(tnId));
      const metaId = u?.meta_id ?? u?.metaAds?.id ?? null;
      setMetaConnected(Boolean(metaId));
      if (metaId) {
        try {
          const insights = await getMetaInsights(userId);
          setMetaInsights(insights);
        } catch {
          setMetaInsights(null);
        }
      } else {
        setMetaInsights(null);
      }
    } catch {
      setTnConnected(false);
      setMetaConnected(false);
      setMetaInsights(null);
    }
  }, [userId]);

  useEffect(() => {
    checkConnections();
    const onFocus = () => checkConnections();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [checkConnections]);

  // 3) helpers de UI
  const tnStatusIcon = useMemo(() => {
    if (tnConnected === null) return "⏳";
    return tnConnected ? "🟢" : "🔴";
  }, [tnConnected]);

  return (
    <main className="min-h-screen w-full bg-gray-100 pt-14">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold mb-8">Tus fuentes de datos</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-8">
          {/* Meta Ads */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/icons/meta-icon.png" alt="Meta" className="h-6 w-6" />
              <div>
                <div className="font-semibold">Meta Ads</div>
                <div className="text-sm text-gray-600">
                  Conectá tu cuenta de Meta Ads para analizar campañas y métricas.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={metaConnected ? "text-green-600 text-xl" : "text-pink-600 text-xl"}>{metaConnected ? "🟢" : "🔴"}</span>
              <button
                className={`px-4 py-2 text-white rounded ${
                  metaConnected ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={() => router.push("/fuentes-datos/meta-callback")}
                disabled={metaConnected === true || userId == null}
                title={userId == null ? "Iniciá sesión" : undefined}
              >
                {metaConnected ? "Conectada" : "Conectala"}
              </button>
              {/* ...eliminado el botón + ... */}
            </div>
          </div>

          {/* ...eliminado el renderizado de métricas Meta Ads... */}

          {/* TiendaNube */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/icons/tn-icon.png" alt="TiendaNube" className="h-6 w-6" />
              <div>
                <div className="font-semibold">TiendaNube</div>
                <div className="text-sm text-gray-600">
                  Conectá tu tienda para importar datos de tus productos y ventas.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={tnConnected ? "text-green-600 text-xl" : "text-pink-600 text-xl"}>
                {tnStatusIcon}
              </span>

              <button
                className={`px-4 py-2 text-white rounded ${
                  tnConnected
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={() => router.push("/fuentes-datos/tiendanube-callback")}
                disabled={tnConnected === true || userId == null}
                title={userId == null ? "Iniciá sesión" : undefined}
              >
                {tnConnected ? "Conectada" : "Conectala"}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              className="w-full px-4 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={() => router.push("/")}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}