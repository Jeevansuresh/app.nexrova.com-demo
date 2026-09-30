"use client";

import { useState, useEffect } from "react";
import { BASE } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Phone, CheckSquare, XSquare, TrendingUp, IndianRupee,
  Clock, RotateCcw, AlertTriangle, CalendarDays, Building2,
  ChevronRight, Info, Zap, AlertCircle, ClipboardList, Bell, Tag
} from "lucide-react";
import CallsListModal from "@/components/CallsListModal";
import CrossSellModal from "@/components/CrossSellModal";

interface ComparisonDelta {
  delta_pct?: number;
  delta_abs?: number;
  delta_seconds?: number;
  delta_points?: number;
  direction: "up" | "down";
}

interface ComparisonData {
  is_single_day: boolean;
  total_calls: ComparisonDelta | null;
  bookings_won: ComparisonDelta | null;
  bookings_lost: ComparisonDelta | null;
  conversion_rate: ComparisonDelta | null;
  avg_duration_seconds: ComparisonDelta | null;
  revenue: ComparisonDelta | null;
  total_enquiries: ComparisonDelta | null;
  unique_enquirers: ComparisonDelta | null;
  high_intent_count: ComparisonDelta | null;
  quality_score: ComparisonDelta | null;
  missed_call_rate: ComparisonDelta | null;
  repeat_callers: ComparisonDelta | null;
  followup_pending: ComparisonDelta | null;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface CeoData {
  start_date?: string;
  end_date?: string;
  funnel: { total_calls: number; won: number; lost: number; pending: number; conversion_rate_pct: number };
  guest_requests_pct: Record<string, { percentage: number; count: number }>;
  enquirer_segments: Record<string, { pct_of_total: number; count: number; conversion_rate_pct: number; won_count: number }>;
  stay_duration_distribution: {
    days_1_to_3: { count: number; pct: number };
    days_4_to_7: { count: number; pct: number };
    days_8_to_15: { count: number; pct: number };
    days_16_to_29: { count: number; pct: number };
    days_30_to_59: { count: number; pct: number };
    days_60_to_89: { count: number; pct: number };
    days_90_to_179: { count: number; pct: number };
    days_180_plus: { count: number; pct: number };
  };
  lost_reasons: Record<string, { percentage: number; count: number }>;
  time_slot_calls: Record<string, number>;
  time_slot_conversion: Record<string, number>;
  over_time_trend: { date: string; count: number }[];
  cross_sell: { eligible_calls: number; offered_count: number; pct_offered: number | null };
  revenue: { estimated_revenue_inr: number; won_calls_total: number };
  brief: {
    peak_call_hour_slot: string | null;
    top_lost_reason: string | null;
    avg_call_duration_seconds: number;
    repeat_caller_rate: { count: number; pct_of_total: number };
    missed_call_rate: { count: number; pct_of_total: number };
    needs_review_count: number;
    followup_pending?: { count: number; pct_of_total: number };
    booking_funnel?: { total_calls: number; conversion_rate_pct: number };
    revenue_influenced?: { estimated_revenue_inr: number };
    avg_stay_duration_nights?: number;
    fd_gaps?: { gap: string; count: number }[];
  };
  insights?: string[];
  comparison: ComparisonData | null;
  executive_alerts?: { title: string; description: string; type: string; level: string }[];
  repeat_caller_rate?: { count: number; pct_of_total: number };
  repeat_callers_detail?: { caller_phone: string; caller_name: string | null; call_count: number }[];
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const SLOT_COLORS = ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16"];
const LOST_COLORS = ["#ef4444","#f59e0b","#3b82f6","#10b981","#8b5cf6"];

// ─── Shared atoms ─────────────────────────────────────────────────────────────
const card = {
  background: "#fff", borderRadius: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  padding: "18px 20px",
};

function MetricCard({
  label, value, sub, icon: Icon, iconBg, iconColor, delta, deltaDir, invertDeltaColor, onClick
}: {
  label: string; value: string | number; sub?: string;
  icon: any; iconBg: string; iconColor: string;
  delta?: string; deltaDir?: "up" | "down";
  invertDeltaColor?: boolean;
  onClick?: () => void;
}) {
  const isUp = deltaDir === "up";
  const color = invertDeltaColor 
    ? (isUp ? "#ef4444" : "#10b981") 
    : (isUp ? "#10b981" : "#ef4444");

  return (
    <div onClick={onClick} style={{ ...card, display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: "180px", cursor: onClick ? "pointer" : "default" }}>
      <div style={{
        background: iconBg, borderRadius: "50%",
        width: 52, height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={24} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: value.toString().length > 8 ? 20 : 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
        {delta && (
          <div style={{ fontSize: 11, color: color, marginTop: 3, display: "flex", alignItems: "center", gap: 2 }}>
            {deltaDir === "up" ? "↑" : "↓"} {delta} vs yesterday
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children, style }: { title?: string; children: React.ReactNode; style?: any }) {
  return (
    <div style={{ ...card, padding: "18px 20px", ...(style || {}) }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// Center label for donut
function DonutCenter({ total, label }: { total: number | string; label: string }) {
  return (
    <div style={{ position: "absolute", top: "50%", left: "45%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{total}</div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{label}</div>
    </div>
  );
}

/** Extract delta string and direction from comparison data for a given metric key */
function getDelta(comparison: ComparisonData | null | undefined, key: string): { delta?: string; deltaDir?: "up" | "down" } {
  if (!comparison) return {};
  const d = (comparison as any)[key] as ComparisonDelta | null;
  if (!d) return {};
  if (d.delta_pct !== undefined) return { delta: `${d.delta_pct}%`, deltaDir: d.direction };
  if (d.delta_abs !== undefined) return { delta: `${d.delta_abs}%`, deltaDir: d.direction };
  if (d.delta_seconds !== undefined) return { delta: `${d.delta_seconds} sec`, deltaDir: d.direction };
  if (d.delta_points !== undefined) return { delta: `${d.delta_points} points`, deltaDir: d.direction };
  return {};
}

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatSlotRange = (slot: string | null) => {
  if (!slot) return "N/A";
  const mapping: Record<string, string> = {
    "00-06": "12AM-6AM",
    "06-09": "6AM-9AM",
    "09-12": "9AM-12PM",
    "12-15": "12PM-3PM",
    "15-18": "3PM-6PM",
    "18-21": "6PM-9PM",
    "21-24": "9PM-12AM",
  };
  return mapping[slot] || slot;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CeoDashboard() {
  const [data, setData] = useState<CeoData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<{ insights?: string[], executive_alerts?: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; children: React.ReactNode } | null>(null);
  const [selectedOutcomeModal, setSelectedOutcomeModal] = useState<"won" | "lost" | "total_calls" | "unique_enquirers" | "revenue_influenced" | null>(null);
  const [showCrossSellModal, setShowCrossSellModal] = useState(false);

  const startStr = startDate;
  const endStr = endDate;

  const [property, setProperty] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedProperty") || "all";
    }
    return "all";
  });

  const handlePropertyChange = (newProp: string) => {
    setProperty(newProp);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedProperty", newProp);
      window.dispatchEvent(new Event("property-changed"));
    }
  };

  useEffect(() => {
    const handlePropChange = () => {
      if (typeof window !== "undefined") {
        setProperty(localStorage.getItem("selectedProperty") || "all");
      }
    };
    window.addEventListener("property-changed", handlePropChange);
    return () => {
      window.removeEventListener("property-changed", handlePropChange);
    };
  }, []);

  useEffect(() => {
    fetch_(startDate, endDate);
  }, [property]);

  useEffect(() => {
    setMounted(true);
    const today = getTodayString();
    fetch_(today, today);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      fetch_(startDate, endDate);
    };
    window.addEventListener("metrics-updated", handleUpdate);
    return () => {
      window.removeEventListener("metrics-updated", handleUpdate);
    };
  }, [startDate, endDate]);

  useEffect(() => {
    if (modalContent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalContent]);

  const fetchInsights_ = async (s?: string, e?: string) => {
    setInsightsLoading(true);
    try {
      const api = BASE;
      const params = new URLSearchParams();
      if (s) params.append("start", s);
      if (e) params.append("end", e);
      if (property && property !== "all") params.append("property", property);
      const res = await fetch(`${api}/api/metrics/ceo/insights?${params.toString()}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setInsightsData(json);
      }
    } catch {}
    finally { setInsightsLoading(false); }
  };

  const fetch_ = async (s?: string, e?: string) => {
    setLoading(true); setError(null);
    try {
      const api = BASE;
      const params = new URLSearchParams();
      if (s) params.append("start", s);
      if (e) params.append("end", e);
      if (property && property !== "all") params.append("property", property);
      const res = await fetch(`${api}/api/metrics/ceo?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      if (json.start_date) setStartDate(json.start_date);
      if (json.end_date) setEndDate(json.end_date);
      fetchInsights_(json.start_date || s, json.end_date || e);
    } catch { setError(`Cannot connect to backend at ${BASE}.`); }
    finally { setLoading(false); }
  };

  if (!mounted) return null;
  if (loading) return <LoadingScreen label="CEO Executive Dashboard" />;
  if (error || !data) return <ErrorScreen msg={error!} retry={() => fetch_(startDate, endDate)} />;

  // Chart data
  const slots = Object.keys(data.time_slot_calls).sort((a, b) => a.localeCompare(b));
  const slotPieData = slots.map((slot) => ({ name: formatSlotRange(slot), value: data.time_slot_calls[slot] }));
  const slotTotal = slotPieData.reduce((a, b) => a + b.value, 0);

  const slotBandOrder = ["12AM-6AM", "6AM-9AM", "9AM-12PM", "12PM-3PM", "3PM-6PM", "6PM-9PM", "9PM-12AM"];
  const slotBandStats: Record<string, { calls: number; wonEstimate: number }> = Object.fromEntries(
    slotBandOrder.map((label) => [label, { calls: 0, wonEstimate: 0 }])
  );

  const getSlotBand = (slot: string) => {
    const hour = Number(String(slot).slice(0, 2));
    if (!Number.isFinite(hour)) return "9PM-12AM";
    if (hour < 6) return "12AM-6AM";
    if (hour < 9) return "6AM-9AM";
    if (hour < 12) return "9AM-12PM";
    if (hour < 15) return "12PM-3PM";
    if (hour < 18) return "3PM-6PM";
    if (hour < 21) return "6PM-9PM";
    return "9PM-12AM";
  };

  slots.forEach((slot) => {
    const calls = Number(data.time_slot_calls[slot] ?? 0);
    const conversion = Number(data.time_slot_conversion[slot] ?? 0);
    const band = getSlotBand(slot);
    slotBandStats[band].calls += calls;
    slotBandStats[band].wonEstimate += (calls * conversion) / 100;
  });

  const conversionTrendData = slotBandOrder
    .map((slot) => {
      const calls = slotBandStats[slot].calls;
      const conversionRate = calls > 0 ? Number(((slotBandStats[slot].wonEstimate / calls) * 100).toFixed(1)) : 0;
      return { slot, "Conv %": conversionRate, calls };
    })
    .filter((item) => item.calls > 0);

  const topRequests = Object.entries(data.guest_requests_pct).slice(0, 5);
  const topSegments = Object.entries(data.enquirer_segments).slice(0, 5);
  const topLost = Object.entries(data.lost_reasons).slice(0, 5);
  const todayLimit = getTodayString();

  return (
    <>
      <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="responsive-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>CEO EXECUTIVE DASHBOARD</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Real-time intelligence from every reservation phone call</p>
        </div>
        <div className="responsive-controls">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Toggle Mode */}
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, border: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => {
                  setIsCustomRange(false);
                  setEndDate(startDate);
                  fetch_(startDate, startDate);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: !isCustomRange ? "#fff" : "transparent",
                  color: !isCustomRange ? "#0f172a" : "#64748b",
                  boxShadow: !isCustomRange ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setIsCustomRange(true)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: isCustomRange ? "#fff" : "transparent",
                  color: isCustomRange ? "#0f172a" : "#64748b",
                  boxShadow: isCustomRange ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                Custom Range
              </button>
            </div>

            {/* Date Input Form */}
            <form onSubmit={ev => { ev.preventDefault(); fetch_(startDate, isCustomRange ? endDate : startDate); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px" }}>
              <CalendarDays size={14} color="#6366f1" />
              <input type="date" min="2026-06-10" max={todayLimit} value={startDate} onChange={ev => { const val = ev.target.value; setStartDate(val); if (!isCustomRange) { setEndDate(val); fetch_(val, val); } }} style={{ border: "none", outline: "none", fontSize: 12, fontWeight: 500, color: "#374151", background: "transparent", width: 120 }} />
              {isCustomRange && (
                <>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>→</span>
                  <input type="date" min="2026-06-10" max={todayLimit} value={endDate} onChange={ev => setEndDate(ev.target.value)} style={{ border: "none", outline: "none", fontSize: 12, fontWeight: 500, color: "#374151", background: "transparent", width: 120 }} />
                </>
              )}
              {(isCustomRange || startDate !== data?.start_date) && (
                <button type="submit" style={{ background: "#6366f1", color: "white", border: "none", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Apply</button>
              )}
            </form>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Building2 size={14} color="#6366f1" style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
            <select
              value={property}
              onChange={ev => handlePropertyChange(ev.target.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "7px 14px 7px 32px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                paddingRight: "28px"
              }}
            >
              <option value="all">All Properties</option>
              <option value="gandhi">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Grand" : "Oasis Grand Reservation"}</option>
              <option value="ridhi">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Palm" : "Oasis Palm Reservation"}</option>
              <option value="qbyk">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Boutique" : "Oasis Boutique Reservation"}</option>
            </select>
            <span style={{ position: "absolute", right: "12px", color: "#94a3b8", fontSize: "10px", pointerEvents: "none" }}>▼</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
            MP
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="page-container">

        {/* KPI Row */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <MetricCard label="Total Calls" value={data.funnel.total_calls} icon={Phone} iconBg="#eff6ff" iconColor="#3b82f6" {...getDelta(data.comparison, "total_calls")} onClick={() => setSelectedOutcomeModal("total_calls")} />
          <MetricCard label="Bookings Won" value={data.funnel.won} icon={CheckSquare} iconBg="#f0fdf4" iconColor="#10b981" {...getDelta(data.comparison, "bookings_won")} onClick={() => setSelectedOutcomeModal("won")} />
          <MetricCard label="Bookings Lost" value={data.funnel.lost} icon={XSquare} iconBg="#fef2f2" iconColor="#ef4444" {...getDelta(data.comparison, "bookings_lost")} invertDeltaColor={true} onClick={() => setSelectedOutcomeModal("lost")} />
          <MetricCard label="Conversion Rate" value={`${data.funnel.conversion_rate_pct}%`} icon={TrendingUp} iconBg="#faf5ff" iconColor="#8b5cf6" {...getDelta(data.comparison, "conversion_rate")} />
          <MetricCard 
            label="Repeat Callers" 
            value={`${data.repeat_caller_rate?.count ?? 0} (${data.repeat_caller_rate?.pct_of_total ?? 0}%)`} 
            icon={RotateCcw} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6" 
            {...getDelta(data.comparison, "repeat_callers")} 
            onClick={() => {
              setModalContent({
                title: "Repeat Callers Detail",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                      Guests who have called multiple times during this period, with at least one call having booking intent.
                    </div>
                    {(data.repeat_callers_detail || []).length > 0 ? (
                      (data.repeat_callers_detail || []).map((caller, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{caller.caller_name || "Unknown"}</div>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{caller.caller_phone}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Calls:</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>{caller.call_count}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No repeat callers identified for this period.</div>
                    )}
                  </div>
                )
              });
            }}
          />
          <MetricCard label="Revenue Influenced" value={`₹${(data.revenue.estimated_revenue_inr).toLocaleString("en-IN")}`} icon={IndianRupee} iconBg="#fffbeb" iconColor="#f59e0b" {...getDelta(data.comparison, "revenue")} onClick={() => setSelectedOutcomeModal("revenue_influenced")} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">

          {/* FD Gaps */}
          <SectionCard title="FD Gaps (Today)" style={{ gridColumn: "1/2", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, width: "100%", minWidth: 0, overflowY: "auto", maxHeight: "250px", paddingRight: "4px" }}>
              {data.brief?.fd_gaps && data.brief.fd_gaps.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.brief.fd_gaps.map((g, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#334155", fontWeight: 500, textTransform: "capitalize" }}>{g.gap.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 12 }}>{g.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 40 }}>No FD gaps recorded today.</div>
              )}
            </div>
          </SectionCard>

          {/* Calls by Time Slot Donut */}
          <SectionCard title="Calls by Time Slot" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", flex: 1, minHeight: 200, width: "100%", minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={slotPieData} cx="45%" cy="50%" innerRadius="65%" outerRadius="90%" dataKey="value" startAngle={90} endAngle={-270}>
                    {slotPieData.map((_, i) => <Cell key={i} fill={SLOT_COLORS[i % SLOT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenter total={slotTotal} label="Total Calls" />
            </div>
            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {slotPieData.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: SLOT_COLORS[i % SLOT_COLORS.length] }} />
                    <span style={{ color: "#475569" }}>{s.name}</span>
                  </div>
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                    {Math.round(s.value / slotTotal * 100)}% ({s.value})
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Conversion Over Time */}
          <SectionCard title="Conversion Rate Over Time" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ width: "100%", minWidth: 0, height: 190 }}>
              {conversionTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="slot" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} formatter={(value: any) => [`${value}%`, "Conversion"]} />
                    <Line type="monotone" dataKey="Conv %" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
                  No conversion trend data available.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Bottom Row: Lists + Brief */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_320px] gap-[14px]">

          {/* Left Column: Top Guest Requests & Segments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Top Guest Requests */}
            <SectionCard title="Top Guest Requests" style={{ flex: 1 }}>
              {topRequests.map(([req, val], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < topRequests.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#334155", flex: 1, textTransform: "capitalize" }}>
                    {req.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{val.percentage}% ({val.count})</span>
                </div>
              ))}
              {topRequests.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No data available</div>}
              <div 
                onClick={() => setModalContent({
                  title: "All Guest Requests",
                  children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: 8, fontWeight: 700, fontSize: 13, color: "#475569" }}>
                        <span>REQUEST TYPE</span>
                        <span>FREQUENCY %</span>
                      </div>
                      {Object.entries(data.guest_requests_pct).length > 0 ? (
                        Object.entries(data.guest_requests_pct).map(([req, val], i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 14, textTransform: "capitalize", color: "#334155" }}>{req.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{val.percentage}% ({val.count} calls)</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                          - No requests at the moment -
                        </div>
                      )}
                    </div>
                  )
                })}
                style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                View all requests <ChevronRight size={13} />
              </div>
            </SectionCard>

            {/* Top Enquirer Segments */}
            <SectionCard title="Enquirer Segments" style={{ flex: 1 }}>
              {topSegments.map(([req, val], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < topSegments.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", color: "#10b981", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#334155", flex: 1, textTransform: "capitalize" }}>
                    {req.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{val.pct_of_total}% ({val.count})</span>
                </div>
              ))}
              {topSegments.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No data available</div>}
            </SectionCard>
          </div>

          {/* Middle Column: Lost Reasons & Stay Duration */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Top Lost Booking Reasons */}
            <SectionCard title="Top Lost Booking Reasons" style={{ flex: 1 }}>
              {topLost.map(([reason, val], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < topLost.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: "#334155", flex: 1, textTransform: "capitalize" }}>
                    {reason.replace(/_/g, " ")}
                  </span>
                  <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>{val.percentage}% ({val.count})</span>
                </div>
              ))}
              {topLost.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No data available</div>}
              <div 
                onClick={() => setModalContent({
                  title: "All Lost Booking Reasons",
                  children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: 8, fontWeight: 700, fontSize: 13, color: "#475569" }}>
                        <span>REASON FOR LOST BOOKING</span>
                        <span>FREQUENCY %</span>
                      </div>
                      {Object.entries(data.lost_reasons).length > 0 ? (
                        Object.entries(data.lost_reasons).map(([reason, val], i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 14, textTransform: "capitalize", color: "#334155" }}>{reason.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{val.percentage}% ({val.count} calls)</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                          - No lost booking reasons at the moment -
                        </div>
                      )}
                    </div>
                  )
                })}
                style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                View all reasons <ChevronRight size={13} />
              </div>
            </SectionCard>

            {/* Stay Duration */}
            <SectionCard title="Stay Duration Breakdown" style={{ flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: "250px", overflowY: "auto", paddingRight: 4 }}>
                {[
                  { label: "1-3 Nights", key: "days_1_to_3", color: "#3b82f6" },
                  { label: "4-7 Nights", key: "days_4_to_7", color: "#8b5cf6" },
                  { label: "8-15 Nights", key: "days_8_to_15", color: "#ec4899" },
                  { label: "16-29 Nights", key: "days_16_to_29", color: "#f43f5e" },
                  { label: "30-59 Nights", key: "days_30_to_59", color: "#f97316" },
                  { label: "60-89 Nights", key: "days_60_to_89", color: "#eab308" },
                  { label: "90-179 Nights", key: "days_90_to_179", color: "#84cc16" },
                  { label: "180+ Nights (6 mo+)", key: "days_180_plus", color: "#10b981" }
                ].map((item, i, arr) => {
                  const stat = (data.stay_duration_distribution as any)?.[item.key];
                  return (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#334155", flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{stat?.pct ?? 0}% ({stat?.count ?? 0})</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* CEO Daily Brief + Alerts (right column) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Daily Brief */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>CEO DAILY BRIEF</div>
                <Info size={13} color="#94a3b8" />
              </div>

              <BriefRow icon={CalendarDays} label="Today at a Glance" value={`${data.funnel.total_calls} Calls | ${data.funnel.conversion_rate_pct}% Conversion | ₹${data.revenue.estimated_revenue_inr.toLocaleString("en-IN")} Revenue`} color="#3b82f6" />
              <BriefRow icon={Clock} label="Peak Call Hour" value={formatSlotRange(data.brief.peak_call_hour_slot)} color="#3b82f6" />
              <BriefRow icon={ClipboardList} label="Top Lost Reason" value={data.brief.top_lost_reason ? data.brief.top_lost_reason.replace(/_/g, " ") : "N/A"} color="#f59e0b" />
              <BriefRow icon={TrendingUp} label="Opportunity" value={`Cross-sell rate: ${data.cross_sell.pct_offered ?? 0}%`} color="#10b981" />
            </div>

            {/* AI Recommendations */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Zap size={13} color="#8b5cf6" />
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>AI RECOMMENDATIONS</div>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {insightsLoading ? (
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
                    <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Generating AI Insights...
                  </div>
                ) : insightsData.insights && insightsData.insights.length > 0 ? (
                  insightsData.insights.map((ins, idx) => (
                    <li key={idx} style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, paddingLeft: 12, borderLeft: `2px solid ${["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"][idx % 6]}`, marginTop: idx > 0 ? 2 : 0 }}>
                      {ins}
                    </li>
                  ))
                ) : (
                  <>
                    <li style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, paddingLeft: 12, borderLeft: "2px solid #8b5cf6" }}>
                      {data.brief.peak_call_hour_slot 
                        ? `Increase reservation coverage around ${formatSlotRange(data.brief.peak_call_hour_slot)}. This window has the highest call volume.` 
                        : "Reservation coverage is currently optimal relative to call volumes."}
                    </li>
                    <li style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, paddingLeft: 12, borderLeft: "2px solid #3b82f6", marginTop: 2 }}>
                      {data.brief.repeat_caller_rate.count > 0 ? `${data.brief.repeat_caller_rate.count} repeat callers detected. Consider personalized follow-up outreach.` : "Maintain high compliance on follow-ups and continue capturing guest names in every call."}
                    </li>
                    <li style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.5, paddingLeft: 12, borderLeft: "2px solid #f59e0b", marginTop: 2 }}>
                      {data.brief.needs_review_count > 0 ? `${data.brief.needs_review_count} calls need manual QA review — check for semantic contradictions.` : "No QA review flags. Dashboard is clean."}
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Alerts */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>ALERTS</div>
                {data.brief.needs_review_count > 0 && (
                  <span style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>
                    {data.brief.needs_review_count}
                  </span>
                )}
              </div>
              <AlertRow icon={AlertCircle} text={`${data.brief.needs_review_count > 0 ? data.brief.needs_review_count : "No"} calls flagged for QA review`} level={data.brief.needs_review_count > 0 ? "High" : "Low"} />
              <AlertRow icon={AlertTriangle} text={`${data.brief.repeat_caller_rate.count} repeat callers (${data.brief.repeat_caller_rate.pct_of_total}% of total)`} level="Medium" />
              <div 
                onClick={() => setModalContent({
                  title: "All Executive Alerts & System Flags",
                  children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {(insightsData.executive_alerts && insightsData.executive_alerts.length > 0) ? (
                        insightsData.executive_alerts.map((alert, i) => {
                          const borderColor = alert.level === "High" ? "#ef4444" : alert.level === "Medium" ? "#f59e0b" : "#3b82f6";
                          const bg = alert.level === "High" ? "#fef2f2" : alert.level === "Medium" ? "#fffbeb" : "#eff6ff";
                          const textColor = alert.level === "High" ? "#991b1b" : alert.level === "Medium" ? "#92400e" : "#1e40af";
                          const descColor = alert.level === "High" ? "#7f1d1d" : alert.level === "Medium" ? "#78350f" : "#1e3a8a";
                          return (
                            <div key={i} style={{ padding: "16px", borderLeft: `4px solid ${borderColor}`, background: bg, borderRadius: 8 }}>
                              <h4 style={{ fontWeight: 700, color: textColor, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                                <AlertCircle size={16} color={borderColor} /> {alert.title}
                              </h4>
                              <p style={{ fontSize: 13, color: descColor, marginTop: 6, lineHeight: 1.5 }}>{alert.description}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: "16px", borderLeft: "4px solid #ef4444", background: "#fef2f2", borderRadius: 8 }}>
                          <h4 style={{ fontWeight: 700, color: "#991b1b", fontSize: 14 }}>QA Review Alerts</h4>
                          <p style={{ fontSize: 13, color: "#7f1d1d", marginTop: 6, lineHeight: 1.5 }}>{data.brief.needs_review_count > 0 ? `${data.brief.needs_review_count} calls pending manual QA review.` : "No urgent calls flagged for QA review."}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                View all alerts <ChevronRight size={13} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stat Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[14px]">
          <BottomStat label="Avg Call Duration" value={`${data.brief.avg_call_duration_seconds}s`} icon={Clock} {...getDelta(data.comparison, "avg_duration_seconds")} />
          <BottomStat label="Avg Stay Duration" value={`${data.brief.avg_stay_duration_nights} Nights`} icon={CalendarDays} />
          <BottomStat label="Follow-up Pending" value={data.brief.followup_pending?.count ?? 0} icon={Bell} {...getDelta(data.comparison, "followup_pending")} />
          <BottomStat label="Repeat Callers" value={`${data.brief.repeat_caller_rate.count} (${data.brief.repeat_caller_rate.pct_of_total}%)`} icon={RotateCcw} {...getDelta(data.comparison, "repeat_callers")} />
          <div onClick={() => setShowCrossSellModal(true)} style={{ cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            <BottomStat 
              label="Cross-sell Offer Rate" 
              value={`${data.cross_sell.pct_offered ?? 0}%`} 
              icon={Tag} 
              delta={`${data.cross_sell.offered_count} offers | ${(data.cross_sell.eligible_calls ?? 0) - (data.cross_sell.offered_count ?? 0)} missed`} 
            />
          </div>
        </div>

      </div>

      </div>

      {/* Modal Overlay */}
      {modalContent && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalContent(null); }}
          onKeyDown={(e) => { if (e.key === "Escape") setModalContent(null); }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 9999,
            animation: "modalFadeIn 0.2s ease-out"
          }}
        >
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalSlideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .modal-panel::-webkit-scrollbar { width: 6px; }
            .modal-panel::-webkit-scrollbar-track { background: transparent; }
            .modal-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            .modal-panel::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>
          <div
            className="modal-panel"
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "min(720px, 95vw)",
              height: "min(650px, 85vh)",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
              overflow: "hidden",
              animation: "modalSlideUp 0.3s ease-out"
            }}
          >
            {/* Sticky Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>{modalContent.title}</h2>
              </div>
              <button
                onClick={() => setModalContent(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                  e.currentTarget.style.color = "#0f172a";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                &times;
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
              {modalContent.children}
            </div>
          </div>
        </div>
      )}

      {selectedOutcomeModal && (
        <CallsListModal
          outcome={selectedOutcomeModal}
          startDate={startStr}
          endDate={endStr}
          folderId={property}
          onClose={() => setSelectedOutcomeModal(null)}
        />
      )}

      {showCrossSellModal && (
        <CrossSellModal
          startDate={startStr}
          endDate={endStr}
          folderId={property}
          onClose={() => setShowCrossSellModal(false)}
        />
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function BriefRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc", alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={12} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#334155", fontWeight: 500, marginTop: 1, textTransform: "capitalize" }}>{value}</div>
      </div>
    </div>
  );
}

function AlertRow({ icon: Icon, text, level }: { icon: any; text: string; level: "High" | "Medium" | "Low" }) {
  const color = level === "High" ? "#ef4444" : level === "Medium" ? "#f59e0b" : "#10b981";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0" }}>
      <Icon size={12} color={color} style={{ marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#334155" }}>{text}</div>
        <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 1 }}>{level} Impact</div>
      </div>
    </div>
  );
}

function BottomStat({ label, value, icon: Icon, delta, deltaDir }: { label: string; value: any; icon: any; delta?: string; deltaDir?: "up" | "down" }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon size={15} color="#64748b" />
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>{label}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, color: deltaDir === "up" ? "#10b981" : deltaDir === "down" ? "#ef4444" : "#94a3b8", marginTop: 3 }}>
          {deltaDir === "up" ? "↑" : deltaDir === "down" ? "↓" : ""} {delta}
        </div>
      )}
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading {label}...</div>
    </div>
  );
}

function ErrorScreen({ msg, retry }: { msg: string; retry: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, textAlign: "center", padding: 40 }}>
      <AlertCircle size={40} color="#ef4444" />
      <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>Unable to load dashboard</div>
      <div style={{ fontSize: 13, color: "#64748b", maxWidth: 400 }}>{msg}</div>
      <button onClick={retry} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 8, background: "#1e40af", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}
