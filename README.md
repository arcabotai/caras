# Talkie LATAM

Chat con personajes de IA para la comunidad hispanohablante de LATAM.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + Shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Railway) + Drizzle ORM |
| Auth | NextAuth v5 (Credentials + Google OAuth) |
| AI | OpenRouter (DeepSeek V3 as default) |
| Storage | Vercel Blob / Cloudflare R2 |
| Infra | Vercel + Railway |

## Getting Started

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
OPENROUTER_API_KEY=sk-or-...

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 3. Database Setup

```bash
# Generate migrations
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth handlers
│   │   ├── auth/register/route.ts       # User registration
│   │   ├── chat/route.ts                # AI chat endpoint (SSE)
│   │   └── characters/route.ts          # Character CRUD
│   ├── auth/
│   │   ├── login/page.tsx                # Login page
│   │   └── register/page.tsx            # Registration page
│   ├── chat/[id]/page.tsx                # Chat with character
│   ├── create/page.tsx                   # Character creator
│   ├── discover/page.tsx                 # Browse characters
│   ├── page.tsx                          # Landing page
│   └── layout.tsx                        # Root layout
├── components/
│   ├── ui/                               # Shadcn components
│   ├── character-card.tsx                # Character card component
│   └── hero-section.tsx                  # Landing hero
├── lib/
│   ├── ai/openrouter.ts                  # OpenRouter integration
│   ├── auth/index.ts                     # NextAuth config
│   ├── constants.ts                      # App constants
│   ├── db/index.ts                       # Drizzle client
│   ├── db/schema.ts                      # Database schema
│   └── ratelimit.ts                      # Rate limiting
└── types/
    └── next-auth.d.ts                    # NextAuth type extensions
```

## Features

### Phase 1 ✓
- Landing page with featured characters
- Character discovery with search & filters
- Real-time AI chat (SSE streaming)
- User authentication (email/password + Google)
- Character creator (custom prompts + avatar)
- PWA support (installable)

### Coming Soon
- Character memory (AI remembers across sessions)
- WhatsApp integration
- Mobile apps (iOS/Android)
- Premium subscription (Mercado Pago)
- Community feed & social features

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message, stream AI response |
| GET | `/api/characters` | List characters (with filters) |
| POST | `/api/characters` | Create new character |
| POST | `/api/auth/register` | Register new user |

## Character Prompt Guide

Write detailed prompts for better conversations:

```
[Character Name] es [description].

Personalidad:
- trait 1
- trait 2

Historia:
[background]

Forma de hablar:
[tone, expressions, language style]

Nota: El personaje NO sabe que es una IA. Responde de forma natural.
```

## Deployment

### Vercel (Frontend + API)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Railway (Database)

1. Create PostgreSQL instance
2. Get connection string
3. Add to Vercel environment variables
4. Run `npx drizzle-kit push` to push schema

## License

Proprietary - © 2026 Talkie LATAM