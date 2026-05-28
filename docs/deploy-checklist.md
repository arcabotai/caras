# Deploy Checklist — Talkie LATAM

## Pre-deploy (local verification)

```bash
# 1. TypeScript
npx tsc --noEmit

# 2. Build
npm run build

# 3. Run E2E tests (requires app running)
npm run dev &
sleep 5
npm run test:e2e
```

## Vercel Project Setup

```bash
# Login
npx vercel login

# Link project (run in repo root)
npx vercel link

# Set environment variables in Vercel dashboard
# Settings → Environment Variables
```

## Environment Variables — Vercel Dashboard

### Required (production)
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://...` from Railway |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | from openrouter.ai/keys |
| `UPSTASH_REDIS_REST_URL` | from Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash console |
| `BLOB_READ_WRITE_TOKEN` | from Vercel Blob or R2 |

### Stripe
| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | from Stripe CLI after first deploy |
| `STRIPE_PRICE_MONTHLY` | `price_...` from Stripe dashboard |
| `STRIPE_PRICE_ANNUAL` | `price_...` from Stripe dashboard |

### Mercado Pago
| Variable | Value |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | from mercadopago.com/developers |
| `MERCADOPAGO_WEBHOOK_SECRET` | set after first deploy |

### Google OAuth
| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |

### Public (client-safe)
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

## After First Deploy — Stripe Webhook

```bash
# Install Stripe CLI if not present
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Or use the URL from Vercel:
stripe listen --forward-to your-project.vercel.app/api/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET` in Vercel.

## After First Deploy — Mercado Pago Webhook

1. Go to Mercado Pago Developer Panel → Your app → Webhooks
2. Set production URL: `https://your-project.vercel.app/api/mercadopago/webhook`
3. Copy the verification token → set as `MERCADOPAGO_WEBHOOK_SECRET`

## Database Migration

```bash
# Push schema to Railway PostgreSQL
npx drizzle-kit push
```

Or set up automatic migration via GitHub Actions / Vercel Build Hook.

## Google OAuth — Vercel URL

Add to Google Cloud Console → Authorized redirect URIs:
```
https://your-project.vercel.app/api/auth/callback/google
```

## Admin Setup

After deployment, manually set the first admin user:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## Deploy

```bash
# Preview deploy
npx vercel --prod

# Or push to GitHub and connect to Vercel for auto-deploy
```

## Post-deploy Smoke Test

- [ ] Homepage loads (`/`)
- [ ] Register + login works
- [ ] Discover page shows characters
- [ ] Chat works (send a message)
- [ ] Create character page loads
- [ ] Search works
- [ ] Premium page loads with pricing
- [ ] PWA installs (Chrome DevTools → Application → Service Workers)

```bash
# Run full E2E suite
npm run test:e2e
```
