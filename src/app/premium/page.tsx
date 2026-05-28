import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Desbloquea todas las funciones premium de Talkie LATAM. Chats ilimitados, personajes exclusivos, avatares IA avanzados y más.",
  keywords: [
    "premium",
    "suscripción",
    "plan premium",
    "funciones premium",
    "chat ilimitado",
    "personajes exclusivos",
    "avance IA premium",
    "beneficios premium",
  ],
  openGraph: {
    title: "Premium | Talkie LATAM",
    description:
      "Desbloquea todas las funciones premium. Chats ilimitados, personajes exclusivos, avatares IA avanzados y más.",
    images: [{ url: "/api/og?title=Premium", width: 1200, height: 630 }],
  },
};

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          <span className="inline-block px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            Miembro Premium
          </span>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Potencia tu experiencia con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Premium
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Accede a funciones exclusivas, personajes premium y herramientas avanzadas
            para personalizar tu experiencia al máximo.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Basic */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-gray-300">Básico</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> 50 mensajes al día
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Personajes públicos
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Crear 3 personajes
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Avatar básico
              </li>
            </ul>
          </div>

          {/* Premium - Recommended */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-900/40 to-pink-900/20 border border-purple-500/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
              Recomendado
            </div>

            <h3 className="text-lg font-semibold text-white">Premium</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-gray-400">/mes</span>
            </div>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-white">
                <span className="text-purple-400">✓</span> Mensajes ilimitados
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-purple-400">✓</span> Todos los personajes
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-purple-400">✓</span> Personajes exclusivos
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-purple-400">✓</span> Avatares IA avanzados
              </li>
              <li className="flex items-center gap-2 text-white">
                <span className="text-purple-400">✓</span> Prioridad en respuestas
              </li>
            </ul>

            <button className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-opacity">
              Activar Premium
            </button>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold text-gray-300">Pro</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">$19.99</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Todo lo de Premium
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Personajes ilimitados
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> API de generación
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Estadísticas avanzadas
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-purple-400">✓</span> Soporte prioritario
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Beneficios Exclusivos</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="font-semibold mb-2">Chats Ilimitados</h3>
            <p className="text-sm text-gray-500">
              Sin límite de mensajes. Conversa todo lo que quieras con tus personajes favoritos.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-2xl mb-4">
              ✨
            </div>
            <h3 className="font-semibold mb-2">Personajes Exclusivos</h3>
            <p className="text-sm text-gray-500">
              Accede a personajes premium creados especialmente para miembros.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl mb-4">
              🎨
            </div>
            <h3 className="font-semibold mb-2">Avatares IA Avanzados</h3>
            <p className="text-sm text-gray-500">
              Genera avatares únicos con modelos de IA de última generación.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl mb-4">
              ⚡
            </div>
            <h3 className="font-semibold mb-2">Respuestas Rápidas</h3>
            <p className="text-sm text-gray-500">
              Prioridad en el procesamiento para respuestas más veloces.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>

        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2">¿Puedo cancelar mi suscripción?</h3>
            <p className="text-gray-400">
              Sí, puedes cancelar en cualquier momento desde tu perfil. Seguirás teniendo acceso
              hasta el final del período contratado.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2">¿Qué métodos de pago aceptan?</h3>
            <p className="text-gray-400">
              Aceptamos tarjetas de crédito, débito y PayPal. Próximamente añadiremos más
              opciones incluyendo criptocurrency.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2">¿Hay descuento para pagos anuales?</h3>
            <p className="text-gray-400">
              ¡Sí! Al pagar anualmente ahorras un 20%. Es la mejor opción para fans comprometido.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          ¿Listo para levar tu experiencia al siguiente nivel?
        </h2>
        <p className="text-gray-400 mb-8">
          Únete a miles de usuarios que ya disfrutan de Premium
        </p>
        <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:opacity-90 transition-opacity">
          Comenzar Ahora
        </button>
      </section>
    </div>
  );
}