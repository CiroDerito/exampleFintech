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

  // Redirect automático cuando Meta está conectada y configurada
  useEffect(() => {
    if (hasMeta === true && !needsAccount) {
      // Si Meta está conectada y no necesita configurar cuenta, redirigir inmediatamente
      toast.success("Meta Ads ya conectada. Redirigiendo...");
      setTimeout(() => {
        router.push("/fuentes-datos");
      }, 800);
    }
  }, [hasMeta, needsAccount, router]);

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
      
      // Limpiar estado
      setCampaigns([]);
      setSelectedAccount(null);
      
      // Redirigir a fuentes-datos después de un breve delay
      toast.success("Redirigiendo...");
      setTimeout(() => {
        router.push("/fuentes-datos");
      }, 1500);
      
    } catch {
      toast.error("Error al guardar métricas");
    } finally {
      setSavingMetrics(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conectar Meta Ads
          </h1>
          <p className="text-gray-600">
            Conecta tu cuenta de Meta Ads para importar datos de tus campañas publicitarias.
          </p>
        </div>

        <div className="mb-6">
          <div className={`flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg transition-all duration-300 ${
            hasMeta === true 
              ? 'animate-pulse bg-green-50 border-2 border-green-200' 
              : hasMeta === null 
                ? 'animate-pulse bg-yellow-50 border-2 border-yellow-200'
                : 'bg-gray-50'
          }`}>
            <span className={`text-2xl transition-transform duration-500 ${
              hasMeta === true ? 'animate-bounce' : ''
            }`}>
              {statusIcon}
            </span>
            <div className="text-left">
              <p className="font-medium text-gray-900">Estado de conexión</p>
              <p className={`text-sm transition-colors duration-300 ${
                hasMeta === true 
                  ? "text-green-600 font-semibold" 
                  : hasMeta === null 
                    ? "text-yellow-600" 
                    : "text-gray-500"
              }`}>
                {statusText}
              </p>
            </div>
            {hasMeta === null && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {!hasMeta && (
          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Conectar Meta Ads
          </button>
        )}

        {hasMeta && needsAccount && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Seleccionar Cuenta Publicitaria
              </h2>
              <p className="text-gray-600">
                Elige la cuenta publicitaria de la cual quieres extraer datos
              </p>
            </div>

            {loadingAccounts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando cuentas publicitarias...</p>
              </div>
            ) : adAccounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron cuentas
                </h3>
                <p className="text-gray-600 mb-4">
                  No tienes acceso a ninguna cuenta publicitaria de Meta Ads.
                </p>
                <button
                  onClick={handleConnect}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Reconectar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAccount ? (
                  // Mostrar cuenta vinculada
                  adAccounts
                    .filter((acc: any) => acc.id === selectedAccount)
                    .map((acc: any) => (
                      <div key={acc.id} className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                            <p className="text-sm text-gray-600 font-mono">{acc.id}</p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Vinculada
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  // Mostrar cuentas disponibles para vincular
                  adAccounts.map((acc: any) => (
                    <div key={acc.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                          <p className="text-sm text-gray-600 font-mono">{acc.id}</p>
                        </div>
                        <button
                          onClick={() => handleLinkAccount(acc.id)}
                          disabled={linkingAccountId === acc.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            linkingAccountId === acc.id
                              ? "bg-gray-400 text-white cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {linkingAccountId === acc.id ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Vinculando...
                            </div>
                          ) : (
                            "Vincular"
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {selectedAccount && campaigns.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Seleccionar Campaña para Métricas
                    </h3>
                    <div className="space-y-3">
                      {campaigns.map((camp: any) => (
                        <div key={camp.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{camp.name}</h4>
                            <p className="text-xs text-gray-500 font-mono">{camp.id}</p>
                          </div>
                          <button
                            onClick={() => handleSaveMetrics(camp.id)}
                            disabled={savingMetrics}
                            className={`px-4 py-2 rounded-md font-medium transition-colors ${
                              savingMetrics
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {savingMetrics ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                              </div>
                            ) : (
                              "Guardar métricas"
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              // Si Meta está conectada pero no seleccionó cuenta, limpiar estado
              if (hasMeta && !selectedAccount && !linkingAccountId) {
                // Limpiar conexión incompleta
                setHasMeta(false);
                setNeedsAccount(false);
                setAdAccounts([]);
                toast.info("Conexión cancelada - no se seleccionó cuenta");
              }
              router.push("/fuentes-datos");
            }}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Volver a fuentes de datos
          </button>
        </div>
      </div>
    </div>
  );
}
