import { auth } from "@/lib/auth";
import { getUserSubscriptionStatus } from "@/lib/premium";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        isPremium: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        planLabel: null,
      },
      { status: 200 }
    );
  }

  const status = await getUserSubscriptionStatus(session.user.id);

  return NextResponse.json(status);
}
