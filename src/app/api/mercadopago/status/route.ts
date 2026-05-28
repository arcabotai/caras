/**
 * GET /api/mercadopago/status
 *
 * Devuelve el estado de suscripción del usuario actual consultando:
 *   1. El campo isPremium en la base de datos
 *   2. La suscripción activa en Mercado Pago (si existe)
 *
 * No requiere body. El usuario se identifica por la sesión activa.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPreApproval, getPayment, PRE_APPROVAL_STATUS, PAYMENT_STATUS } from "@/lib/mercadopago";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SubscriptionStatus {
  isPremium: boolean;
  subscriptionId: string | null;
  paymentId: string | null;
  subscriptionStatus: "active" | "cancelled" | "paused" | "pending" | "none";
  planType: "monthly" | "annual" | null;
  nextBillingDate: string | null;
  source: "mercadopago" | "stripe" | "none";
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Verificar autenticación
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para ver tu estado de suscripción." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // 2. Obtener usuario desde la base de datos
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 }
    );
  }

  // 3. Construir respuesta base (desde la DB)
  const baseStatus: SubscriptionStatus = {
    isPremium: user.isPremium,
    subscriptionId: user.mercadopagoSubscriptionId,
    paymentId: user.mercadopagoPaymentId,
    subscriptionStatus: "none",
    planType: null,
    nextBillingDate: null,
    source: "none",
  };

  // 4. Si el usuario no tiene premium, devolver estado base
  if (!user.isPremium && !user.mercadopagoSubscriptionId && !user.mercadopagoPaymentId) {
    return NextResponse.json(baseStatus);
  }

  // 5. Verificar con Mercado Pago si hay datos disponibles

  // Suscripción activa (preapproval)
  if (user.mercadopagoSubscriptionId) {
    const preApproval = await getPreApproval(user.mercadopagoSubscriptionId);

    if (preApproval) {
      let subStatus: SubscriptionStatus["subscriptionStatus"] = "none";

      switch (preApproval.status) {
        case PRE_APPROVAL_STATUS.AUTHORIZED:
          subStatus = "active";
          break;
        case PRE_APPROVAL_STATUS.CANCELLED:
          subStatus = "cancelled";
          break;
        case PRE_APPROVAL_STATUS.PAUSED:
          subStatus = "paused";
          break;
        case PRE_APPROVAL_STATUS.PENDING:
          subStatus = "pending";
          break;
      }

      // Determinar tipo de plan desde el reason
      let planType: SubscriptionStatus["planType"] = null;
      const reason = (preApproval.reason ?? "").toLowerCase();
      if (reason.includes("anual")) {
        planType = "annual";
      } else if (reason.includes("mensual")) {
        planType = "monthly";
      }

      return NextResponse.json({
        ...baseStatus,
        isPremium: subStatus === "active",
        subscriptionStatus: subStatus,
        planType,
        nextBillingDate: preApproval.next_payment_date ?? null,
        source: "mercadopago",
      });
    }
  }

  // Pago único completado
  if (user.mercadopagoPaymentId) {
    const paymentId = parseInt(user.mercadopagoPaymentId, 10);
    if (!isNaN(paymentId)) {
      const payment = await getPayment(paymentId);

      if (payment) {
        return NextResponse.json({
          ...baseStatus,
          isPremium: payment.status === PAYMENT_STATUS.APPROVED,
          subscriptionStatus:
            payment.status === PAYMENT_STATUS.APPROVED ? "active" : "none",
          source: "mercadopago",
        });
      }
    }
  }

  // Fallback: devolver estado de la base de datos
  return NextResponse.json({
    ...baseStatus,
    source: user.mercadopagoSubscriptionId ? "mercadopago" : "none",
  });
}
