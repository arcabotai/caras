/**
 * Mercado Pago SDK singleton — server-only
 * Nunca importar en componentes cliente.
 *
 * API del SDK v2: cada cliente se instancia con MercadoPagoConfig
 * y expone métodos de clase.
 */

import { MercadoPagoConfig, Preference, PreApprovalPlan, PreApproval, Payment } from "mercadopago";
import type { PreApprovalPlanResponse } from "mercadopago/dist/clients/preApprovalPlan/commonTypes";
import type { PreApprovalResponse, PreApprovalRequest } from "mercadopago/dist/clients/preApproval/commonTypes";
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PlanInterval = "monthly" | "annual";

export interface PlanConfig {
  id: PlanInterval;
  title: string;
  description: string;
  /** Precio en la moneda local (equivale a ~$4.99 USD mensual / ~$39.99 USD anual) */
  unitPrice: number;
  currencyId: string;
}

export interface CheckoutResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

// ─── Constantes de planes ─────────────────────────────────────────────────────

export const PLANS: Record<PlanInterval, PlanConfig> = {
  monthly: {
    id: "monthly",
    title: "Talkie Premium — Plan Mensual",
    description: "Acceso premium a Talkie LATAM por un mes",
    unitPrice: 499, // ~$4.99 USD (equivalente en moneda local)
    currencyId: "US",
  },
  annual: {
    id: "annual",
    title: "Talkie Premium — Plan Anual",
    description: "Acceso premium a Talkie LATAM por un año (¡2 meses gratis!)",
    unitPrice: 3999, // ~$39.99 USD (equivalente en moneda local)
    currencyId: "US",
  },
};

// ─── Singleton ─────────────────────────────────────────────────────────────────

let _config: MercadoPagoConfig | null = null;
let _preference: Preference | null = null;
let _preApprovalPlan: PreApprovalPlan | null = null;
let _preApproval: PreApproval | null = null;
let _payment: Payment | null = null;

function getConfig(): MercadoPagoConfig {
  if (!_config) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno."
      );
    }
    _config = new MercadoPagoConfig({ accessToken });
  }
  return _config;
}

function getPreference(): Preference {
  if (!_preference) _preference = new Preference(getConfig());
  return _preference;
}

function getPreApprovalPlanClient(): PreApprovalPlan {
  if (!_preApprovalPlan) _preApprovalPlan = new PreApprovalPlan(getConfig());
  return _preApprovalPlan;
}

function getPreApprovalClient(): PreApproval {
  if (!_preApproval) _preApproval = new PreApproval(getConfig());
  return _preApproval;
}

function getPaymentClient(): Payment {
  if (!_payment) _payment = new Payment(getConfig());
  return _payment;
}

// ─── PreApproval Plan (suscripciones recurrentes) ─────────────────────────────

/**
 * Crea un plan de suscripción preaprobado en Mercado Pago.
 * Se usa para suscripciones recurrentes (pagos automáticos).
 */
export async function createPreApprovalPlan(
  planInterval: PlanInterval
): Promise<PreApprovalPlanResponse> {
  const plan = PLANS[planInterval];
  const client = getPreApprovalPlanClient();

  const body = {
    reason: plan.title,
    frequency: planInterval === "monthly" ? 1 : 12,
    frequency_unit: planInterval === "monthly" ? "months" : "months",
    start_date: new Date().toISOString(),
    end_date: new Date(
      Date.now() + (planInterval === "monthly" ? 30 : 365) * 24 * 60 * 60 * 1000
    ).toISOString(),
    autoreturn: "approved",
    billing_day: new Date().getDate(),
    billing_day_proportional: true,
    transaction_amount: plan.unitPrice,
    currency_id: plan.currencyId,
    back_url: `${process.env.NEXTAUTH_URL}/premium?success=true`,
    status: "active",
  };

  const result = await client.create({ body });
  return result;
}

/**
 * Obtiene el estado de un plan preaprobado existente.
 */
export async function getPreApprovalPlanResponse(
  planId: string
): Promise<PreApprovalPlanResponse | null> {
  try {
    const client = getPreApprovalPlanClient();
    const result = await client.get({ preApprovalPlanId: planId });
    return result;
  } catch {
    return null;
  }
}

// ─── PreApproval (suscripción activa del usuario) ─────────────────────────────

/**
 * Crea una suscripción preaprobada para el usuario (liga su tarjeta a Mercado Pago).
 * Devuelve el link de aprobación.
 */
export async function createPreApproval(
  userId: string,
  email: string,
  planInterval: PlanInterval,
  preApprovalPlanId: string
): Promise<PreApprovalResponse> {
  const plan = PLANS[planInterval];
  const client = getPreApprovalClient();

  const body: PreApprovalRequest = {
    preapproval_plan_id: preApprovalPlanId,
    payer_email: email,
    external_reference: userId,
    reason: plan.title,
    back_url: `${process.env.NEXTAUTH_URL}/premium?success=true`,
    auto_recurring: {
      frequency: planInterval === "monthly" ? 1 : 12,
      frequency_type: planInterval === "monthly" ? "months" : "months",
      transaction_amount: plan.unitPrice,
      currency_id: plan.currencyId,
    },
  };

  const result = await client.create({ body });
  return result;
}

/**
 * Obtiene una suscripción preaprobada por su ID.
 */
export async function getPreApproval(
  preApprovalId: string
): Promise<PreApprovalResponse | null> {
  try {
    const client = getPreApprovalClient();
    const result = await client.get({ id: preApprovalId });
    return result;
  } catch {
    return null;
  }
}

// ─── Checkout Preference (pago único) ─────────────────────────────────────────

/**
 * Crea una preferencia de pago en Mercado Pago para un plan.
 * Devuelve el init_point para redirigir al usuario.
 */
export async function createCheckoutPreference(
  userId: string,
  email: string,
  planInterval: PlanInterval
): Promise<CheckoutResult> {
  const plan = PLANS[planInterval];
  const client = getPreference();

  const body = {
    items: [
      {
        id: `talkie-premium-${planInterval}`,
        title: plan.title,
        description: plan.description,
        quantity: 1,
        unit_price: plan.unitPrice,
        currency_id: plan.currencyId,
        picture_url: `${process.env.NEXT_PUBLIC_APP_URL}/icons/icon-512.png`,
      },
    ],
    payer: {
      email,
      name: "",
    },
    external_reference: userId,
    back_urls: {
      success: `${process.env.NEXTAUTH_URL}/premium?success=true`,
      pending: `${process.env.NEXTAUTH_URL}/premium?pending=true`,
      failure: `${process.env.NEXTAUTH_URL}/premium?failed=true`,
    },
    auto_return: "approved",
    payment_methods: {
      excluded_payment_types: [],
      installments: 12,
    },
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
  };

  const result = await client.create({ body });
  return {
    preferenceId: result.id!,
    initPoint: result.init_point!,
    sandboxInitPoint: result.sandbox_init_point ?? result.init_point!,
  };
}

// ─── Payment (verificación de pago completado) ─────────────────────────────────

/**
 * Obtiene los detalles de un pago por su ID de Mercado Pago.
 */
export async function getPayment(paymentId: number): Promise<PaymentResponse | null> {
  try {
    const client = getPaymentClient();
    const result = await client.get({ id: paymentId });
    return result;
  } catch {
    return null;
  }
}

// ─── Verificación de firma de webhook ─────────────────────────────────────────

/**
 * Verifica que la notificación proviene genuinamente de Mercado Pago
 * usando el validador oficial del SDK.
 *
 * @param signature Header x-signature de Mercado Pago
 * @param bodyString Cuerpo de la request como string (raw)
 * @param secret Secret del webhook configurado en .env.local
 */
export function verifyWebhookSignature(
  signature: string,
  bodyString: string,
  secret: string
): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebhookSignatureValidator } = require("mercadopago");
    const result = WebhookSignatureValidator.validate({
      signature,
      content: bodyString,
      secret,
    });
    return result;
  } catch {
    return false;
  }
}

// ─── Estados de pago de Mercado Pago ─────────────────────────────────────────

export const PAYMENT_STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const PRE_APPROVAL_STATUS = {
  AUTHORIZED: "authorized",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  PENDING: "pending",
} as const;

// ─── Alias para compatibilidad con la ruta stripe/checkout ───────────────────

/**
 * Alias de createCheckoutPreference con la firma esperada por la ruta de Stripe.
 * Usa el mismo flujo de preferencia de Mercado Pago.
 */
export async function createMercadoPagoPreference({
  userId,
  userEmail,
  userName: _userName,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  plan: PlanInterval;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; init_point: string }> {
  const result = await createCheckoutPreference(userId, userEmail, plan);

  // La función interna ya incluye back_urls en la preferencia,
  // aquí solo necesitamos devolver el id y init_point para compatibilidad.
  // Los back_urls de la preferencia se configuran internamente.
  void cancelUrl; // Configurado internamente en createCheckoutPreference
  void successUrl; // Configurado internamente en createCheckoutPreference
  void _userName;

  return {
    id: result.preferenceId,
    init_point: result.initPoint,
  };
}


