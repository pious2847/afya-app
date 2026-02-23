"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Phone,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const USER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teleconsult", label: "Call AI", icon: Phone },
  { href: "/assessment", label: "New Assessment", icon: Stethoscope },
  { href: "/assessment-history", label: "My Assessments", icon: FileText },
  { href: "/clinics", label: "Find Clinics", icon: MapPin },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Admin Overview", icon: Shield },
  { href: "/admin/clinics", label: "Manage Clinics", icon: MapPin },
  { href: "/admin/analytics", label: "Analytics", icon: LayoutDashboard },
];

export function DashboardLayout({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const nav = [...USER_NAV, ...(isAdmin ? ADMIN_NAV : [])];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-700">AfyaAI</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <Link
            href="/assessment?emergency=1"
            className="flex items-center gap-3 rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Emergency</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-end border-b border-slate-200 bg-white px-6">
          <UserButton afterSignOutUrl="/" />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
