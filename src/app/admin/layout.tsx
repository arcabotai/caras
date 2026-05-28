import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not logged in
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Redirect to home if not admin
  if (session.user.isAdmin !== true) {
    redirect("/");
  }

  return (
    <AdminShell
      userName={session.user.name}
      userEmail={session.user.email}
    >
      {children}
    </AdminShell>
  );
}
