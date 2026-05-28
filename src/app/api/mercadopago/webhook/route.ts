/**
 * POST /api/mercadopago/webhook
 *
 * Maneja las notificaciones IPN de Mercado Pago:
 *  - payment.completed  → marcar usuario como premium
 *  - payment.pending    → no hacer nada (esperar)
 *  - payment.rejected  → notificar al usuario
 *  - payment.cancelled → notificar al usuario
 *  - subscription.authorized_payment → sincronizar suscripción
 *  - subscription.cancelled → revoke premium
 *
 * Configurar la URL en tu app de Mercado Pago:
 *   https://tu-proyecto.vercel.app/api/mercadopago/webhook
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  getPayment,
  getPreApproval,
  PAYMENT_STATUS,
  PRE_APPROVAL_STATUS,
} from "@/lib/mercadopago";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Forzar rendering dinámico (necesario para webhooks) ──────────────────────

export const dynamic = "force-dynamic";

// ─── Tipos de notificación de Mercado Pago ────────────────────────────────────

interface MercadoPagoWebhookPayload {
  action: string;
  api_version: string;
  id: string;
  date_created: string;
  type: "payment" | "preapproval" | "chargebacks" | "subscription";
  /** ID del recurso según el tipo */
  data: {
    id: string;
  };
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Leer cuerpo como texto (necesario para verificar firma)
  const bodyString = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  // 2. Verificar firma del webhook
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (webhookSecret) {
    const isValid = verifyWebhookSignature(signature, bodyString, webhookSecret);
    if (!isValid) {
      console.warn("[MercadoPago Webhook] Firma inválida — request rechazada.");
      return NextResponse.json({ error: "Firma inválida." }, { status: 403 });
    }
  }

  // 3. Parsear payload
  let payload: MercadoPagoWebhookPayload;
  try {
    payload = JSON.parse(bodyString);
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  console.log(`[MercadoPago Webhook] Received: type=${payload.type} action=${payload.action} id=${payload.data.id}`);

  // ─── Manejo por tipo de notificación ──────────────────────────────────────

  try {
    switch (payload.type) {
      case "payment":
        return await handlePaymentNotification(payload);

      case "preapproval":
        return await handlePreApprovalNotification(payload);

      case "subscription":
        // Las notificaciones de suscripción se manejan como preapproval
        return await handlePreApprovalNotification(payload);

      default:
        // Tipo desconocido — confirmar recepción
        return NextResponse.json({ status: "ignored" }, { status: 200 });
    }
  } catch (err) {
    console.error("[MercadoPago Webhook] Error procesando notificación:", err);
    // Siempre responder 200 para evitar reintentos innecesarios de Mercado Pago
    // (registrar el error y manejarlo manualmente si es necesario)
    return NextResponse.json(
      { error: "Error interno procesando notificación." },
      { status: 200 }
    );
  }
}

// ─── Handlers específicos ─────────────────────────────────────────────────────

/**
 * Maneja notificaciones de pago único (checkout preference).
 */
async function handlePaymentNotification(
  payload: MercadoPagoWebhookPayload
): Promise<NextResponse> {
  const paymentId = parseInt(payload.data.id, 10);
  if (isNaN(paymentId)) {
    return NextResponse.json({ error: "payment_id inválido." }, { status: 400 });
  }

  const payment = await getPayment(paymentId);
  if (!payment) {
    console.warn(`[MercadoPago] Payment ${paymentId} no encontrado.`);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  // El external_reference contiene el userId
  const userId = payment.external_reference;
  if (!userId) {
    console.warn("[MercadoPago] Payment sin external_reference.");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  switch (payment.status) {
    case PAYMENT_STATUS.APPROVED:
      // Pago exitoso — activar premium
      await db
        .update(users)
        .set({
          isPremium: true,
          mercadopagoPaymentId: String(paymentId),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`[MercadoPago] Usuario ${userId} ahora es PREMIUM (payment=${paymentId}).`);
      break;

    case PAYMENT_STATUS.PENDING:
      // Pago pendiente — no hacer nada todavía
      console.log(`[MercadoPago] Pago pendiente para usuario ${userId}.`);
      break;

    case PAYMENT_STATUS.REJECTED:
    case PAYMENT_STATUS.CANCELLED:
    case PAYMENT_STATUS.REFUNDED:
      // Pago rechazado/cancelado/reembolsado — notificar usuario
      console.warn(`[MercadoPago] Pago ${payment.status} para usuario ${userId}.`);
      // TODO: Enviar notificación al usuario (email, push, etc.)
      break;

    default:
      console.log(`[MercadoPago] Payment status no manejado: ${payment.status}`);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

/**
 * Maneja notificaciones de suscripción preaprobada.
 */
async function handlePreApprovalNotification(
  payload: MercadoPagoWebhookPayload
): Promise<NextResponse> {
  const preApprovalId = payload.data.id;

  const preApproval = await getPreApproval(preApprovalId);
  if (!preApproval) {
    console.warn(`[MercadoPago] PreApproval ${preApprovalId} no encontrado.`);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  const userId = preApproval.external_reference;
  if (!userId) {
    console.warn("[MercadoPago] PreApproval sin external_reference.");
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  switch (preApproval.status) {
    case PRE_APPROVAL_STATUS.AUTHORIZED:
      // Suscripción autorizada — activar premium
      await db
        .update(users)
        .set({
          isPremium: true,
          mercadopagoSubscriptionId: preApprovalId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `[MercadoPago] Usuario ${userId} ahora es PREMIUM (subscription=${preApprovalId}).`
      );
      break;

    case PRE_APPROVAL_STATUS.CANCELLED:
      // Suscripción cancelada — revocar premium
      await db
        .update(users)
        .set({
          isPremium: false,
          mercadopagoSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(
        `[MercadoPago] Premium revocado para usuario ${userId} (subscription cancelled).`
      );
      // TODO: Enviar notificación al usuario sobre la cancelación
      break;

    case PRE_APPROVAL_STATUS.PAUSED:
      console.log(`[MercadoPago] Suscripción pausada para usuario ${userId}.`);
      // TODO: Notificar al usuario
      break;

    case PRE_APPROVAL_STATUS.PENDING:
      console.log(`[MercadoPago] Suscripción pendiente para usuario ${userId}.`);
      break;

    default:
      console.log(
        `[MercadoPago] PreApproval status no manejado: ${preApproval.status}`
      );
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
