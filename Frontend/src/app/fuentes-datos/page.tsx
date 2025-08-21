// app/fuentes-datos/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/back-api";
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
  const checkTiendaNube = useCallback(async () => {
    if (!userId) {
      setTnConnected(false);
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
    } catch {
      setTnConnected(false);
    }
  }, [userId]);

  useEffect(() => {
    checkTiendaNube();
    const onFocus = () => checkTiendaNube();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [checkTiendaNube]);

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
          {/* Meta - placeholder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/icons/meta-icon.png" alt="Meta" className="h-6 w-6" />
              <div>
                <div className="font-semibold">Meta</div>
                <div className="text-sm text-gray-600">
                  Conectada a Meta Ads para analizar campañas.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-pink-600 text-xl">❌</span>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => router.push("/fuentes-datos/meta-callback")}
              >
                Conectala
              </button>
            </div>
          </div>

          {/* TiendaNube */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/icons/tn-icon.png" alt="TiendaNube" className="h-6 w-6" />
              <div>
                <div className="font-semibold">TiendaNube</div>
                <div className="text-sm text-gray-600">
                  Conectá tu tienda para importar productos y ventas.
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
