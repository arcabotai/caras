import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Requerido para verificar la firma del webhook
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET no está configurada.");
    return NextResponse.json(
      { error: "Configuración de webhook incompleta." },
      { status: 500 }
    );
  }

  const stripe = getStripe();

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Falta la firma del webhook." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Error al verificar la firma del webhook:", err);
    return NextResponse.json(
      { error: "Firma inválida." },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        await db
          .update(users)
          .set({
            isPremium: true,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
          })
          .where(eq(users.id, userId));

        console.log(`✅ Usuario ${userId} actualizado a premium.`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        const isActive = ["active", "trialing"].includes(subscription.status);

        await db
          .update(users)
          .set({
            isPremium: isActive,
            stripeSubscriptionId: subscription.id,
          })
          .where(eq(users.id, userId));

        console.log(
          `🔄 Suscripción de ${userId} actualizada — estado: ${subscription.status}.`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await db
          .update(users)
          .set({
            isPremium: false,
            stripeSubscriptionId: null,
          })
          .where(eq(users.id, userId));

        console.log(`❌ Suscripción de ${userId} eliminada. Premium revocado.`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (!customerId) break;

        // Buscar el usuario por stripeCustomerId y marcar como impago
        // (isPremium se mantiene true hasta que la suscripción se cancele)
        console.warn(
          `⚠️ Pago fallido para el cliente ${customerId}. Considera notificar al usuario.`
        );

        // Opcional: podrías enviar un email de notificación aquí usando Resend / SendGrid
        break;
      }

      default:
        // Ignoramos eventos que no nos interesan
        break;
    }
  } catch (err) {
    console.error("Error al procesar el webhook:", err);
    return NextResponse.json(
      { error: "Error interno al procesar el evento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
