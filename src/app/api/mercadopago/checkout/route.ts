/**
 * POST /api/mercadopago/checkout
 *
 * Crea una preferencia de pago de Mercado Pago y devuelve el URL de checkout.
 * El frontend debe redirigir al usuario a initPoint o sandboxInitPoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCheckoutPreference, PlanInterval } from "@/lib/mercadopago";

// ─── Schema de validación ─────────────────────────────────────────────────────

const CheckoutSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

type CheckoutBody = z.infer<typeof CheckoutSchema>;

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Verificar autenticación
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para suscribirte." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 2. Validar body
  let body: CheckoutBody;
  try {
    const json = await req.json();
    body = CheckoutSchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "Parámetros inválidos. Especifica 'plan': 'monthly' | 'annual'." },
      { status: 400 }
    );
  }

  const planInterval: PlanInterval = body.plan;

  // 3. Obtener datos del usuario
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Tu cuenta no tiene un email asociado. Completa tu perfil." },
      { status: 400 }
    );
  }

  // 4. Crear preferencia de Mercado Pago
  try {
    const checkout = await createCheckoutPreference(
      userId,
      user.email,
      planInterval
    );

    return NextResponse.json({
      preferenceId: checkout.preferenceId,
      // Devolver sandbox o producción según el entorno
      checkoutUrl:
        process.env.NODE_ENV === "production"
          ? checkout.initPoint
          : checkout.sandboxInitPoint,
      message: "Preferencia creada correctamente.",
    });
  } catch (err) {
    console.error("[MercadoPago Checkout] Error al crear preferencia:", err);
    return NextResponse.json(
      {
        error:
          "No se pudo crear la preferencia de pago. Intenta de nuevo más tarde.",
      },
      { status: 500 }
    );
  }
}
