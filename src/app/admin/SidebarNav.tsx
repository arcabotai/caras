"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileWarning, Users, UserCircle, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reports", label: "Reportes", icon: FileWarning },
  { href: "/admin/characters", label: "Personajes", icon: UserCircle },
  { href: "/admin/users", label: "Usuarios", icon: Users },
];

export function SidebarNav({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 py-4 overflow-y-auto">
      <div className="px-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Navegación</p>
      </div>

      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#7C3AED]/20 text-[#7C3AED] border-r-2 border-[#7C3AED]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}

      <div className="mt-6 px-4 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cuenta</p>
      </div>

      <div className="px-6 py-3 mx-2">
        <p className="text-sm text-white truncate">{userName || "Admin"}</p>
        <p className="text-xs text-gray-500 truncate">{userEmail || ""}</p>
      </div>

      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-3 mx-2 mt-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Volver al inicio
      </Link>
    </nav>
  );
}
