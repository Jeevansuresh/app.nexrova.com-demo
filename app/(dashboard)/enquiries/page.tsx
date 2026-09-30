"use client";

import { useState, useEffect } from "react";
import { BASE } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, Phone, TrendingUp, CheckCircle2, CalendarDays, ChevronRight, AlertCircle, Zap, RotateCcw, UserCheck, Building2 } from "lucide-react";
import CallsListModal from "@/components/CallsListModal";

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

interface EnqData {
  start_date?: string;
  end_date?: string;
  total_enquiries: number;
  conversion_rate: number;
  unique_vs_repeat: { repeat_by_phone_match: number; repeat_by_transcript_signal: number; total_enquiries: number };
  enquirer_type_distribution: { revisiting_enquirers?: { count: number; pct: number }; first_time_enquirers?: { count: number; pct: number } };
  top_intent_signals_pct: { asked_about_availability: number; asked_about_pricing: number; asked_about_amenities: number; asked_about_long_stay: number; asked_about_offers: number };
  key_insights: string[];
  high_intent_enquiries: { call_id: string; guest_name: string | null; guest_phone: string | null; intent_score: number; enquirer_segment: string; outcome: string }[];
  recent_enquirer_interactions: { call_id: string; guest_name: string | null; guest_phone: string | null; call_timestamp: string; intent_score: number; enquirer_type: string; next_action: string; call_count?: number; is_repeat?: number }[];
  all_enquirer_interactions: { call_id: string; guest_name: string | null; guest_phone: string | null; call_timestamp: string; intent_score: number; enquirer_type: string; next_action: string; call_count?: number; is_repeat?: number }[];
  intent_score_distribution: { high: { count: number }; medium: { count: number }; low: { count: number } };
  enquirer_segment_distribution: { name: string; count: number; pct: number }[];
  avg_stay_duration_nights?: number;
  trend_enquiries?: { date: string; enquiries: number }[];
  comparison: ComparisonData | null;
}

const TYPE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];
const INTENT_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const card = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px" };

function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor, delta, deltaDir, onClick }: any) {
  return (
    <div onClick={onClick} style={{ ...card, display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: "160px", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ background: iconBg, borderRadius: "50%", width: 52, height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={24} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: value.toString().length > 8 ? 20 : 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
        {delta && <div style={{ fontSize: 11, color: deltaDir === "up" ? "#10b981" : "#ef4444", marginTop: 3 }}>{deltaDir === "up" ? "↑" : "↓"} {delta} vs yesterday</div>}
      </div>
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

export default function EnquiriesDashboard() {
  const [data, setData] = useState<EnqData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<{ key_insights?: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; children: React.ReactNode } | null>(null);

  const [property, setProperty] = useState<string>("all");
  const [selectedOutcomeModal, setSelectedOutcomeModal] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProperty(localStorage.getItem("selectedProperty") || "all");
    }
  }, []);

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
      const res = await fetch(`${api}/api/metrics/enquiries/insights?${params.toString()}`, { credentials: "include" });
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
      const res = await fetch(`${api}/api/metrics/enquiries?${params.toString()}`, { credentials: "include" });
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
  if (loading) return <Spinner />;
  if (error || !data) return <Err msg={error!} retry={() => fetch_(startDate, endDate)} />;

  const firstTimeCount = data.enquirer_type_distribution.first_time_enquirers?.count ?? 0;
  const revisitingCount = data.enquirer_type_distribution.revisiting_enquirers?.count ?? 0;
  const highIntentCount = data.intent_score_distribution?.high.count || 0;

  const typePieData = data.enquirer_segment_distribution && data.enquirer_segment_distribution.length > 0 
    ? data.enquirer_segment_distribution 
    : [];
  const typePieTotal = typePieData.reduce((a, b) => a + b.count, 0);

  const intentSignals = [
    { name: "Availability", value: data.top_intent_signals_pct.asked_about_availability },
    { name: "Pricing", value: data.top_intent_signals_pct.asked_about_pricing },
    { name: "Amenities", value: data.top_intent_signals_pct.asked_about_amenities },
    { name: "Long Stay", value: data.top_intent_signals_pct.asked_about_long_stay },
    { name: "Offers", value: data.top_intent_signals_pct.asked_about_offers },
  ];

  const intentDist = data.intent_score_distribution ? [
    { name: "High (80-100)", value: data.intent_score_distribution.high.count },
    { name: "Medium (50-79)", value: data.intent_score_distribution.medium.count },
    { name: "Low (0-49)", value: data.intent_score_distribution.low.count },
  ] : [];
  const intentTotal = intentDist.reduce((a, b) => a + b.value, 0);

  const outcomeColor = (outcome: string) => {
    if (outcome === "won") return { bg: "#f0fdf4", text: "#10b981", border: "#bbf7d0" };
    if (outcome === "lost") return { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" };
    return { bg: "#fffbeb", text: "#f59e0b", border: "#fde68a" };
  };

  const todayLimit = getTodayString();

  return (
    <>
      <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* Top Bar */}
      <div className="responsive-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Enquirer Profile Dashboard</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>360° view of enquirer interactions and intent intelligence</p>
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
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>MP</div>
        </div>
      </div>

      <div className="page-container">

        {/* KPI Row */}
        <div className="kpi-row">
          <MetricCard label="Total Enquiries" value={data.total_enquiries.toLocaleString()} icon={Users} iconBg="#eff6ff" iconColor="#3b82f6" {...getDelta(data.comparison, "total_enquiries")} onClick={() => setSelectedOutcomeModal("unique_enquirers")} />
          <MetricCard label="First-time Enquirers" value={firstTimeCount.toLocaleString()} icon={UserCheck} iconBg="#f0fdf4" iconColor="#10b981" {...getDelta(data.comparison, "unique_enquirers")} onClick={() => setSelectedOutcomeModal("first_time")} />
          <MetricCard label="Revisiting Enquirers" value={revisitingCount} icon={RotateCcw} iconBg="#faf5ff" iconColor="#8b5cf6" sub={data.total_enquiries > 0 ? `${(revisitingCount / data.total_enquiries * 100).toFixed(1)}% of total enquirers` : "0%"} onClick={() => setSelectedOutcomeModal("revisiting")} />
          <MetricCard label="High Intent Enquirers" value={highIntentCount} icon={Zap} iconBg="#fffbeb" iconColor="#f59e0b" {...getDelta(data.comparison, "high_intent_count")} onClick={() => setSelectedOutcomeModal("high_intent")} />
          <MetricCard label="Conversion Rate" value={`${data.conversion_rate}%`} icon={TrendingUp} iconBg="#fef2f2" iconColor="#ef4444" {...getDelta(data.comparison, "conversion_rate")} />
        </div>

        {/* Main charts grid: 2 big cols + right panel */}
        <div className="charts-grid-3">

          {/* Enquiries Over Time */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>Enquiries Over Time</div>
              <select style={{ fontSize: 11, color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 6px", background: "#fff" }}>
                <option>Daily</option><option>Weekly</option>
              </select>
            </div>
            {/* Trend enquiries line chart with BarChart fallback for single-day */}
            <div style={{ flex: 1, width: "100%", minWidth: 0, minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                {data.trend_enquiries && data.trend_enquiries.length === 1 ? (
                  <BarChart data={data.trend_enquiries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                ) : (
                  <LineChart data={data.trend_enquiries || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enquirer Type Distribution Donut + source bars */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 10, flexShrink: 0 }}>Enquirer Type Distribution</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center", flex: 1, minHeight: 170 }}>
              <div style={{ position: "relative", height: 170, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="count" startAngle={90} endAngle={-270}>
                      {typePieData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{typePieTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>Total Enquirers</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {typePieData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[i % TYPE_COLORS.length], flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: "#334155", textTransform: "capitalize" }}>{d.name.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.count} ({d.pct}%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Enquirer Snapshot */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Enquirer Snapshot</div>
              {[
                { label: "Total Enquiries", value: data.total_enquiries.toLocaleString(), color: "#3b82f6", type: "unique_enquirers" },
                { label: "First-time Enquirers", value: firstTimeCount.toLocaleString(), color: "#10b981", type: "first_time" },
                { label: "Revisiting Enquirers", value: `${revisitingCount} (${data.total_enquiries > 0 ? (revisitingCount / data.total_enquiries * 100).toFixed(1) : 0}%)`, color: "#8b5cf6", type: "revisiting" },
                { label: "High Intent Enquirers", value: `${highIntentCount} (${data.total_enquiries > 0 ? (highIntentCount / data.total_enquiries * 100).toFixed(1) : 0}%)`, color: "#f59e0b", type: "high_intent" },
                { label: "Avg Stay Duration", value: `${data.avg_stay_duration_nights} Nights`, color: "#14b8a6" },
                { label: "Converted Enquirers", value: `${Math.round(data.total_enquiries * data.conversion_rate / 100)} (${data.conversion_rate}%)`, color: "#ef4444" },
              ].map(({ label, value, color, type }) => (
                <div 
                  key={label} 
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 4px", borderBottom: "1px solid #f8fafc", cursor: type ? "pointer" : "default", borderRadius: "4px" }}
                  onClick={() => type && setSelectedOutcomeModal(type)}
                  onMouseEnter={(e) => type && (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                  onMouseLeave={(e) => type && (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                    <div style={{ width: 3, height: 14, borderRadius: 2, background: color }} />
                    {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Top Intent Indicators */}
            <div style={{ ...card, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Top Intent Indicators</div>
              {intentSignals.map(({ name, value }) => (
                <div key={name} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11, color: "#475569" }}>
                    <span>✓ {name}</span>
                    <span style={{ fontWeight: 600 }}>{value}%</span>
                  </div>
                  <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${value}%`, background: "#3b82f6", borderRadius: 2, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enquirer Segments + Intent Distribution + Key Insights */}
        <div className="charts-grid-3">

          {/* Intent Score Distribution Donut */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 10, flexShrink: 0 }}>Intent Score Distribution</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "center", flex: 1, minHeight: 180 }}>
              <div style={{ position: "relative", height: 180, width: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={intentDist} cx="50%" cy="50%" innerRadius={58} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                      {intentDist.map((_, i) => <Cell key={i} fill={INTENT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{intentTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>Total Enquirers</div>
                </div>
              </div>
              <div>
                {intentDist.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: INTENT_COLORS[i], flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 11, color: "#334155" }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.value} ({intentTotal > 0 ? (d.value / intentTotal * 100).toFixed(1) : 0}%)</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 6, fontSize: 10, color: "#64748b", fontStyle: "italic", lineHeight: 1.4 }}>High intent enquirers convert 2.8x more than low intent enquirers</div>
              </div>
            </div>
          </div>

          {/* Top Enquiry Reasons */}
          <div style={{ ...card, padding: "18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Top Enquiry Reasons</div>
            {typePieData.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <span style={{ color: "#334155", textTransform: "capitalize" }}>{item.name.replace(/_/g, ' ')}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>{item.pct}%</span>
              </div>
            ))}
            <div 
              onClick={() => setModalContent({
                title: "All Enquiry Reasons",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {typePieData.length > 0 ? (
                      typePieData.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: 14, color: "#334155", textTransform: "capitalize" }}>{item.name.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{item.pct}% ({item.count})</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
                        - No enquiries at the moment -
                      </div>
                    )}
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all reasons <ChevronRight size={12} />
            </div>
          </div>

          {/* Key Insights */}
          <div style={{ ...card, padding: "16px 18px", background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", border: "1px solid #ddd6fe" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Zap size={13} color="#6366f1" />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6366f1" }}>Key Insights</div>
            </div>
            {insightsLoading ? (
              <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                Generating AI Insights...
              </div>
            ) : insightsData.key_insights && insightsData.key_insights.length > 0 ? (
              insightsData.key_insights.map((insight, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 5 }} />
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{insight}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                - No insights available at the moment -
              </div>
            )}
          </div>
        </div>

        {/* High Intent Enquiries Table */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>Recent Enquirer Interactions</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Enquirer", "Phone", "Last Enquiry Date", "Enquiry Type", "Intent Score", "Status", "Next Action"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_enquirer_interactions.map(r => {
                  const score = r.intent_score ?? 0;
                  const scoreColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
                  const scoreBg = score >= 80 ? "#f0fdf4" : score >= 50 ? "#fffbeb" : "#fef2f2";
                  return (
                    <tr key={r.call_id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#3b82f6", flexShrink: 0 }}>
                            {(r.guest_name || "?")[0].toUpperCase()}
                          </div>
                          <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            <span>{r.guest_name || "Unknown"}</span>
                            {((r.call_count && r.call_count > 1) || r.is_repeat === 1) && (
                              <span style={{ background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 5px", display: "inline-flex", alignItems: "center", justifyContent: "center", height: 16 }}>R</span>
                            )}
                            {r.call_count && r.call_count > 1 && (
                              <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10, padding: "2px 6px", borderRadius: 10 }}>{r.call_count} calls</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{r.guest_phone || "—"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b" }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#334155", textTransform: "capitalize" }}>{r.enquirer_type?.replace(/_/g, " ") || "General"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: scoreBg, color: scoreColor, borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>{score}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>Enquiry Received</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>{r.next_action}</td>
                    </tr>
                  );
                })}
                {data.recent_enquirer_interactions.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>No recent interactions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div 
            onClick={() => setModalContent({
              title: "All Enquirer Interactions",
              children: (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {["Enquirer", "Phone", "Last Enquiry Date", "Enquiry Type", "Intent Score", "Next Action"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.all_enquirer_interactions.map(r => {
                        const score = r.intent_score ?? 0;
                        const scoreColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
                        const scoreBg = score >= 80 ? "#f0fdf4" : score >= 50 ? "#fffbeb" : "#fef2f2";
                        return (
                          <tr key={r.call_id} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#3b82f6" }}>
                                  {(r.guest_name || "?")[0].toUpperCase()}
                                </div>
                                <div style={{ fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                                  <span>{r.guest_name || "Unknown"}</span>
                                  {((r.call_count && r.call_count > 1) || r.is_repeat === 1) && (
                                    <span style={{ background: "#f3e8ff", color: "#7e22ce", border: "1px solid #e9d5ff", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 5px", display: "inline-flex", alignItems: "center", justifyContent: "center", height: 16 }}>R</span>
                                  )}
                                  {r.call_count && r.call_count > 1 && (
                                    <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10, padding: "2px 6px", borderRadius: 10 }}>{r.call_count} calls</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "14px 16px", color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.guest_phone || "—"}</td>
                            <td style={{ padding: "14px 16px", color: "#64748b", whiteSpace: "nowrap" }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</td>
                            <td style={{ padding: "14px 16px", color: "#334155", textTransform: "capitalize", whiteSpace: "nowrap" }}>{r.enquirer_type?.replace(/_/g, " ") || "General"}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ background: scoreBg, color: scoreColor, borderRadius: 6, padding: "4px 10px", fontWeight: 700 }}>{score}</span>
                            </td>
                            <td style={{ padding: "14px 16px", color: "#3b82f6", fontWeight: 600, whiteSpace: "nowrap" }}>{r.next_action}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
            style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4, color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            View all enquirers <ChevronRight size={12} />
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
              width: "min(1000px, 95vw)",
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
          startDate={startDate}
          endDate={endDate}
          folderId={property}
          onClose={() => setSelectedOutcomeModal(null)}
        />
      )}
    </>
  );
}

function Spinner() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6" }} /></div>;
}
function Err({ msg, retry }: { msg: string; retry: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, padding: 40, textAlign: "center" }}>
      <AlertCircle size={40} color="#ef4444" />
      <div style={{ fontSize: 15, fontWeight: 600 }}>Dashboard Unavailable</div>
      <div style={{ fontSize: 13, color: "#64748b", maxWidth: 400 }}>{msg}</div>
      <button onClick={retry} style={{ padding: "8px 20px", borderRadius: 8, background: "#1e40af", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Retry</button>
    </div>
  );
}
