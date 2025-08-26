"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAppStore } from "../store";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);

  const isActive = useCallback(
    (href: string) =>
      pathname === href ? "underline underline-offset-4" : "hover:underline",
    [pathname]
  );

  const handleLogout = useCallback(() => {
    useAppStore.getState().logout();
    router.push("/");
  }, [router]);



  return (
    <nav
      className="
        sticky top-0 z-50
        bg-gray-700/80 backdrop-blur-md text-white
        px-6 h-14
        flex justify-between items-center
        w-full shadow-lg
      "
      role="navigation"
      aria-label="Main Navigation"
    >
      <Link href="/" className="font-bold text-lg sm:text-xl hover:underline focus:underline" aria-label="Ir al inicio">
        Loopi
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>

            {/* Link a inicio */}
            <Link href="/" className={isActive("/")}>
              Inicio
            </Link>
            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1 rounded text-white/90 hover:text-white transition"
              aria-label="Cerrar sesión"
            >
              Logout
            </button>
                {/* Icono de perfil → /dashbord-user (solo con sesión) */}
            <Link
              href="/dashbord-user"
              className={`inline-flex items-center justify-center rounded-full p-0.5
                          hover:ring-2 ring-white/60 transition
                          ${pathname === "/dashbord-user" ? "ring-2" : ""}`}
              aria-label="Ir a mi perfil"
              title="Mi perfil"
            >
              <Image
                src="/icons/profile-icon.png"
                alt="Perfil"
                width={28}
                height={28}
                priority={false}
              />
            </Link>
          </>
        ) : (
          <Link href="/login" className={isActive("/login")}>
            Iniciar Sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
