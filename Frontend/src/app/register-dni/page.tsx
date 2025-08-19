// Página para completar el DNI si el usuario lo tiene vacío o null
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../components/Navbar";

export default function RegisterDniPage() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    const email = localStorage.getItem("email");
    if (!access_token || !email) {
      router.replace("/dashboard");
      return;
    }
    axios.get(`http://localhost:3001/users/by-email/${encodeURIComponent(email)}`)
      .then(res => {
        const user = res.data;
        if (user?.dni === null) {
          setUserId(user.id);
        } else {
          router.replace("/");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!userId) {
      setError("No se encontró el ID de usuario. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }
    if (!dni || dni.length < 7 || /\D/.test(dni)) {
      setError("El DNI debe tener al menos 7 dígitos numéricos sin puntos ni letras.");
      setLoading(false);
      return;
    }
    try {
      await axios.patch(`http://localhost:3001/users/${userId}/dni`, {
        dni: Number(dni),
      });
      router.replace("/");
    } catch (err: any) {
      setError("Error al actualizar DNI. Verifica el valor o intenta nuevamente.");
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <form className="bg-white p-8 rounded shadow w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">Completa tu DNI</h2>
          <p className="mb-4">Para continuar, ingresa tu DNI.</p>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="DNI"
            value={dni}
            min={1000000}
            onChange={e => setDni(e.target.value.replace(/\D/g, ""))}
            required
          />
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Finalizar registro"}
          </button>
        </form>
      </main>
    </>
  );
}
