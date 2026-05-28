import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe, getPriceId } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createMercadoPagoPreference } from "@/lib/mercadopago";

const checkoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
  provider: z.enum(["stripe", "mercadopago"]).optional().default("stripe"),
});

export async function POST(request: Request) {
  // Solo usuarios autenticados pueden iniciar el checkout
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para suscribirte." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos. Usa 'monthly' o 'annual' para plan, y 'stripe' o 'mercadopago' para provider." },
      { status: 400 }
    );
  }

  const { plan, provider } = parsed.data;
  const userId = session.user.id;
  const userEmail = session.user.email;

  // Mercado Pago checkout
  if (provider === "mercadopago") {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado." },
          { status: 404 }
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const preference = await createMercadoPagoPreference({
        userId: user.id,
        userEmail: user.email ?? "",
        userName: user.name ?? "",
        plan,
        successUrl: `${appUrl}/billing?success=true`,
        cancelUrl: `${appUrl}/premium?canceled=true`,
      });

      return NextResponse.json({ 
        provider: "mercadopago",
        preferenceId: preference.id,
        initPoint: preference.init_point,
      });
    } catch (error) {
      console.error("Mercado Pago error:", error);
      return NextResponse.json(
        { error: "Error al crear la preferencia de Mercado Pago." },
        { status: 500 }
      );
    }
  }

  // Stripe checkout (default)
  const stripe = getStripe();

  // Obtener o crear stripeCustomerId para el usuario
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      stripeCustomerId: true,
    },
  });

  let customerId: string;

  if (user?.stripeCustomerId) {
    customerId = user.stripeCustomerId;
  } else {
    // Crear cliente en Stripe
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;

    // Guardar el customerId en la DB
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  const priceId = getPriceId(plan);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/premium?canceled=true`,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: { userId, plan },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ 
    provider: "stripe",
    url: checkoutSession.url,
  });
}
