"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getMerchantInstallUrl, getMerchantAccounts, merchantLinkAccount } from "@/services/back-api";
import { useAppStore } from "@/store";

export default function MerchantConnect() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const router = useRouter();
    const user = useAppStore((s) => s.user);
    const [hasMerchant, setHasMerchant] = useState<boolean | null>(null);
    const [needsAccount, setNeedsAccount] = useState(false);

    // nuevo: ID de la cuenta que está siendo vinculada (evita "Vinculando..." en todas)
    const [linkingAccountId, setLinkingAccountId] = useState<string | null>(null);

    const checkConnection = useCallback(async () => {
        if (!user?.id) {
            setHasMerchant(false);
            setNeedsAccount(false);
            return;
        }

        try {
            // Usar el endpoint /status para verificar el estado real
            const response = await api.get(`/merchant/${user.id}/status`);
            const status = response.data;

            console.log('[MERCHANT-CALLBACK] Status:', status);

            setHasMerchant(status.connected);

            if (!status.connected) {
                setNeedsAccount(false);
                return;
            }

            // Si está conectado pero no tiene cuenta vinculada, mostrar wizard
            if (!status.hasAccount) {
                setNeedsAccount(true);
                await loadAccounts();
            } else {
                setNeedsAccount(false);
                // Si ya tiene cuenta vinculada, ir a fuentes-datos
                router.push("/fuentes-datos");
            }
        } catch (error) {
            console.error("Error checking merchant connection:", error);
            // Si hay error en el API, asumir que no está conectado
            setHasMerchant(false);
            setNeedsAccount(false);
        }
    }, [user, router]);

    const loadAccounts = async () => {
        if (!user?.id) return;
        setLoadingAccounts(true);
        try {
            const data = await getMerchantAccounts(user.id);
            setAccounts(data || []);
        } catch (error) {
            console.error("Error loading merchant accounts:", error);
            toast.error("Error al cargar las cuentas de Merchant Center");
        } finally {
            setLoadingAccounts(false);
        }
    };

    const linkAccount = async (merchantId: string) => {
        if (!user?.id) return;
        setLinkingAccountId(merchantId);

        try {
            await merchantLinkAccount(user.id, merchantId);
            toast.success("Cuenta de Merchant Center vinculada exitosamente");

            // Actualizar estado inmediatamente para mostrar "conectado"
            setHasMerchant(true);
            setNeedsAccount(false);
            setSelectedAccount(merchantId);

            // Redirigir inmediatamente a fuentes-datos (las métricas se cargarán en background)
            toast.success("Redirigiendo...");
            setTimeout(() => {
                router.push("/fuentes-datos");
            }, 1000);

        } catch (error) {
            console.error("Error linking merchant account:", error);
            toast.error("Error al vincular la cuenta de Merchant Center");
        } finally {
            setLinkingAccountId(null);
        }
    };

    const reauth = () => {
        if (!user?.id) return;
        window.location.href = getMerchantInstallUrl(user.id);
    };

    const accountsToShow = useMemo(() => {
        return accounts.filter((acc) => acc.id && acc.name);
    }, [accounts]);

    useEffect(() => {
        checkConnection();
    }, [checkConnection]);

    useEffect(() => {
        if (linkingAccountId) {
            toast.success("Vinculando cuenta de Google Merchant Center. Redirigiendo...");
            setTimeout(() => {
                router.push("/fuentes-datos");
            }, 2600);
        }
    }, [linkingAccountId, router]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("merchant_connected") === "1") {
            checkConnection();
        }
    }, [checkConnection]);

    if (hasMerchant === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-blue-700">Verificando conexión con Google Merchant Center...</p>
                </div>
            </div>
        );
    }

    if (!hasMerchant) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <img src="/icons/merchant-icon.png" alt="Google Merchant" className="h-10 w-14" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Conectar Google Merchant Center
                        </h1>
                        <p className="text-gray-600">
                            Necesitas autorizar el acceso a tu cuenta de Google Merchant Center para continuar.
                        </p>
                    </div>

                    <button
                        onClick={reauth}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Conectar Google Merchant Center
                    </button>
                </div>
            </div>
        );
    }

    if (needsAccount) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <img src="/icons/merchant-icon.png" alt="Google Merchant" className="h-8 w-8" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Seleccionar Cuenta de Merchant Center
                            </h1>
                            <p className="text-gray-600">
                                Elige la cuenta de Google Merchant Center de la cual quieres extraer datos
                            </p>
                        </div>

                        {loadingAccounts ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Cargando cuentas de Merchant Center...</p>
                            </div>
                        ) : accountsToShow.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No se encontraron cuentas
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    No tienes acceso a ninguna cuenta de Google Merchant Center o necesitas reautenticarte.
                                </p>
                                <button
                                    onClick={reauth}
                                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Reautenticar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {accountsToShow.map((account) => (
                                        <label
                                            key={account.id}
                                            className={`block p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedAccount === account.id
                                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        type="radio"
                                                        name="merchantAccount"
                                                        value={account.id}
                                                        checked={selectedAccount === account.id}
                                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                                {account.name || `Cuenta ${account.id}`}
                                                            </h3>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <span className="font-mono text-xs">{account.id}</span>
                                                                </div>

                                                                {account.websiteUrl && (
                                                                    <div className="flex items-center text-sm text-blue-600">
                                                                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                                                                        </svg>
                                                                        <a
                                                                            href={account.websiteUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="hover:underline truncate"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            {account.websiteUrl}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                                            {account.verified !== false && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Verificada
                                                                </span>
                                                            )}

                                                            {account.country && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                                                    </svg>
                                                                    {account.country}
                                                                </span>
                                                            )}

                                                            {account.accountType && (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {account.accountType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-gray-200">
                                    <button
                                        onClick={() => selectedAccount && linkAccount(selectedAccount)}
                                        disabled={!selectedAccount || linkingAccountId !== null}
                                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${selectedAccount && linkingAccountId === null
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner'
                                            }`}
                                    >
                                        {linkingAccountId ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                                <span>Vinculando cuenta...</span>
                                            </div>
                                        ) : selectedAccount ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span>Conectar "{accountsToShow.find(acc => acc.id === selectedAccount)?.name || 'cuenta seleccionada'}"</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                                <span>Selecciona una cuenta para continuar</span>
                                            </div>
                                        )}
                                    </button>

                                    {selectedAccount && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-700">
                                                Has seleccionado la cuenta: {accountsToShow.find(acc => acc.id === selectedAccount)?.name || 'cuenta seleccionada'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => {
                                    if (hasMerchant && !selectedAccount && !linkingAccountId) {
                                        setHasMerchant(false);
                                        setNeedsAccount(false);
                                        setAccounts([]);
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
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-blue-700">Redirigiendo...</p>
            </div>
        </div>
    );
}
