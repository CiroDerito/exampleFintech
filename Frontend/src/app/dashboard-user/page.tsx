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
      getUserById(user.id).then(setUser).catch(() => {});
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
        // Actualiza el usuario en el store
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
    // SSR fallback
    return (
      <main className="min-h-screen w-full bg-gray-200 pt-14 grid place-items-center">
        <span className="text-gray-600">Cargando…</span>
      </main>
    );
  }

  // Lógica robusta para TiendaNube conectado (igual que fuentes-datos)
  const tnId = user?.tiendaNubeId
    ?? user?.tiendaNube?.id
    ?? user?.metadata?.tiendaNubeId
    ?? user?.metadata?.tienda_nube_id
    ?? user?.tienda_nube_id
    ?? null;
  const tnConnected = Boolean(tnId);

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
      <section className="w-full max-w-md bg-white rounded shadow p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">Fuentes conectadas</h2>
        {/* TiendaNube */}
        {tnConnected && (
          <div className="flex items-center gap-3 mb-2">
            <img src="/icons/tn-icon.png" alt="TiendaNube" width={32} height={32} />
            <span className="text-green-600 font-semibold">Conectada 🟢</span>
          </div>
        )}
        {/* Meta Ads */}
        {(user.meta_id || user.metaId || user.metaAds?.id) && (
          <div className="flex items-center gap-3 mb-2">
            <img src="/icons/meta-icon.png" alt="Meta Ads" width={32} height={32} />
            <span className="text-green-600 font-semibold">Conectada 🟢</span>
          </div>
        )}
        {!tnConnected && !(user.meta_id || user.metaId || user.metaAds?.id) && (
          <div className="text-gray-500">No tienes fuentes conectadas.</div>
        )}
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
                  <label className="block text-sm font-medium mb-1">DNI</label>
                  <input
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full rounded border px-3 py-2"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                    placeholder="Solo números"
                  />
                  <p className="text-xs text-gray-500 mt-1">Solo números, mínimo 7 dígitos.</p>
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
