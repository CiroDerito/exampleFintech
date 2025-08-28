'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { patchUserDni, getUserById } from '@/services/back-api';
import { useAppStore } from '@/store';
import { toast } from 'sonner';

type Props = {
  open?: boolean;                               // (opcional) modo controlado
  onOpenChange?: (v: boolean) => void;          // (opcional) modo controlado
  onConnected?: (bcraId: string | null) => void;// (opcional) para refrescar la UI del padre
  children?: React.ReactNode;                   // Trigger con asChild
};

export default function BcraConnectDialog({ open, onOpenChange, onConnected, children }: Props) {
  const user  = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const disabled = loading || !/^\d{11}$/.test(dni);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!user?.id) {
      toast.error('Sesión expirada. Iniciá sesión nuevamente.');
      return;
    }
    if (!/^\d{11}$/.test(dni)) {
      setError('El CUIL/CUIT debe tener exactamente 11 números.');
      return;
    }

    setLoading(true);
    try {
      const resp = await patchUserDni(user.id, Number(dni));
      const bcraId = resp?.bcra?.id ?? null;

      toast.success('CUIL/CUIT registrado y consultado en BCRA');

      // Traer user fresco; si falla, actualizamos a mano
      const fresh = await getUserById(user.id).catch(() => null);
      if (fresh) setUser(fresh);
      else setUser({ ...(user as any), dni: Number(dni), bcra_id: bcraId });

      onConnected?.(bcraId);
      setDni('');
      onOpenChange?.(false); // cerrar si está en modo controlado
    } catch (e: any) {
      setError(e?.message || 'Error al registrar CUIL/CUIT');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children ? <Dialog.Trigger asChild>{children}</Dialog.Trigger> : null}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md rounded-xl bg-white p-6 shadow focus:outline-none">
          <div className="flex items-center gap-3 mb-4">
            <img src="/icons/bcra-icon.png" alt="BCRA" className="h-6 w-6" />
            <Dialog.Title className="text-lg font-semibold">
              Banco de la República Argentina
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium">
              CUIL/CUIT
              <input
                inputMode="numeric"
                pattern="\d*"
                maxLength={11}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Ej: 20408897921"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 11))}
              />
            </label>

            {!!error && <p className="text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="px-3 py-2 rounded border hover:bg-gray-50" type="button">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={disabled}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Conectando…' : 'Conectar BCRA'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
