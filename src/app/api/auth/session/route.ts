import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  return NextResponse.json({
    authenticated: !!session,
    session: session
      ? {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          },
        }
      : null,
  });
}
