"use client";

import { SidebarNav } from "./SidebarNav";

export function AdminShell({
  userName,
  userEmail,
  children,
}: {
  userName?: string | null;
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#1A1033] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0f0a1e] border-r border-[#7C3AED]/20 flex flex-col">
        {/* Logo / Title */}
        <div className="h-16 flex items-center px-6 border-b border-[#7C3AED]/20">
          <span className="text-[#7C3AED] font-bold text-lg tracking-tight">
            Talkie Admin
          </span>
        </div>

        {/* Navigation (client component) */}
        <SidebarNav userName={userName} userEmail={userEmail} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center px-8 border-b border-[#7C3AED]/20 bg-[#1A1033]">
          <h1 className="text-xl font-semibold text-white">
            Panel de Administración
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
