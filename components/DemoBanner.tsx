"use client";

import { useState, useEffect } from "react";

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const tenantCookie = cookies.find((c) => c.startsWith("tenant="));
    if (tenantCookie) {
      const value = tenantCookie.split("=")[1];
      if (value === "demo") {
        setIsDemo(true);
      }
    }
  }, []);

  if (!isDemo) return null;

  const handleExit = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore errors — redirect regardless
    }
    window.location.href = "/login";
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "44px",
        zIndex: 100,
        background: "#f59e0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          color: "#451a03",
          fontSize: "13px",
          fontWeight: 600,
          lineHeight: 1,
        }}
      >
        ⚡ Demo Mode — All data shown is fictional and for demonstration purposes only.
      </span>

      <button
        onClick={handleExit}
        style={{
          background: "rgba(69, 26, 3, 0.15)",
          border: "1px solid rgba(69, 26, 3, 0.3)",
          color: "#451a03",
          fontSize: "12px",
          fontWeight: 700,
          padding: "5px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(69, 26, 3, 0.25)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(69, 26, 3, 0.15)";
        }}
      >
        Exit Demo
      </button>
    </div>
  );
}
