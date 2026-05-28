"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CheckoutButtonProps {
  plan: "monthly" | "annual";
  provider: "stripe" | "mercadopago";
  variant?: "primary" | "secondary";
}

function CheckoutButton({ plan, provider, variant = "primary" }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al procesar la solicitud");
        return;
      }

      // Handle Stripe checkout response
      if (data.url) {
        window.location.href = data.url;
      }
      // Handle Mercado Pago checkout response
      else if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses =
    "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
      : "bg-white/10 border border-white/20 text-white hover:bg-white/20";

  const providerLabel = provider === "stripe" ? "Stripe" : "Mercado Pago";

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Procesando...
        </span>
      ) : (
        <>
          <span>Pagar con {providerLabel}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </>
      )}
    </button>
  );
}

const benefits = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Mensajes Ilimitados",
    description: "Sin límite de 50 mensajes por día. Chatea todo lo que quieras.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: "Personajes Premium",
    description: "Accede a personajes exclusivos disponibles solo para miembros premium.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Acceso Anticipado",
    description: "Sé el primero en probar nuevas funciones antes que nadie.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "Sin Publicidad",
    description: "Disfruta de una experiencia limpia y sin interrupciones.",
  },
];

const faqs = [
  {
    question: "¿Puedo cancelar mi suscripción en cualquier momento?",
    answer: "Sí, puedes cancelar tu suscripción cuando quieras desde la página de facturación. Seguirás teniendo acceso premium hasta el final del período que ya pagaste.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito y débito a través de Stripe. Para Latinoamérica también puedes pagar con Mercado Pago, que incluye opciones como tarjetas de débito, crédito y pagos en efectivo.",
  },
  {
    question: "¿Qué pasa si cambio de opinión después de suscribirme?",
    answer: "Tienes 7 días para solicitar un reembolso si no estás satisfecho. Contáctanos en soporte@talkielatam.com.",
  },
  {
    question: "¿Puedo cambiar de plan mensual a anual?",
    answer: "Sí, puedes cambiar tu plan en cualquier momento. Si actualizas a un plan anual, el costo mensual restante se aplicará como crédito.",
  },
  {
    question: "¿Los personajes premium son permanentes?",
    answer: "Mientras mantengas tu suscripción activa, tendrás acceso a todos los personajes premium. Si cancelas, perderás acceso a ellos.",
  },
];

export default function PremiumPage() {
  const { data: session, status } = useSession();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  const handleGetStarted = () => {
    if (!session) {
      router.push("/auth/login?callbackUrl=/premium");
      return;
    }
    // Scroll to pricing
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#1A1033] text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-[#1A1033] to-[#1A1033]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Miembro Premium
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Potencia tu experiencia con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Premium
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Desbloquea mensajes ilimitados, personajes exclusivos y funciones
            avanzadas para llevar tus conversaciones al siguiente nivel.
          </p>

          <button
            onClick={handleGetStarted}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {session ? "Obtener Premium" : "Iniciar Sesión para Comenzar"}
          </button>

          {/* Benefits Grid */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Elige tu plan Premium
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Comienza con una prueba gratuita hoy y desbloquea todo el potencial de
          Talkie LATAM.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly Plan */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative">
            <h3 className="text-xl font-semibold mb-2">Premium Mensual</h3>
            <p className="text-gray-400 text-sm mb-6">Pago mensual, cancela cuando quieras</p>

            <div className="mb-6">
              <span className="text-4xl font-bold">$4.99</span>
              <span className="text-gray-400">/mes</span>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Mensajes ilimitados</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Personajes premium exclusivos</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Acceso anticipado a funciones</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Sin publicidad</span>
              </li>
            </ul>

            <div className="space-y-3">
              <CheckoutButton plan="monthly" provider="stripe" />
              <CheckoutButton plan="monthly" provider="mercadopago" variant="secondary" />
            </div>
          </div>

          {/* Annual Plan */}
          <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-900/40 to-pink-900/20 border border-purple-500/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold">
              Mejor Valor
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold">Premium Anual</h3>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                Ahorra 33%
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Ahorra $20 vs el plan mensual</p>

            <div className="mb-2">
              <span className="text-4xl font-bold">$39.99</span>
              <span className="text-gray-400">/año</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Equivalent a $3.33/mes
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Todo lo del plan mensual</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">2 meses gratis</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Prioridad en soporte</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Acceso anticipado a eventos</span>
              </li>
            </ul>

            <div className="space-y-3">
              <CheckoutButton plan="annual" provider="stripe" />
              <CheckoutButton plan="annual" provider="mercadopago" variant="secondary" />
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Ambos planes incluyen prueba gratuita de 7 días. Cancela cuando quieras.
        </p>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Lo que dicen nuestros miembros
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "María G.",
              avatar: "MG",
              text: "Los personajes premium son increíbles. La calidad de las conversaciones es mucho mejor.",
              plan: "Premium Anual",
            },
            {
              name: "Carlos R.",
              avatar: "CR",
              text: "Sin límites de mensajes changed everything for me. I can chat for hours with my favorite characters.",
              plan: "Premium Mensual",
            },
            {
              name: "Ana L.",
              avatar: "AL",
              text: "El acceso anticipado a nuevas funciones vale cada centavo. Siempre estoy un paso adelante.",
              plan: "Premium Anual",
            },
          ].map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-xs text-purple-400">{testimonial.plan}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#1A1033]"
                />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              Más de <span className="text-white font-semibold">10,000+</span> miembros activos
            </span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Preguntas Frecuentes
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    openFaq === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-r from-purple-900/50 to-pink-900/30 border border-purple-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.3),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para llevar tu experiencia al siguiente nivel?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Únete a miles de usuarios que ya disfrutan de Premium y descubre
              todo lo que Talkie LATAM puede ofrecerte.
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 Talkie LATAM. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="/terminos" className="hover:text-white transition-colors">
              Términos de Servicio
            </a>
            <a href="/privacidad" className="hover:text-white transition-colors">
              Política de Privacidad
            </a>
            <a href="/soporte" className="hover:text-white transition-colors">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
