// Página de login.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/back-api";
import { useAppStore } from "../../store";
import { toast } from "sonner";

type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    isActive?: boolean;
    last_login?: string;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Limpia localStorage antes de guardar nuevos datos
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      localStorage.removeItem("session_expires_at");

      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      const { access_token, refresh_token, user } = res.data;

      localStorage.setItem("access_token", access_token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);

      // Guardar last_login si está presente
      if (user.last_login) {
        localStorage.setItem("last_login", user.last_login);
      }

      // Consulta fuentes conectadas (TiendaNube)
      let tnId = null;
      try {
        const userResp = await api.get(`/users/${user.id}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const u = userResp.data;
        tnId = u?.tiendaNubeId ?? u?.tiendaNube?.id ?? u?.metadata?.tiendaNubeId ?? u?.tienda_nube_id ?? null;
      } catch {}

      // Pasamos el user extendido con info de fuentes conectadas y last_login
      setUser(
        {
          id: user.id,
          email: user.email,
          name: user.name ?? "",
          isActive: user.isActive ?? true,
          tiendaNubeId: tnId,
          last_login: user.last_login ?? null,
        }
        // , 10 * 60 * 1000 // opcional: TTL custom
      );

      toast.success("Bienvenido");
      router.push("/");

      // Ejecutar el endpoint de diferencia de métricas 3 segundos después del login
      setTimeout(async () => {
        try {
          await import("../../services/back-api").then(({ getMetaMetricsDiffLogin, getTiendaNubeMetricsDiffLogin }) => {
            getMetaMetricsDiffLogin(user.id);
            getTiendaNubeMetricsDiffLogin(user.id);
          });
        } catch (e) {
          // Puedes loguear el error si lo deseas
        }
      }, 3 * 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Credenciales inválidas");
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-gray-300">
      <div className="w-1/2 h-screen relative hidden md:flex items-center justify-center overflow-hidden">
        <img
          src="/background-login.jpg"
          alt="Fondo login"
          className="object-cover w-full h-screen"
          style={{ objectPosition: "center center" }}
        />
      </div>

      <div className="w-full md:w-1/2 flex justify-center items-center h-screen bg-gray-400">
        <div className="p-8 bg-white rounded shadow w-80">
          <h2 className="text-lg font-bold mb-4">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              className="w-full mb-2 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full mb-4 p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <div className="text-red-500 mb-2">{error}</div>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2"
            >
              Ingresar
            </button>
          </form>

          <button
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            onClick={() => router.push("/register")}
          >
            Registrarse
          </button>

          <button
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-4"
            onClick={() => (window.location.href = "http://localhost:3001/auth/google")}
          >
            Ingresar con Google
          </button>
        </div>
      </div>
    </main>
  );
}
