import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Verifica si un usuario tiene suscripción premium activa.
 *
 * Estrategia:
 *  1. Si el usuario tiene stripeSubscriptionId guardado, consultar
 *     el estado real en Stripe para confirmar que sigue activo.
 *  2. Si no tiene subscriptionId pero isPremium = true, confiar en la DB
 *     (el webhook se encarga de mantenerlo sincronizado).
 *
 * Para operaciones de lectura baratas (middleware, UI) se puede pasar
 * alreadyPremium=true y evitar la llamada a Stripe.
 */
export async function isUserPremium(
  userId: string,
  options?: { skipStripeCheck?: boolean }
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      isPremium: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) return false;

  if (!user.isPremium) return false;

  // Si no hay subscription en Stripe y el flag está activo,
  // confiamos en la DB (sincronizado por webhooks).
  if (!user.stripeSubscriptionId) return true;

  if (options?.skipStripeCheck) return true;

  // Verificar estado real en Stripe
  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    const active = ["active", "trialing"].includes(subscription.status);
    return active;
  } catch {
    // Si falla la llamada a Stripe (red, clave inválida…), se mantiene
    // el estado de la DB como fallback para no bloquear al usuario.
    return user.isPremium;
  }
}

/**
 * Devuelve el estado detallado de suscripción de un usuario.
 */
export async function getUserSubscriptionStatus(userId: string): Promise<{
  isPremium: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null; // "active", "past_due", "canceled", null
  planLabel: string | null;           // "Mensual", "Anual", null
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      isPremium: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user || !user.stripeSubscriptionId) {
    return {
      isPremium: user?.isPremium ?? false,
      stripeCustomerId: user?.stripeCustomerId ?? null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      planLabel: null,
    };
  }

  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    const sub = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    // Determinar el plan según el price_id
    const item = sub.items.data[0];
    const priceId = item?.price.id ?? "";

    const { STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL } = await import(
      "@/lib/stripe"
    );

    let planLabel: string | null = null;
    if (priceId === STRIPE_PRICE_MONTHLY) planLabel = "Mensual";
    else if (priceId === STRIPE_PRICE_ANNUAL) planLabel = "Anual";

    return {
      isPremium: ["active", "trialing"].includes(sub.status),
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscriptionStatus: sub.status,
      planLabel,
    };
  } catch {
    return {
      isPremium: user.isPremium,
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      subscriptionStatus: null,
      planLabel: null,
    };
  }
}
