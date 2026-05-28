import Stripe from "stripe";

// Singleton — never instantiate on the client side.
// All imports must be server-only (api routes, server components, lib helpers).

let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Falta la variable de entorno STRIPE_SECRET_KEY. " +
        "Configúrala en tu archivo .env.local."
    );
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });

  return _stripe;
}

/**
 * Price IDs — configúralos en .env.local:
 *   STRIPE_PRICE_MONTHLY  → ~$4.99 USD / mes
 *   STRIPE_PRICE_ANNUAL   → ~$39.99 USD / año
 */
export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY ?? "";
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL ?? "";

export type SubscriptionPlan = "monthly" | "annual";

export function getPriceId(plan: SubscriptionPlan): string {
  if (plan === "monthly") {
    if (!STRIPE_PRICE_MONTHLY)
      throw new Error("STRIPE_PRICE_MONTHLY no está configurada.");
    return STRIPE_PRICE_MONTHLY;
  }
  if (!STRIPE_PRICE_ANNUAL)
    throw new Error("STRIPE_PRICE_ANNUAL no está configurada.");
  return STRIPE_PRICE_ANNUAL;
}
