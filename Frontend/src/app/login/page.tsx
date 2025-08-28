"use client";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const setUser = useAppStore((s) => s.setUser);

  const doLogin = async () => {
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      // limpiar sesión previa
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      localStorage.removeItem("session_expires_at");

      // 1) login
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      const { access_token, refresh_token, user } = res.data;

      // 2) guardar tokens primero
      localStorage.setItem("access_token", access_token);
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
      if (user.last_login) localStorage.setItem("last_login", user.last_login);

      // 3) traer usuario COMPLETO (con relaciones) y guardarlo en el store
      const userResp = await api.get(`/users/${user.id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      setUser(userResp.data);

      toast.success("Bienvenido");

      // 4) tareas en background (no bloquean navegación)
      setTimeout(async () => {
        try {
          const { getMetaMetricsDiffLogin, getTiendaNubeMetricsDiffLogin } =
            await import("../../services/back-api");
          getMetaMetricsDiffLogin(user.id);
          getTiendaNubeMetricsDiffLogin(user.id);
        } catch {}
      }, 3000);

      // 5) navegación dura (lo que te funciona mejor)
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Credenciales inválidas");
      setLoading(false);
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

          {/* Evitamos submit del form; el flujo vive en onClick */}
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Email"
              className="w-full mb-2 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full mb-4 p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
            {error && <div className="text-red-500 mb-2">{error}</div>}

            <button
              type="button"
              onClick={doLogin}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-2 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <button
            className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            onClick={() => (window.location.href = "/register")}
            disabled={loading}
          >
            Registrarse
          </button>

          <button
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-4"
            onClick={() => (window.location.href = "http://localhost:3001/auth/google")}
            disabled={loading}
          >
            Ingresar con Google
          </button>
        </div>
      </div>
    </main>
  );
}
