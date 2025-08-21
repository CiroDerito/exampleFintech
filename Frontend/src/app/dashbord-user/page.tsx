// app/dashbord-user/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import api from "@/services/back-api";
import { useAppStore } from "@/store";
import Image from "next/image";
import Link from "next/link";

// ------------ Helpers JWT ------------
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
function isJwtValid(token: string | null) {
  if (!token) return false;
  const claims = parseJwt<{ exp?: number }>(token);
  return !!claims?.exp && Date.now() < claims.exp * 1000;
}

// =====================================
// 1) WRAPPER: solo guarda de sesión (hooks fijos)
// =====================================
export default function DashboardUserPage() {
  const isSessionActive = useAppStore((s) => s.isSessionActive);

  // Estos hooks NO cambian entre renders:
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked">(
    "checking"
  );

  useEffect(() => {
    const okStore = isSessionActive?.() === true;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const okJwt = isJwtValid(token);
    setStatus(okStore || okJwt ? "allowed" : "blocked");
  }, [isSessionActive]);

}

// Pantalla simple sin hooks (evita order-change)
function BlockedScreen() {
  return (
    <main className="min-h-screen w-full bg-gray-100 pt-14 grid place-items-center">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">No autorizado</h2>
        <p className="text-gray-600 mb-6">
          Iniciá sesión para acceder a tu panel.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  );
}

// =====================================
// 2) INNER: todos los demás hooks aquí
// =====================================
type UserResp = {
  id: string;
  name?: string;
  email: string;
  dni?: number | null;
  organization?: { id: string; name?: string } | null;
  metadata?: Record<string, any> | null;
  tienda_nube_id?: string | null;
  tiendaNubeId?: string | null;
  tiendaNube?: { id: string } | null;
};

function DashboardUserInner() {
  // State/hooks SIEMPRE se declaran aquí (orden estable)
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResp | null>(null);
  const [open, setOpen] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dni, setDni] = useState<string>("");

  const fetchUser = useCallback(async () => {
    try {
      const resp = await api.get<UserResp>("/users/me");
      setUser(resp.data);
      if (!resp.data?.dni) setDni("");
    } catch (e: any) {
      const msg = Array.isArray(e?.response?.data?.message)
        ? e.response.data.message[0]
        : e?.response?.data?.message || "No se pudo cargar el usuario";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const tnConnected = useMemo(() => {
    if (!user) return false;
    return Boolean(
      user.tienda_nube_id ?? user.tiendaNubeId ?? user.tiendaNube?.id ?? null
    );
  }, [user]);

  const missingDni = !user?.dni && user?.dni !== 0;
  const isGoogleUser = useMemo(() => {
    const m = user?.metadata || {};
    return Boolean(
      m?.oauthProvider === "google" ||
        m?.provider === "google" ||
        m?.googleId ||
        m?.isGoogle === true
    );
  }, [user?.metadata]);

  const handleSave = async () => {
    try {
      if (!isGoogleUser && (newPassword || confirmPassword)) {
        if (newPassword.length < 6) {
          toast.error("El password debe tener al menos 6 caracteres");
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }
        await api.patch(`/users/${user!.id}/password`, { password: newPassword });
      }

      if (missingDni && dni.trim()) {
        const dniNum = Number(dni.trim());
        if (!/^\d{7,}$/.test(String(dniNum))) {
          toast.error("DNI inválido (solo números, mínimo 7 dígitos)");
          return;
        }
        await api.patch(`/users/${user!.id}/dni`, { dni: dniNum });
      }

      toast.success("Cambios guardados");
      setOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setDni("");
      await fetchUser();
    } catch (e: any) {
      const msg = Array.isArray(e?.response?.data?.message)
        ? e.response.data.message[0]
        : e?.response?.data?.message || "No se pudieron guardar los cambios";
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-gray-100 pt-14 flex items-center justify-center">
        <span className="text-gray-600">Cargando…</span>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-gray-100 pt-14 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">No se pudo cargar el usuario.</p>
        <Link href="/login" className="text-blue-600 underline">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-100 pt-14">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border">
              <Image src="/profile.png" alt="Perfil" fill className="object-cover" />
            </div>
            <div>
              <div className="text-xl font-semibold">{user.name ?? "—"}</div>
              <div className="text-gray-600">{user.email}</div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">Fuentes conectadas</h3>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Image src="/icons/tn-icon.png" alt="TiendaNube" width={28} height={28} />
                <span className="font-medium">TiendaNube</span>
              </div>
              <span className={tnConnected ? "text-green-600" : "text-red-600"}>
                {tnConnected ? "✅ Conectada" : "❌ Desconectada"}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Editar perfil
                </button>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40" />
                <Dialog.Content
                  className="
                    fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[92vw] max-w-md rounded-xl bg-white p-6 shadow-xl
                  "
                >
                  <Dialog.Title className="text-lg font-semibold mb-2">
                    Editar perfil
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-gray-600 mb-4">
                    Cambiá tu contraseña y completá los datos faltantes.
                  </Dialog.Description>

                  <div className="space-y-4">
                    {!isGoogleUser && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Nuevo password</label>
                          <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Confirmar password</label>
                          <input
                            type="password"
                            className="w-full rounded border px-3 py-2"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </>
                    )}

                    {missingDni && (
                      <div>
                        <label className="block text-sm font-medium mb-1">DNI</label>
                        <input
                          inputMode="numeric"
                          pattern="\d*"
                          className="w-full rounded border px-3 py-2"
                          value={dni}
                          onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                          placeholder="Solo números"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Solo números, mínimo 7 dígitos.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2 rounded border hover:bg-gray-50">
                        Cancelar
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      aria-label="Close"
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      ✖
                    </button>
                  </Dialog.Close>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </main>
  );
}
