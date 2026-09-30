"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useWebSocket } from "@/lib/useWebSocket";
import { Menu, Phone } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize the persistent WebSocket client connection
  useWebSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <div
        className="mobile-topbar"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 56,
          background: "#0f1b35", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px",
          zIndex: 40, borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: "#1e40af", borderRadius: 6, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Phone size={14} color="white" />
          </div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Nexrova</div>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 8 }}>
          <Menu size={20} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main
        className="desktop-main main-content"
        style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column" }}
      >
        {children}
      </main>
    </>
  );
}
