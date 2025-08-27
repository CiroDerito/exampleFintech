"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/services/back-api";
import { useAppStore } from "@/store";

export default function MetaAdsConnect() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [hasMeta, setHasMeta] = useState<boolean | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // nuevo: ID de la cuenta que está siendo vinculada (evita "Vinculando..." en todas)
  const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setHasMeta(false);
      setNeedsAccount(false);
      return;
    }
    try {
      const at =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const resp = await api.get(`/users/${user.id}`, {
        headers: at ? { Authorization: `Bearer ${at}` } : undefined,
      });
      const metaId =
        resp.data?.meta_id ??
        resp.data?.metaId ??
        resp.data?.metaAds?.id ??
        null;

      setHasMeta(Boolean(metaId));
      if (metaId && !resp.data?.metaAds?.accountId) {
        setNeedsAccount(true);
        setLoadingAccounts(true);
        try {
          const accounts = await api.get(`/meta-ads/${user.id}/adaccounts`);
          setAdAccounts(accounts.data || []);
        } catch {
          setAdAccounts([]);
        }
        setLoadingAccounts(false);
      } else {
        setNeedsAccount(false);
      }
    } catch {
      setHasMeta(false);
      setNeedsAccount(false);
    }
  }, [user?.id]);

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

  const statusIcon = useMemo(() => {
    if (hasMeta === null) return "⏳";
    return hasMeta ? "🟢" : "🔴";
  }, [hasMeta]);

  const statusText = useMemo(() => {
    if (hasMeta === null) return "Verificando conexión…";
    return hasMeta ? "Conectada" : "No conectada";
  }, [hasMeta]);

  const handleConnect = useCallback(() => {
    if (!user?.id) {
      toast.error("No se encontró el usuario en sesión.");
      return;
    }
    window.location.href = `${process.env.NEXT_PUBLIC_BACK_URL}/meta-ads/oauth/install?userId=${encodeURIComponent(
      user.id
    )}`;
  }, [user?.id]);

  const handleLinkAccount = async (accountId: string) => {
    if (!user?.id) return;
    if (linkingAccountId) return; // evitar doble click en otra cuenta mientras hay una en curso
    setLinkingAccountId(accountId);
    try {
      await api.post(`/meta-ads/${user.id}/adaccounts/link`, { accountId });
      toast.success("Cuenta vinculada correctamente");
      setSelectedAccount(accountId);
      setNeedsAccount(false);

      // Guardar métricas automáticamente (silencioso)
      try {
        await api.post(`/meta-ads/${user.id}/campaign-metrics`, { accountId });
      } catch {
        toast.error("No se pudieron guardar las métricas automáticamente");
      }

      // Cargar campañas de esa cuenta
      setLoadingCampaigns(true);
      try {
        const resp = await api.get(
          `/meta-ads/${user.id}/adaccounts/${accountId}/campaigns`
        );
        setCampaigns(resp.data || []);
      } catch {
        setCampaigns([]);
      }
      setLoadingCampaigns(false);
    } catch {
      toast.error("Error al vincular la cuenta");
    } finally {
      setLinkingAccountId(null);
    }
  };

  const handleSaveMetrics = async (campaignId: string) => {
    if (!user?.id || !selectedAccount) return;
    setSavingMetrics(true);
    try {
      await api.post(`/meta-ads/${user.id}/campaign-metrics`, {
        accountId: selectedAccount,
        campaignId,
      });
      toast.success("Métricas guardadas correctamente");
      setCampaigns([]);
      setSelectedAccount(null);
      checkConnection();
    } catch {
      toast.error("Error al guardar métricas");
    } finally {
      setSavingMetrics(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-2">Conectar Meta Ads</h2>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className={hasMeta ? "text-green-600 text-xl" : "text-pink-600 text-xl"}>
            {statusIcon}
          </span>
          <span className={hasMeta ? "text-green-600 font-semibold" : "text-gray-600"}>
            {hasMeta ? `${statusText}` : "No conectada"}
          </span>
        </div>

        <p className="mb-4 text-gray-600">
          Iniciá la conexión OAuth con Meta Ads para importar tus campañas.
        </p>

        <button
          className={`w-full px-4 py-2 text-white rounded mt-2 ${hasMeta ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          onClick={handleConnect}
          disabled={hasMeta === true}
        >
          {hasMeta ? <span className="text-green-600">Conectada 🟢</span> : <span>Conectala 🔴</span>}
        </button>

        {needsAccount && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Seleccioná tu cuenta publicitaria</h3>

            {loadingAccounts ? (
              <div className="text-gray-500">Cargando cuentas…</div>
            ) : adAccounts.length === 0 ? (
              <div className="text-red-500">No se encontraron cuentas publicitarias.</div>
            ) : (
              <ul className="mb-4">
                {selectedAccount
                  ? // Si ya se seleccionó y vinculó una, mostrarla como "Vinculada"
                  adAccounts
                    .filter((acc: any) => acc.id === selectedAccount)
                    .map((acc: any) => (
                      <li key={acc.id} className="mb-2 flex items-center justify-between">
                        <span>
                          {acc.name}{" "}
                          <span className="text-xs text-gray-500">({acc.id})</span>
                        </span>
                        <button className="px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed" disabled>
                          Vinculada
                        </button>
                      </li>
                    ))
                  : // Si hay una sola cuenta
                  adAccounts.length === 1
                    ? adAccounts.map((acc: any) => (
                      <li key={acc.id} className="mb-2 flex items-center justify-between">
                        <span>
                          {acc.name}{" "}
                          <span className="text-xs text-gray-500">({acc.id})</span>
                        </span>
                        <button
                          className={`px-3 py-1 text-white rounded ${linkingAccountId === acc.id
                            ? "bg-gray-400"
                            : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                            }`}
                          disabled={linkingAccountId === acc.id}
                          onClick={() => handleLinkAccount(acc.id)}
                          aria-busy={linkingAccountId === acc.id}
                        >
                          {linkingAccountId === acc.id ? "Vinculando…" : "Vincular"}
                        </button>
                      </li>
                    ))
                    : // Varias cuentas
                    adAccounts.map((acc: any) => {
                      const isThisLinking = linkingAccountId === acc.id;
                      const isOtherLinking = Boolean(
                        linkingAccountId && linkingAccountId !== acc.id
                      );
                      return (
                        <li key={acc.id} className="mb-2 flex items-center justify-between">
                          <span>
                            {acc.name}{" "}
                            <span className="text-xs text-gray-500">({acc.id})</span>
                          </span>
                          <button
                            className={`px-3 py-1 text-white rounded ${linkingAccountId === acc.id
                                ? "bg-gray-400 cursor-wait pointer-events-none"
                                : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            disabled={linkingAccountId === acc.id}         // ✅ solo el clickeado se deshabilita
                            onClick={() => handleLinkAccount(acc.id)}
                            aria-busy={linkingAccountId === acc.id}
                          >
                            {linkingAccountId === acc.id ? "Vinculando…" : "Vincular"}
                          </button>
                        </li>
                      );
                    })}
              </ul>
            )}

            {selectedAccount && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-2">Seleccioná la campaña para guardar métricas</h3>
                {loadingCampaigns ? (
                  <div className="text-gray-500">Cargando campañas…</div>
                ) : campaigns.length === 0 ? (
                  <div className="text-red-500">No se encontraron campañas.</div>
                ) : (
                  <ul className="mb-4">
                    {campaigns.map((camp: any) => (
                      <li key={camp.id} className="mb-2 flex items-center justify-between">
                        <span>
                          {camp.name}{" "}
                          <span className="text-xs text-gray-500">({camp.id})</span>
                        </span>
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                          disabled={savingMetrics}
                          onClick={() => handleSaveMetrics(camp.id)}
                          aria-busy={savingMetrics}
                        >
                          {savingMetrics ? "Guardando…" : "Guardar métricas"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
