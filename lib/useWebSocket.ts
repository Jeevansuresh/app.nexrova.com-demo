"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { BASE } from "@/lib/api";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function useWebSocket() {
  const setWsStatus = useStore((s: any) => s.setWsStatus);
  const setStats = useStore((s: any) => s.setStats);
  const setTrend = useStore((s: any) => s.setTrend);
  const setFunnel = useStore((s: any) => s.setFunnel);
  const setLeads = useStore((s: any) => s.setLeads);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  useEffect(() => {
    let active = true;

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
      // Local demo mode uses synthetic REST APIs and does not expose a WS upgrade endpoint.
      // Avoid noisy console errors and reconnect loops in localhost demos.
      setWsStatus("disconnected");
      return;
    }

    const connect = () => {
      if (!active) return;

      const tenant = getCookie("tenant") || "kolam";
      let wsBase = BASE;

      if (!wsBase) {
        if (typeof window !== "undefined") {
          wsBase = `${window.location.protocol}//${window.location.host}`;
        } else {
          wsBase = "http://localhost:9018";
        }
      }

      let wsUrl = wsBase;
      if (wsUrl.startsWith("http://")) {
        wsUrl = wsUrl.replace("http://", "ws://");
      } else if (wsUrl.startsWith("https://")) {
        wsUrl = wsUrl.replace("https://", "wss://");
      } else if (wsUrl.startsWith("//")) {
        wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}${wsUrl}`;
      } else if (!wsUrl.includes("://")) {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        wsUrl = `${protocol}//${wsUrl}`;
      }

      const fullUrl = `${wsUrl}/api/ws?tenant=${tenant}`;
      setWsStatus("connecting");

      try {
        const ws = new WebSocket(fullUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!active) {
            ws.close();
            return;
          }
          setWsStatus("connected");
          reconnectCountRef.current = 0;
        };

        ws.onclose = () => {
          if (!active) return;
          setWsStatus("disconnected");
          socketRef.current = null;

          // Retry with exponential backoff (max 30s)
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        ws.onerror = () => {
          // Keep this quiet to avoid blocking demo flow.
          setWsStatus("disconnected");
        };

        ws.onmessage = (messageEvent) => {
          if (!active) return;
          try {
            const data = JSON.parse(messageEvent.data);

            // Handle event types
            if (data.event === "state_update") {
              // Direct Zustand store updates
              if (data.stats) setStats(data.stats);
              if (data.trend) setTrend(data.trend);
              if (data.funnel) setFunnel(data.funnel);
              if (data.data_all) setLeads(data.data_all);

              // Trigger local component updates via browser events
              window.dispatchEvent(new CustomEvent("metrics-updated"));
              window.dispatchEvent(new CustomEvent("lead-updated"));
            } else if (data.event === "METRICS_UPDATED") {
              window.dispatchEvent(new CustomEvent("metrics-updated"));
            } else if (data.event === "LEAD_UPDATED") {
              window.dispatchEvent(new CustomEvent("lead-updated"));
            }
          } catch {
            // no-op
          }
        };
      } catch {
        setWsStatus("disconnected");
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        reconnectCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [setWsStatus, setStats, setTrend, setFunnel, setLeads]);
}
