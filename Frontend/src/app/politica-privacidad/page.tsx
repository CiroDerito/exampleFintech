import React from "react";

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4">
      <section className="max-w-2xl w-full bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Política de Privacidad</h1>
        <p className="text-gray-600 mb-6">Última actualización: 27/08/2025</p>
        <ol className="space-y-6">
          <li>
            <span className="font-bold text-red-600">1. Responsable del tratamiento</span>
            <p className="text-gray-700">
              Loopi S.A. (en adelante, “Loopi”) es responsable del tratamiento de los datos personales 
              recabados a través de nuestra plataforma. Nos comprometemos a garantizar la confidencialidad, 
              seguridad y uso adecuado de tu información.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">2. Datos de contacto</span>
            <p className="text-gray-700">
              Puedes contactarnos para consultas relacionadas con privacidad en:{" "}
              <a href="mailto:privacidad@loopi.com" className="text-blue-600 underline">
                privacidad@loopi.com
              </a> &nbsp; (cambiar por otro email)
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">3. Datos que recopilamos</span>
            <p className="text-gray-700">
              Recopilamos y tratamos los siguientes tipos de datos:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Datos de identificación: nombre, correo electrónico, DNI.</li>
              <li>Datos de acceso: credenciales de usuario, tokens de sesión.</li>
              <li>Datos de uso de la plataforma: navegación, conexiones a fuentes externas (TiendaNube, Meta Ads, Google, etc.).</li>
              <li>Datos financieros y comerciales necesarios para el análisis de score y gestión de servicios fintech.</li>
            </ul>
          </li>

          <li>
            <span className="font-bold text-red-600">4. Finalidad del tratamiento</span>
            <p className="text-gray-700">
              Utilizamos tus datos para:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Crear y administrar tu cuenta Loopi.</li>
              <li>Conectar y gestionar fuentes de datos externas.</li>
              <li>Generar reportes analíticos y tu score financiero/comercial.</li>
              <li>Ofrecer recomendaciones personalizadas y servicios financieros.</li>
              <li>Cumplir con obligaciones legales y regulatorias aplicables al sector fintech.</li>
            </ul>
          </li>

          <li>
            <span className="font-bold text-red-600">5. Cesión y destinatarios de datos</span>
            <p className="text-gray-700">
              Compartiremos tus datos únicamente con:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Proveedores tecnológicos que permiten el funcionamiento de Loopi (ej. hosting, bases de datos, APIs de terceros).</li>
              <li>Plataformas externas que tú decidas conectar (TiendaNube, Meta Ads, Google, etc.).</li>
              <li>Autoridades competentes cuando sea requerido por ley.</li>
            </ul>
          </li>

          <li>
            <span className="font-bold text-red-600">6. Transferencias internacionales</span>
            <p className="text-gray-700">
              Si fuera necesario transferir datos a servidores ubicados fuera de tu país de residencia, 
              garantizamos que dichas transferencias cumplirán con los estándares de seguridad y protección 
              exigidos por la normativa aplicable.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">7. Plazos de conservación</span>
            <p className="text-gray-700">
              Conservaremos tus datos mientras mantengas una cuenta activa en Loopi y, posteriormente, 
              el tiempo estrictamente necesario para cumplir con obligaciones legales o resolver disputas.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">8. Derechos de los usuarios</span>
            <p className="text-gray-700">
              Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, portabilidad 
              y limitación escribiendo a{" "}
              <a href="mailto:privacidad@loopi.com" className="text-blue-600 underline">
                privacidad@loopi.com
              </a>.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">9. Seguridad de la información</span>
            <p className="text-gray-700">
              Implementamos medidas técnicas y organizativas adecuadas para proteger tu información 
              frente a accesos no autorizados, pérdida, alteración o divulgación.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">10. Actualizaciones de esta política</span>
            <p className="text-gray-700">
              Loopi podrá modificar esta Política de Privacidad para adaptarla a cambios normativos 
              o mejoras en nuestros servicios. Notificaremos a los usuarios sobre cambios relevantes.
            </p>
          </li>
        </ol>
        <div className="mt-8 text-right text-gray-400 text-sm">Loopi S.A.</div>
      </section>
    </main>
  );
}
