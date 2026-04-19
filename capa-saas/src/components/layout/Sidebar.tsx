"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Settings,
  Factory,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/problems", label: "CAPA Records", icon: ClipboardList },
  { href: "/problems/new", label: "New Problem", icon: Plus, highlight: true },
];

const secondaryItems = [
  { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
          <Factory className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-none">CapaFlow</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Manufacturing CAPA</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Main
        </p>
        {navItems.map((item) => {
          const isActive = item.href === "/problems"
            ? pathname === "/problems" || (pathname.startsWith("/problems/") && pathname !== "/problems/new")
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                item.highlight
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  : isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-4 w-4", item.highlight && "text-indigo-100")} />
              {item.label}
            </Link>
          );
        })}

        <div className="my-4 border-t border-slate-100" />

        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          System
        </p>
        {secondaryItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
            <span className="text-xs font-semibold text-white">QE</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">Quality Eng.</p>
            <p className="truncate text-xs text-slate-500">Production</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
