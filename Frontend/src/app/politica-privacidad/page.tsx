import React from "react";

export default function TerminosPrivacidadPage() {
  return (
    <main className="min-h-screen bg-gray-200 flex flex-col items-center py-10 px-4" id="terminos">
      <section className="max-w-3xl w-full bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Términos y Condiciones de Uso y Política de Privacidad de Loopi
        </h1>
        <p className="text-gray-600 mb-6">Última actualización: 26/08/2025</p>

        <ol className="space-y-6">
          <li>
            <span className="font-bold text-red-600">1. Introducción</span>
            <p className="text-gray-700">
              Lea atentamente los siguientes términos y condiciones de uso (los
              “Términos”) y la política de privacidad incorporada, ya que rigen
              el uso de (incluido el acceso a) los servicios ofrecidos por Loopi
              S.A. (“Loopi”, “nosotros” o “nuestro/a”), incluidos todos nuestros
              sitios web, aplicaciones, APIs, integraciones y cualquier otro
              producto o funcionalidad relacionada con nuestra plataforma de
              análisis de datos y financiamiento para comercios.
            </p>
            <p className="text-gray-700 mt-2">
              El uso de los Servicios de Loopi implica la aceptación total de
              estos Términos. Si no está de acuerdo con los mismos, no debe
              utilizar la plataforma Loopi ni ningún contenido, herramienta o
              producto asociado.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              2. El servicio Loopi que proporcionamos
            </span>
            <p className="text-gray-700">
              Loopi es una plataforma digital que ofrece servicios de análisis
              de datos, generación de indicadores de performance, cálculo de
              riesgo crediticio y provisión de líneas de financiamiento para
              comercios o titulares de tiendas online.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Conexión e integración con plataformas de datos de negocio.</li>
              <li>Acceso a un score crediticio dinámico (“Loopi Score”).</li>
              <li>Visualización de métricas y reportes.</li>
              <li>
                Ofertas personalizadas de financiamiento (adelantos, créditos,
                pagos programados).
              </li>
              <li>Gestión de pagos, vencimientos y simulaciones.</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Loopi puede ofrecer diferentes modalidades de servicio (gratuito,
              pago, promocional, por suscripción) y se reserva el derecho de
              modificar o suspender temporal o definitivamente partes del
              servicio sin previo aviso, siempre que se respeten los derechos
              del usuario conforme la ley aplicable.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              3. Requisitos de uso e idoneidad
            </span>
            <p className="text-gray-700">
              Para utilizar Loopi usted debe:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Ser mayor de edad según la legislación de su país.</li>
              <li>Tener capacidad legal para contratar.</li>
              <li>Ser titular o representante legal de un comercio registrado.</li>
              <li>Aceptar expresamente estos Términos.</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Al registrarse, usted garantiza que la información proporcionada
              es verdadera, completa y actualizada. En caso de representar a una
              empresa o marca, declara contar con autorización para aceptar estos
              términos en su nombre.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              4. Integración con plataformas externas y fuentes de datos
            </span>
            <p className="text-gray-700">
              Loopi accede a información proveniente de múltiples plataformas
              conectadas, con autorización explícita del usuario, para evaluar
              el rendimiento del negocio y calcular riesgos crediticios. Las
              integraciones actuales o potenciales incluyen:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>
                <span className="font-semibold">Plataformas de eCommerce:</span>{" "}
                WooCommerce, Tiendanube, Shopify, VTEX, Magento, PrestaShop.
              </li>
              <li>
                <span className="font-semibold">Plataformas de publicidad:</span>{" "}
                Meta Ads, Google Ads, TikTok Ads, YouTube Ads, Twitter Ads,
                LinkedIn Ads.
              </li>
              <li>
                <span className="font-semibold">Analítica:</span> Google
                Analytics 4, Meta Pixel, TikTok Pixel, Google Tag Manager.
              </li>
              <li>
                <span className="font-semibold">Procesadores de pago:</span>{" "}
                Mercado Pago, PayU, Stripe, Getnet, TodoPago, NaranjaX, Kushki,
                Decidir, Ualá Bis.
              </li>
              <li>
                <span className="font-semibold">Logística:</span> Shipnow,
                Andreani, Envíopack, OCA ePack, Moova.
              </li>
              <li>
                <span className="font-semibold">
                  Bancos y entidades financieras:
                </span>{" "}
                API del BCRA, CBU/Alias bancaria, cheques rechazados (BCRA),
                información tributaria pública (AFIP), registros de facturación.
              </li>
            </ul>
            <p className="text-gray-700 mt-2">
              El acceso a cualquiera de estas fuentes se realiza únicamente con
              consentimiento del usuario, quien mantiene control total sobre las
              conexiones habilitadas.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              5. Uso permitido del servicio
            </span>
            <p className="text-gray-700">
              Loopi otorga una licencia limitada, no exclusiva, revocable e
              intransferible para acceder y utilizar el servicio con fines
              personales o comerciales, sin derecho a revender, sublicenciar,
              modificar o redistribuir.
            </p>
            <p className="text-gray-700 mt-2">No está permitido:</p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>
                Realizar ingeniería inversa o intentar acceder al código fuente.
              </li>
              <li>Usar datos o el sistema para construir servicios competidores.</li>
              <li>Manipular el score o dar información falsa.</li>
              <li>Usar Loopi para fines ilegales o no autorizados.</li>
            </ul>
          </li>

          <li>
            <span className="font-bold text-red-600">6. Propiedad intelectual</span>
            <p className="text-gray-700">
              Todos los elementos de la plataforma Loopi son propiedad exclusiva
              de Loopi S.A., protegidos por la legislación nacional e
              internacional. El uso del servicio no otorga ningún derecho de
              propiedad intelectual más allá del expresamente concedido.
            </p>
          </li>

          <li id="privacidad">
            <span className="font-bold text-red-600">
              7. Privacidad y protección de datos
            </span>
            <p className="text-gray-700">
              <strong>Datos recopilados:</strong> información identificatoria,
              comercial, transaccional, técnica de navegación.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Usos:</strong> evaluar tu negocio, calcular tu Loopi
              Score, determinar ofertas de financiamiento, brindar soporte y
              cumplir obligaciones legales.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Compartimos datos con:</strong> proveedores de tecnología,
              entidades financieras aliadas, autoridades regulatorias. Nunca
              vendemos tus datos.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Seguridad:</strong> almacenamos datos en servidores
              seguros, aplicamos estándares internacionales y conservamos la
              información sólo el tiempo necesario.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Derechos:</strong> podés ejercerlos escribiendo a{" "}
              <a
                href="mailto:legal@loopi.com"
                className="text-blue-600 underline"
              >
                legal@loopi.com
              </a>
              .
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">8. Términos financieros</span>
            <p className="text-gray-700">
              Cuando se te ofrezca una línea de crédito recibirás un contrato
              específico con detalle de tasas, plazos y condiciones. La
              aceptación implica compromiso legal. Loopi podrá consultar y
              reportar tu comportamiento de pago a fuentes públicas de crédito.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              9. Cancelación, suspensión y terminación
            </span>
            <p className="text-gray-700">
              Podés cancelar tu cuenta en cualquier momento desde tu perfil o
              escribiendo a{" "}
              <a
                href="mailto:soporte@loopi.com"
                className="text-blue-600 underline"
              >
                soporte@loopi.com
              </a>
              . Loopi podrá suspender cuentas por incumplimiento, fraude o
              requerimiento legal.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              10. Limitación de responsabilidad
            </span>
            <p className="text-gray-700">
              Loopi no garantiza que el servicio esté libre de errores ni que el
              Loopi Score refleje completamente la situación financiera. No es
              responsable por decisiones de negocio tomadas en base al servicio.
              La responsabilidad de Loopi nunca excederá lo abonado por el
              usuario en los últimos 12 meses.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              11. Ley aplicable y jurisdicción
            </span>
            <p className="text-gray-700">
              Este acuerdo se rige por las leyes de la República Argentina. Las
              disputas se resolverán en tribunales ordinarios de la Ciudad
              Autónoma de Buenos Aires.
            </p>
          </li>

          <li>
            <span className="font-bold text-red-600">
              12. Cambios a estos Términos
            </span>
            <p className="text-gray-700">
              Loopi puede modificar estos Términos en cualquier momento. Los
              cambios se comunicarán en la plataforma. Si continuás usando el
              servicio luego de los cambios, se considerará que los aceptás.
            </p>
          </li>
        </ol>

        <div className="mt-8 text-right text-gray-400 text-sm">Loopi S.A.</div>
      </section>
    </main>
  );
}
