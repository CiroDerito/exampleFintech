// Componente LoginForm
// Renderiza el formulario de login y gestiona el estado de usuario y errores.
"use client";
import { useState } from 'react';
import { useAppStore } from '../store';
import api from '../services/back-api';
import Link from 'next/link';

export default function LoginForm() {
  const setUser = useAppStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      localStorage.setItem('access_token', res.data.access_token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="p-4 bg-white rounded shadow w-80" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-4">Iniciar sesión</h2>
      <input
        type="email"
        placeholder="Email"
        className="w-full mb-2 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="w-full mb-2 p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}
