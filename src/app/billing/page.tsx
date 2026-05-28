import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserSubscriptionStatus } from "@/lib/premium";
import { BillingClient } from "./_components/billing-client";

export const metadata: Metadata = {
  title: "Facturación",
  description: "Gestiona tu suscripción y facturación de Talkie LATAM Premium",
};

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/billing");
  }

  const subscriptionData = await getUserSubscriptionStatus(session.user.id);

  return (
    <BillingClient 
      subscriptionData={{
        isPremium: subscriptionData.isPremium,
        subscriptionStatus: (subscriptionData.subscriptionStatus as "free" | "active" | "canceled" | "past_due") || "free",
        planType: (subscriptionData.planLabel === "Mensual" ? "monthly" : subscriptionData.planLabel === "Anual" ? "annual" : null),
        stripeCustomerId: subscriptionData.stripeCustomerId,
      }} 
      userId={session.user.id} 
    />
  );
}
