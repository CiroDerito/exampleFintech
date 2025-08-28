"use client";
import React, { useState } from "react";
import { useAppStore } from "../../store";
import * as Dialog from "@radix-ui/react-dialog";
import { patchUserPassword, patchUserDni, getUserById } from "../../services/back-api";
import { toast } from "sonner";

export default function DashboardUserPage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  React.useEffect(() => {
    if (user?.id) {
      getUserById(user.id).then(setUser).catch(() => { });
    }
    // eslint-disable-next-line
  }, []);

  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);

  // Si el usuario no tiene dni válido (>= 7 dígitos)
  const missingDni = !user?.dni && user?.dni !== 0;

  const handleSave = async () => {
    setLoading(true);
    try {
      // Password
      if (newPassword || confirmPassword) {
        if (newPassword.length < 6) {
          toast.error("El password debe tener al menos 6 caracteres");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          setLoading(false);
          return;
        }
        if (!user) {
          toast.error("Usuario no encontrado");
          setLoading(false);
          return;
        }
        await patchUserPassword(user.id, newPassword);
        toast.success("Password actualizado");
        setNewPassword("");
        setConfirmPassword("");
      }
      // DNI
      if (missingDni && dni.trim()) {
        const dniNum = Number(dni.trim());
        if (!/^\d{7,}$/.test(String(dniNum))) {
          toast.error("DNI inválido (solo números, mínimo 7 dígitos)");
          setLoading(false);
          return;
        }
        if (!user) {
          toast.error("Usuario no encontrado");
          setLoading(false);
          return;
        }
        await patchUserDni(user.id, dniNum);
        toast.success("DNI actualizado");
        setDni("");
        const updated = await getUserById(user.id);
        setUser(updated);
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "No se pudieron guardar los cambios");
    }
    setLoading(false);
  };

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
      return null;
    }
    return (
      <main className="min-h-screen w-full bg-gray-200 pt-14 grid place-items-center">
        <span className="text-gray-600">Cargando…</span>
      </main>
    );
  }

  // -------- Fuentes conectadas (mismo flujo que Meta y Tienda Nube) --------
  // TiendaNube
  const tnId =
    user?.tiendaNubeId ??
    user?.tiendaNube?.id ??
    user?.metadata?.tiendaNubeId ??
    user?.metadata?.tienda_nube_id ??
    (user as any)?.tienda_nube_id ??
    null;
  const tnConnected = Boolean(tnId);

  // Meta Ads
  const metaId = (user as any)?.meta_id ?? (user as any)?.metaId ?? (user as any)?.metaAds?.id ?? null;
  const metaConnected = Boolean(metaId);

  // BCRA
  const bcraId =
    (user as any)?.bcra_id ??
    (user as any)?.bcra?.id ??
    user?.metadata?.bcra_id ??
    null;
  const bcraConnected = Boolean(bcraId);

  const noneConnected = !tnConnected && !metaConnected && !bcraConnected;

  return (
    <main className="min-h-screen w-full bg-gray-200 pt-14 flex flex-col items-center justify-center gap-4">
      <img src="/profile.png" alt="Perfil" width={120} height={120} className="rounded-full mb-4 object-cover" />
      <div className="text-gray-600">{user.email}</div>
      <div className="text-xl font-bold mb-2">{user.name}</div>
      <button
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => setOpen(true)}
      >
        Editar perfil
      </button>

      {/* Fuentes conectadas */}
  <section className="w-[80%] bg-white rounded-xl shadow-lg p-8 mt-8 flex flex-col gap-4 items-center transition-all duration-300 overflow-x-auto min-h-[320px] min-w-[700px] max-w-full">
        <h2 className="text-2xl font-bold mb-2 text-blue-700 tracking-wide">Fuentes conectadas</h2>
        <div className="flex flex-row gap-6 justify-center items-start w-full">

        {/* TiendaNube */}
        {tnConnected && (
          <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg shadow-md p-6 min-w-[220px] max-w-xs hover:scale-105 transition-transform duration-200">
            <img src="/icons/tn-icon.png" alt="TiendaNube" width={40} height={40} className="mb-2 drop-shadow" />
            <span className="text-green-600 font-semibold text-lg mb-1 animate-pulse">Conectada 🟢</span>
            <span className="text-blue-700 font-medium text-sm">TiendaNube</span>
          </div>
        )}

        {/* Meta Ads */}
        {metaConnected && (
          <div className="flex flex-col items-center justify-center bg-purple-50 rounded-lg shadow-md p-6 min-w-[220px] max-w-xs hover:scale-105 transition-transform duration-200">
            <img src="/icons/meta-icon.png" alt="Meta Ads" width={40} height={40} className="mb-2 drop-shadow" />
            <span className="text-green-600 font-semibold text-lg mb-1 animate-pulse">Conectada 🟢</span>
            <span className="text-purple-700 font-medium text-sm">Meta Ads</span>
          </div>
        )}

        {/* BCRA */}
        {bcraConnected && (
          <div className="flex flex-col items-center justify-center bg-teal-50 rounded-lg shadow-md p-6 min-w-[220px] max-w-xs hover:scale-105 transition-transform duration-200">
            <img src="/icons/bcra-icon.png" alt="Banco de la República Argentina" width={40} height={40} className="mb-2 drop-shadow" />
            <span className="text-green-600 font-semibold text-lg mb-1 animate-pulse">Conectada 🟢</span>
            <span className="text-teal-700 font-medium text-sm">BCRA Deudores</span>
          </div>
        )}

        {/* Vacío */}
        {noneConnected && (
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow-md p-6 min-w-[220px] max-w-xs">
            <span className="text-gray-500 font-semibold text-lg mb-1">Sin fuentes conectadas</span>
            <span className="text-gray-400 font-medium text-sm">Conecta una fuente para comenzar</span>
          </div>
        )}
        </div>
      </section>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded shadow p-8 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold mb-2">Editar perfil</Dialog.Title>
            <p className="text-sm text-gray-600 mb-4">Cambiá tu contraseña y completá los datos faltantes.</p>
            <div className="space-y-4">
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
              {missingDni && (
                <div>
                  <label className="block text-sm font-medium mb-1">CUIT/CUIL</label>
                  <input
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full rounded border px-3 py-2"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 30708292623"
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo números, 11 dígitos.</p>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  Guardar
                </button>
                <Dialog.Close asChild>
                  <button className="px-4 py-2 rounded border hover:bg-gray-50">Cancelar</button>
                </Dialog.Close>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
