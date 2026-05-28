#!/usr/bin/env bash
# ============================================================
# setup-env.sh — Guía de configuración de servicios
# TALKIE LATAM — Preparación para despliegue en Vercel
# ============================================================
# Uso: bash scripts/setup-env.sh
# Ejecutar desde la raíz del proyecto.
set -e

echo ""
echo "============================================"
echo "  TALKIE LATAM — Configuración de Servicios"
echo "  Guía paso a paso para cada variable de entorno"
echo "============================================"
echo ""

# ── Colores ──────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

section() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

step() {
  echo -e "${GREEN}[✓]${NC} $1"
}

note() {
  echo -e "${YELLOW}[!]${NC} $1"
}

# ── 1. PostgreSQL — Railway ──────────────────────────────
section "1. POSTGRESQL — RAILWAY"

cat << 'EOF'
Railway permite crear una base de datos PostgreSQL gratuita.

PASOS:
  1. Ve a https://railway.app y crea una cuenta (puedes usar GitHub)
  2. Click en "New Project" → "Provision PostgreSQL"
  3. Cuando esté lista, entra en el proyecto → pestaña "Connect"
  4. Copia la variable "DATABASE_URL"

FORMATO:
  postgresql://usuario:password@host:port/nombre_db?sslmode=require

NOTA: Railway ya incluye ?sslmode=require en la URL por defecto.

Como Railway ya incluye sslmode=require, puedes dejarlo
tal cual viene en la URL que te da Railway.

PARA CONFIGURAR EN VERCEL:
  En dashboard de Vercel → tu proyecto → Settings → Environment Variables
  Agrega DATABASE_URL con el valor copiado de Railway.
EOF

step "PostgreSQL en Railway configurado"
echo ""

# ── 2. Upstash Redis ─────────────────────────────────────
section "2. RATE LIMITING — UPSTASH REDIS"

cat << 'EOF'
Upstash Redis se usa para rate limiting y cache de sesiones.

PASOS:
  1. Ve a https://console.upstash.com y regístrate (GitHub login)
  2. Click en "Create Database"
  3. Elige Regional (la más cercana a tus usuarios LATAM)
  4. Quando esté lista, ve a la pestaña "Redis" → copia:
     - REST URL      → UPSTASH_REDIS_REST_URL
     - REST Token    → UPSTASH_REDIS_REST_TOKEN

NOTA: El tier gratuito incluye 10,000 comandos/día, suficiente
para desarrollo y uso moderado en producción.

PARA CONFIGURAR EN VERCEL:
  Dashboard → Settings → Environment Variables:
    UPSTASH_REDIS_REST_URL=...
    UPSTASH_REDIS_REST_TOKEN=...
EOF

step "Upstash Redis configurado"
echo ""

# ── 3. Google OAuth ──────────────────────────────────────
section "3. GOOGLE OAUTH — Console de Google Cloud"

cat << 'EOF'
Configurar Google OAuth permite que usuarios inicien sesión con su cuenta Google.

PASOS:
  1. Ve a https://console.cloud.google.com/apis/credentials
  2. Selecciona o crea un proyecto de Google Cloud
  3. Click en "+ CREAR CREDENCIALES" → "ID de cliente OAuth 2.0"
  4. Configura:
     - Tipo de aplicación: "Aplicación web"
     - Nombre: "Talkie LATAM"
     - URI de redirección autorizada:
         http://localhost:3000/api/auth/callback/google
         https://tu-proyecto.vercel.app/api/auth/callback/google
  5. Click en "Crear" — luego copia:
     - ID de cliente    → GOOGLE_CLIENT_ID
     - Secreto de cliente → GOOGLE_CLIENT_SECRET

NOTA: Habilita primero la API de Google+ desde:
  https://console.cloud.google.com/apis/library/google.googleapis.com

PARA CONFIGURAR EN VERCEL:
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
EOF

step "Google OAuth configurado"
echo ""

# ── 4. OpenRouter API ───────────────────────────────────
section "4. OPENROUTER — Modelos LLM"

cat << 'EOF'
OpenRouter聚合 múltiples proveedores de IA (OpenAI, Anthropic, etc.)
y te da acceso unificado vía API.

PASOS:
  1. Ve a https://openrouter.ai y regístrate
  2. Ve a https://openrouter.ai/keys → "Create Key"
  3. Copia la clave → OPENROUTER_API_KEY

COSTOS:
  - Pagas por uso (por tokens generados)
  - Hay modelos gratuitos disponibles
  - Modelos recomendados para LATAM:
      google/gemini-2.0-flash-thinking-exp (gratis)
      openai/gpt-4o-mini (económico)

PARA CONFIGURAR EN VERCEL:
  OPENROUTER_API_KEY=...
EOF

step "OpenRouter configurado"
echo ""

# ── 5. Replicate API ─────────────────────────────────────
section "5. REPLICATE — Generación de imágenes FLUX"

cat << 'EOF'
Replicate permite usar modelos de generación de imágenes como FLUX.1
sin necesidad de GPUs propias.

PASOS:
  1. Ve a https://replicate.com y regístrate
  2. Ve a https://replicate.com/account/api-tokens
  3. Click en "Create API token" → copia el token
  4. Asígnalo a → REPLICATE_API_TOKEN

NOTA: El tier gratuito tiene límites de uso.
FLUX.1 genera avatares personalizados para cada niño.

PARA CONFIGURAR EN VERCEL:
  REPLICATE_API_TOKEN=...
EOF

step "Replicate API configurado"
echo ""

# ── 6. NEXTAUTH_SECRET ───────────────────────────────────
section "6. NEXTAUTH_SECRET — Generar clave secreta"

cat << 'EOF'
El secreto de NextAuth firma y verifica los tokens de sesión JWT.

COMO GENERARLO (macOS / Linux):
  openssl rand -base64 32

COMO GENERARLO (Windows con Git Bash / WSL):
  openssl rand -base64 32

OTRAS OPCIONES:
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

SEGURIDAD:
  - Usa mínimo 32 caracteres aleatorios
  - Nunca lo compartas ni lo subas a GitHub
  - Genéralo nuevo para cada entorno (desarrollo, producción)
  - En Vercel: el valor en producción DEBE ser diferente al local

PARA CONFIGURAR EN VERCEL:
  Dashboard → Settings → Environment Variables:
    NEXTAUTH_SECRET=valor-generado-aqui
    NEXTAUTH_URL=https://tu-proyecto.vercel.app
EOF

step "NEXTAUTH_SECRET generado"
echo ""

# ── 7. Stripe ───────────────────────────────────────────
section "7. STRIPE — Pagos con tarjeta (suscripciones premium)"

cat << 'EOF'
Stripe procesa pagos con tarjeta para el plan premium de Talkie.

PASOS:
  1. Ve a https://dashboard.stripe.com y regístrate
  2. Ve a Developers → API Keys
     - Para desarrollo: clave de PRUEBA (sk_test_...)
     - Para producción: clave en vivo (sk_live_...)
     - Copia STRIPE_SECRET_KEY

  3. Crea un producto premium:
     Dashboard → Products → Add Product
       Nombre: "Talkie Premium"
       Modelo de precio: Recurrente (mensual/anual)
     Copia el Price ID → STRIPE_PREMIUM_PRICE_ID

  4. Configurar Webhooks:
     Developers → Webhooks → Add endpoint
       URL: https://tu-proyecto.vercel.app/api/webhooks/stripe
       Eventos a escuchar: checkout.session.completed,
                          customer.subscription.created,
                          customer.subscription.updated,
                          customer.subscription.deleted
     Copia el Signing Secret → STRIPE_WEBHOOK_SECRET

DESARROLLO LOCAL (Webhooks):
  Instala Stripe CLI: https://stripe.com/docs/stripe-cli
  Luego ejecuta:
    # En una terminal:
    stripe listen --forward-to localhost:3000/api/webhooks/stripe

PARA CONFIGURAR EN VERCEL:
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PREMIUM_PRICE_ID=price_...
EOF

note "Usa keys de PRueba (sk_test_) durante desarrollo"
echo ""

# ── 8. Mercado Pago ─────────────────────────────────────
section "8. MERCADOPAGO — Pagos locales LATAM"

cat << 'EOF'
Mercado Pago permite pagos locales en Argentina, Brasil, México y más.

PASOS:
  1. Ve a https://www.mercadopago.com/developers
  2. Regístrate como vendedor
  3. Crea una aplicación en:
     https://www.mercadopago.com/developers/panel/app
  4. En la app → Configuración:
     - Modo de prueba / Producción según necesites
     - Agrega como URL de notificación:
       https://tu-proyecto.vercel.app/api/webhooks/mercadopago
  5. En Credenciales copia:
     - Access Token → MERCADOPAGO_ACCESS_TOKEN

  6. Para el Webhook Secret:
     Ve a Tu app → Webhooks
     Copia el Merchant Token → MERCADOPAGO_WEBHOOK_SECRET

PAÍSES SOPORTADOS:
  Argentina 🇦🇷  Brasil 🇧🇷  México 🇲🇽  Chile 🇨🇱
  Colombia 🇨🇴  Perú 🇵🇪  Uruguay 🇺🇾 y más

PARA CONFIGURAR EN VERCEL:
  MERCADOPAGO_ACCESS_TOKEN=...
  MERCADOPAGO_WEBHOOK_SECRET=...
EOF

note "Usa tokens de PRueba (TEST) durante desarrollo"
echo ""

# ── 9. Storage ───────────────────────────────────────────
section "9. ALMACENAMIENTO — Vercel Blob o Cloudflare R2"

cat << 'EOF'
Necesitas storage para guardar avatares subidos, audios y archivos.

OPCION A — Vercel Blob (recomendado para部署 en Vercel):
  1. Ve a https://vercel.com/docs/storage/vercel-blob
  2. En tu proyecto Vercel → Storage → Create Blob Store
  3. Nombra tu store y copia:
     - BLOB_READ_WRITE_TOKEN

OPCION B — Cloudflare R2 (alternativa sin vendor lock-in):
  1. Ve a https://dash.cloudflare.com/r2
  2. Crea una cuenta y un bucket R2
  3. Ve a Manage R2 API Tokens → Create API Token
  4. Usa el token generado como BLOB_READ_WRITE_TOKEN

NOTA: Ambos tienen tier gratuito generoso.

PARA CONFIGURAR EN VERCEL:
  BLOB_READ_WRITE_TOKEN=...
EOF

step "Storage configurado"
echo ""

# ── Config final ────────────────────────────────────────
section "CONFIGURACIÓN EN VERCEL"

cat << 'EOF'
PASOS FINALES:
  1. Ve a https://vercel.com → tu proyecto → Settings → Environment Variables
  2. Agrega TODAS las variables de entorno
  3. Asegúrate de usar valores de PRODUCCION (no test)
  4. En Variables de entorno puedes elegir entre:
     - Production  → solo en producción
     - Preview     → para branches de preview
     - Development  → para desarrollo local (pull env)

DESARROLLO LOCAL:
  1. Copia .env.local.example a .env.local
  2. Llena cada variable con los valores de arriba
  3. Ejecuta: npm run dev

GENERAR .env.local desde .env.example:
  # Copia y llena los valores:
  cp .env.example .env.local

RESUMEN DE VARIABLES REQUERIDAS:
  ✅ DATABASE_URL
  ✅ NEXTAUTH_URL
  ✅ NEXTAUTH_SECRET
  ✅ GOOGLE_CLIENT_ID
  ✅ GOOGLE_CLIENT_SECRET
  ✅ OPENROUTER_API_KEY
  ✅ REPLICATE_API_TOKEN
  ✅ UPSTASH_REDIS_REST_URL
  ✅ UPSTASH_REDIS_REST_TOKEN
  ✅ BLOB_READ_WRITE_TOKEN
  ✅ STRIPE_SECRET_KEY
  ✅ STRIPE_WEBHOOK_SECRET
  ✅ STRIPE_PREMIUM_PRICE_ID
  ✅ MERCADOPAGO_ACCESS_TOKEN
  ✅ MERCADOPAGO_WEBHOOK_SECRET
  ✅ NEXT_PUBLIC_APP_URL
  ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
EOF

step "Configuración de servicios completada"
echo ""
echo -e "${GREEN}✅ Todo listo para desplegar en Vercel!${NC}"
echo ""
echo "Próximos pasos:"
echo "  1. npm install"
echo "  2. cp .env.example .env.local  # completar valores"
echo "  3. npm run dev                  # probar localmente"
echo "  4. Deploy en Vercel con las Environment Variables configuradas"
echo ""
