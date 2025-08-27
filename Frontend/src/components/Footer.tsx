import Link from "next/link";

export default function Footer() {
  return (
  <footer className="bg-gray-50 mt-0 py-6 px-4 text-gray-700">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-start gap-16 text-center md:text-left">
        <div className="flex-1">
          <h3 className="font-bold mb-2">Sobre nosotros</h3>
          <ul className="space-y-1 text-sm">
            <li>Nosotros</li>
            <li>Clientes</li>
            <li>Servicios</li>
            <li>Más vendidos</li>
            <li>Blog</li>
            <li>Contacto</li>
          </ul>
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-2">Legal</h3>
          <ul className="space-y-1 text-sm">
            <li>Términos y condiciones</li>
            <li>
              <Link href="/politica-privacidad" className="hover:underline text-blue-600">Política de Privacidad</Link>
            </li>
            <li>Legalidad</li>
            <li>Licencia de autor</li>
          </ul>
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-2">Suscríbete</h3>
          <p className="text-sm mb-2">Recibe novedades y ofertas exclusivas.</p>
          <form className="flex gap-2 justify-center md:justify-start">
            <input type="email" placeholder="Tu e-mail" className="px-3 py-2 rounded border w-full max-w-xs" />
            <button type="submit" className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700">Enviar</button>
          </form>
        </div>
      </div>
      <div className="max-w-4xl mx-auto text-center mt-8 text-xs text-gray-400">
        <span>© 2025 Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
