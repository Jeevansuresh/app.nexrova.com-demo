"use client";

import { useState } from "react";
import { Phone, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email    = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Call FastAPI directly from the browser via Nginx proxy.
      // This ensures FastAPI's Set-Cookie header is received and stored
      // by the browser itself — not lost inside a Next.js server action.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      // FastAPI's Set-Cookie is now stored by the browser.
      // Redirect to dashboard.
      window.location.href = '/';
    } catch {
      setError('Cannot reach the server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 100%)",
      padding: "24px",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "40px 32px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
        animation: "fadeIn 0.5s ease-out both"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e40af",
            borderRadius: "12px",
            width: "48px",
            height: "48px",
            marginBottom: "16px",
            boxShadow: "0 0 20px rgba(30, 64, 175, 0.4)"
          }}>
            <Phone size={22} color="white" />
          </div>
          <h1 style={{
            color: "white",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            marginBottom: "6px"
          }}>
            Welcome to Nexrova
          </h1>
          <p style={{
            color: "#94a3b8",
            fontSize: "13.5px",
            lineHeight: "1.4"
          }}>
            Lead Intelligence
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#fca5a5",
              fontSize: "13px",
              padding: "12px",
              borderRadius: "8px",
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{
              display: "block",
              color: "#cbd5e1",
              fontSize: "12.5px",
              fontWeight: 500,
              marginBottom: "8px"
            }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="#64748b" style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)"
              }} />
              <input
                type="email"
                name="email"
                required
                suppressHydrationWarning
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "11px 12px 11px 38px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              color: "#cbd5e1",
              fontSize: "12.5px",
              fontWeight: 500,
              marginBottom: "8px"
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="#64748b" style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)"
              }} />
              <input
                type="password"
                name="password"
                required
                suppressHydrationWarning
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "11px 12px 11px 38px",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s"
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            style={{
              width: "100%",
              background: "#1e40af",
              color: "white",
              fontWeight: 600,
              fontSize: "14px",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(30, 64, 175, 0.2)",
              marginTop: "8px"
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.background = "#1e40af"; }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

