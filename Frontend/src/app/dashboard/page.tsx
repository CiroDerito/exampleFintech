// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "../../store";


export default function DashboardPage() {
  const router = useRouter();
  const params = useSearchParams();

  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const isSessionActive = useAppStore((s) => s.isSessionActive);

  const [hydrated, setHydrated] = useState(false);

  // Evita hidratar desfasado
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Si venís del redirect con tokens en la query, guardalos y limpia la URL
  useEffect(() => {
    if (!hydrated) return;

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const email = params.get("email");
    const name = params.get("name") || undefined;
    const id = params.get("id") || "";

    if (access_token && email && id) {
      // Guardar tokens
      localStorage.setItem("access_token", access_token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("userId", id);
      localStorage.setItem("email", email);

      // Setear usuario en Zustand (TTL lo podés pasar leyendo exp del JWT si querés)
      setUser({ id, email, name, isActive: true });

      // Limpiar query de la URL
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [hydrated, params, setUser]);

  // Protección de ruta: se hace post-hidratación para evitar parpadeos
  useEffect(() => {
    if (!hydrated) return;
    if (!user || !isSessionActive()) {
      router.replace("/login");
    }
  }, [hydrated, user, isSessionActive, router]);

  if (!hydrated || !user) return null;

  return (
    <>
      <main className="min-h-screen w-full bg-gray-200 pt-14">
        <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Score + tips */}
          <section className="flex flex-col items-center lg:items-start">
            <div className="w-full max-w-md bg-white rounded shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-center">Tu Score</h2>
              <div className="flex flex-col items-center mb-4">
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl font-bold text-blue-700 border-4 border-blue-400">
                  720
                </div>
                <span className="mt-2 text-gray-600">Score actual</span>
              </div>
            </div>

            <div className="w-full max-w-md bg-white rounded shadow p-6">
              <h3 className="text-lg font-semibold mb-2">¿Cómo mejorar tu score?</h3>
              <ul className="list-disc pl-5 text-gray-700 mb-6 space-y-1">
                <li>Mantené tus cuentas al día</li>
                <li>Evitá atrasos en pagos</li>
                <li>Incrementá tu volumen de ventas</li>
                <li>Conectá más plataformas</li>
                <li>Solicitá financiamiento responsablemente</li>
              </ul>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  onClick={() => router.push("/solicita-credito")}
                >
                  Solicitar un crédito
                </button>
                <button
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  onClick={() => router.push("/creditos")}
                >
                  Tus créditos
                </button>
                <button
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  onClick={() => router.push("/proximos-pagos")}
                >
                  Tus próximos pagos
                </button>
              </div>
            </div>
          </section>

          {/* Columna derecha: Pasos / CTA */}
          <section className="flex items-start lg:items-center">
            <div className="bg-white rounded shadow p-8 w-full">
              <h2 className="text-2xl font-bold mb-2">
                Conectá tus cuentas, recibí tu oferta y empezá a crecer.
              </h2>
              <p className="mb-6 text-gray-700">
                Sin vueltas, sin papeleo, 100% online.
              </p>

              <div className="space-y-6 mb-6">
                <div className="flex items-start gap-3">
                  <span className="bg-gray-200 rounded-full p-2" aria-hidden>🔗</span>
                  <div>
                    <span className="font-semibold">Conectá tus plataformas</span>
                    <p className="text-gray-600 text-sm">
                      Vinculá tu tienda online, tus cuentas de publicidad y tu procesador de pagos.
                      Usamos estos datos para entender el ritmo real de tu negocio.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-gray-200 rounded-full p-2" aria-hidden>💲</span>
                  <div>
                    <span className="font-semibold">Recibí tu oferta personalizada</span>
                    <p className="text-gray-600 text-sm">
                      En minutos, analizamos tus métricas y te mostramos una propuesta de financiamiento adaptada a tu operación.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-gray-200 rounded-full p-2" aria-hidden>✔️</span>
                  <div>
                    <span className="font-semibold">Aceptá y usá el capital</span>
                    <p className="text-gray-600 text-sm">
                      Elegí el monto, confirmá las condiciones y recibí el dinero. Usalo para campañas, stock, logística o lo que tu negocio necesite.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="bg-gray-200 rounded-full p-2" aria-hidden>🔄</span>
                  <div>
                    <span className="font-semibold">Devolvé según tus ingresos</span>
                    <p className="text-gray-600 text-sm">
                      Opciones de devolución flexibles, alineadas a tu flujo de ventas o en cuotas fijas, según lo que te convenga.
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-4"
                onClick={() => router.push("/fuentes-datos")}
              >
                Conectá tus datos ahora
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
