"use client";

import { useState } from "react";
import {
  RiSparkling2Line,
  RiDashboardLine,
  RiFileTextLine,
  RiTeamLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/dashboard", icon: RiDashboardLine },
  { name: "Invoices", href: "/dashboard/invoices", icon: RiFileTextLine },
  { name: "Clients", href: "/dashboard/clients", icon: RiTeamLine },
  { name: "Settings", href: "/dashboard/settings", icon: RiSettingsLine },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  };

  const SidebarContent = () => (
    <>
      <div
        className={cn(
          "p-4 border-b border-[#FF0A54]/15 flex items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-lg bg-[#FF0A54] cherry-glow-sm flex items-center justify-center flex-shrink-0">
            <RiSparkling2Line className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-serif font-bold text-lg text-white tracking-tight">
              Invoice AI
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <RiArrowLeftSLine className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "bg-[#FF0A54]/12 text-[#FF0A54] border border-[#FF0A54]/20"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-[#FF0A54]" : "",
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "p-3 border-t border-[#FF0A54]/15",
          collapsed ? "flex flex-col items-center gap-2" : "space-y-2",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-white/5",
            collapsed ? "justify-center" : "",
          )}
        >
          <Avatar className="w-8 h-8 border border-[#FF0A54]/25 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-[#FF0A54]/15 text-[#FF0A54] text-xs font-medium">
              JD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                John Doe
              </p>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                PRO
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "text-white/40 hover:text-white hover:bg-white/5 transition-colors",
            collapsed
              ? "w-10 h-10 p-0"
              : "w-full justify-start gap-2 text-sm h-9",
          )}
        >
          <RiLogoutBoxLine className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-[#0a0a0a] border border-[#FF0A54]/20 flex items-center justify-center text-white"
      >
        {mobileOpen ? (
          <RiCloseLine className="w-5 h-5" />
        ) : (
          <RiMenuLine className="w-5 h-5" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full w-64 bg-[#050505] border-r border-[#FF0A54]/15 z-50 flex flex-col transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>

      <div
        className={cn(
          "hidden lg:flex flex-col bg-[#050505] border-r border-[#FF0A54]/15 h-screen fixed left-0 top-0 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          className,
        )}
      >
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#0a0a0a] border border-[#FF0A54]/30 flex items-center justify-center text-white/50 hover:text-white hover:border-[#FF0A54]/50 z-10 transition-colors"
          >
            <RiArrowRightSLine className="w-3 h-3" />
          </button>
        )}
        <SidebarContent />
      </div>

      <div
        className={cn(
          "hidden lg:block flex-shrink-0 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      />
    </>
  );
}
