"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  deleteConectionTn,
  deleteConectionMeta,
  deleteConectionBcra,
  deleteConectionGa,
  deleteConectionMerchant,
} from "@/services/back-api";

type ConnectionType = "tn" | "meta" | "bcra" | "ga" | "merchant";

type Props = {
  type: ConnectionType;
  userId: string;
  onDeleted?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function DeleteConnectionButton({
  type,
  userId,
  onDeleted,
  className = "",
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  const action = useMemo(() => {
    const map: Record<ConnectionType, (id: string) => Promise<any>> = {
      tn: deleteConectionTn,
      meta: deleteConectionMeta,
      bcra: deleteConectionBcra,
      ga: deleteConectionGa,
      merchant: deleteConectionMerchant,
    };
    return map[type];
  }, [type]);

  const handleDelete = async () => {
    if (!userId) {
      toast.error("Falta userId para eliminar la conexión.");
      return;
    }

    setLoading(true);
    try {
      await action(userId);
      toast.success("Conexión eliminada con éxito.");
      onDeleted?.();
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al eliminar la conexión";
      toast.error(apiMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          disabled={isDisabled}
          aria-disabled={isDisabled}
          aria-busy={loading}
          className={`flex items-center gap-2 px-3 py-2 rounded bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
          <img
            src="/icons/remove-icon.png"
            alt=""
            className="w-8 h-6"
            aria-hidden
          />
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 shadow-lg">
          <AlertDialog.Title className="text-lg font-bold text-gray-900">
            ¿Eliminar conexión?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            Esta acción desconectará la cuenta vinculada de <b>{type}</b>. 
            No podrás recuperar los datos históricos en la app una vez eliminada.
          </AlertDialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">
                Cancelar
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
