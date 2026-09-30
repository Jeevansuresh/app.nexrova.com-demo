"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BASE } from "@/lib/api";
import {
  LayoutDashboard, Phone, Users, UserCheck, TrendingUp, RefreshCw, ChevronRight, LogOut, Bot, BookOpen, Settings, Brain, X, MessageSquare
} from "lucide-react";

const NAV = [
  { label: "Executive Overview", href: "/ceo",         icon: LayoutDashboard },
  { label: "Team Performance",   href: "/daily",        icon: Users },
  { label: "Enquirer Profiles",  href: "/enquiries",    icon: UserCheck },
  { label: "AI Coach",           href: "/improvement",  icon: Brain },
  { label: "Ask Oasis",          href: "/chat",         icon: MessageSquare },
  { label: "Call Logs",          href: "/analysis",     icon: Bot },
  { label: "Knowledge Base",     href: "/knowledge",    icon: BookOpen },
  { label: "Settings",           href: "/settings",     icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(href));

  const triggerSync = async () => {
    setSyncing(true);
    setSyncMsg("Syncing...");
    try {
      const res = await fetch(
        `${BASE}/api/sync`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        setSyncMsg("✓ Sync started");
        setTimeout(() => { setSyncMsg(""); setSyncing(false); window.location.reload(); }, 3000);
      } else { setSyncMsg("Failed"); setSyncing(false); }
    } catch { setSyncMsg("Error"); setSyncing(false); }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-[220px] bg-[#0f1b35] flex flex-col z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "#1e40af", borderRadius: 8,
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Phone size={16} color="white" />
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>Nexrova</div>
            <div style={{ color: "#64748b", fontSize: 9, marginTop: 2, lineHeight: 1.35 }}>
              Lead Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className="sidebar-link"
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", borderRadius: 7, marginBottom: 1,
                background: active ? "#1e3a8a" : "transparent",
                color: active ? "#ffffff" : "#cbd5e1",
                fontSize: 12.5, fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
                cursor: href === "#" ? "default" : "pointer",
                pointerEvents: href === "#" ? "none" : "auto",
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span>{label}</span>
              {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div style={{ padding: "0 8px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Sync button */}
        <button
          onClick={triggerSync}
          disabled={syncing}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", margin: "8px 0 0",
            padding: "8px 10px", borderRadius: 7,
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
            color: "#93c5fd", fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <RefreshCw size={13} style={{ flexShrink: 0, animation: syncing ? "spin 1s linear infinite" : "none" }} />
          <span>{syncMsg || "Sync Now"}</span>
        </button>

        {/* Sign Out button */}
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = "/login";
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            margin: "8px 0 0",
            padding: "8px 10px",
            borderRadius: 7,
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <LogOut size={13} style={{ flexShrink: 0 }} />
          <span>Sign Out</span>
        </button>

        {/* Quote */}
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8, borderLeft: "3px solid #1e40af",
        }}>
          <div style={{ color: "#94a3b8", fontSize: 10, fontStyle: "italic", lineHeight: 1.5 }}>
            "Every phone call should make the next phone call better."
          </div>
          <div style={{ color: "#475569", fontSize: 9, marginTop: 4 }}>— Nexrova</div>
        </div>
      </div>
      </div>
    </>
  );
}
