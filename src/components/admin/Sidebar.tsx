"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Library,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Trivia Packs", href: "/packs", icon: Library },
  { name: "Boutique", href: "/boutique", icon: ShoppingBag },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  if (!user) return null;

  return (
    <aside className="w-64 bg-[#141d1a] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-8 flex flex-col items-center gap-4">
        <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-[#0fbd58]/20 border border-white/10 group bg-black/40 p-2">
          <Image
            src="/Logo.png"
            alt="Naija Trivia"
            fill
            className="object-contain transform group-hover:scale-105 transition-transform duration-300 p-2"
          />
        </div>
        <div className="text-center">
          <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none">
            NAIJA TRIVIA
          </h1>
          <p className="text-[#0fbd58] text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-80 italic">
            ADMIN DASHBOARD
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-[#0fbd58]/10 text-[#0fbd58] border border-[#0fbd58]/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
            >
              <item.icon
                size={18}
                className={cn(
                  isActive ? "text-[#0fbd58]" : "group-hover:text-white",
                )}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
