// Página para login con Google OAuth.
"use client"
import api from '../../services/back-api';

export default function LoginGooglePage() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-300">
      <div className="p-4 bg-white rounded shadow w-80">
        <h2 className="text-lg font-bold mb-4">Login con Google</h2>
        <button
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          onClick={handleGoogleLogin}
        >
          Ingresar con Google
        </button>
      </div>
    </main>
  );
}
