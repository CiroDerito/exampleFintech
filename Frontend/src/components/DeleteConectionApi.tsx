"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  deleteConectionTn,
  deleteConectionMeta,
  deleteConectionBcra,
} from "@/services/back-api";

type ConnectionType = "tn" | "meta" | "bcra";

type Props = {
  type: ConnectionType;
  userId: string;             
  onDeleted?: () => void;
  confirm?: boolean;          
  className?: string;         
  disabled?: boolean;         
};

export default function DeleteConnectionButton({
  type,
  userId,
  onDeleted,
  confirm = true,
  className = "",
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);

  const action = useMemo(() => {
    const map: Record<ConnectionType, (id: string) => Promise<any>> = {
      tn: deleteConectionTn,
      meta: deleteConectionMeta,
      bcra: deleteConectionBcra,
    };
    return map[type];
  }, [type]);

  const handleDelete = async () => {
    if (loading) return;
    if (!userId) {
      toast.error("Falta userId para eliminar la conexión.");
      return;
    }
    if (confirm && !window.confirm("¿Seguro que querés eliminar esta conexión?")) return;

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
    <button
      onClick={handleDelete}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded bg-red-100 hover:bg-red-200 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <img src="/icons/remove-icon.png" alt="" className="w-8 h-6" aria-hidden />
    </button>
  );
}
