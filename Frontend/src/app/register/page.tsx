// Página de registro de usuario.
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/back-api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
  await api.post('/users', { email, name, password }); // dni no se envía ni se requiere
      setSuccess('Usuario registrado correctamente');
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-gray-200">
      <div className="w-1/2 h-screen relative hidden md:flex items-center justify-center overflow-hidden">
        <img
          src="/background-register.jpg"
          alt="Fondo registro"
          className="object-cover w-full h-screen"
          style={{ objectPosition: 'center center' }}
        />
      </div>
      <div className="w-full md:w-1/2 flex justify-center items-center h-screen">
        <form className="p-8 bg-white rounded shadow w-80" onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold mb-4">Registro</h2>
          <input type="email" placeholder="Email" className="w-full mb-2 p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="text" placeholder="Nombre" className="w-full mb-2 p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full mb-2 p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Registrarse</button>
          <button
            type="button"
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 flex items-center justify-center gap-2 mt-4"
            onClick={() => {
              window.location.href = 'http://localhost:3001/auth/google';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" className="inline-block"><path fill="#fff" d="M21.6 12.227c0-.818-.073-1.604-.209-2.364H12v4.482h5.352a4.577 4.577 0 0 1-1.98 3.004v2.497h3.2c1.872-1.724 2.948-4.267 2.948-7.619z"/><path fill="#fff" d="M12 22c2.43 0 4.47-.805 5.96-2.188l-3.2-2.497c-.89.597-2.027.951-3.26.951-2.507 0-4.63-1.694-5.388-3.97H3.01v2.49A9.997 9.997 0 0 0 12 22z"/><path fill="#fff" d="M6.612 13.296a5.996 5.996 0 0 1 0-3.592V7.214H3.01a9.997 9.997 0 0 0 0 9.572l3.602-3.49z"/><path fill="#fff" d="M12 6.58c1.32 0 2.5.454 3.43 1.345l2.572-2.572C16.47 3.805 14.43 3 12 3A9.997 9.997 0 0 0 3.01 7.214l3.602 2.49C7.37 8.274 9.493 6.58 12 6.58z"/></svg>
            Registrarse con Google
          </button>
          <button
            type="button"
            className="w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 mt-2"
            onClick={() => router.push('/')}
          >
            Ir al inicio
          </button>
        </form>
      </div>
    </main>
  );
}
