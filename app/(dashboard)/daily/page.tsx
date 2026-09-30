"use client";

import { useState, useEffect } from "react";
import { BASE } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Phone, CheckSquare, XSquare, TrendingUp, Clock, CalendarDays,
  AlertCircle, ChevronRight, Zap, CheckCircle2, User, ShieldCheck, RotateCcw,
  PhoneIncoming, PhoneOutgoing, RefreshCw, AlertTriangle, Building2
} from "lucide-react";
import DateRangePicker from "@/components/DateRangePicker";
import Sidebar from "@/components/Sidebar";
import CallsListModal from "@/components/CallsListModal";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface DailyData {
  start_date?: string;
  end_date?: string;
  selected_date: string;
  summary: { total_calls: number; bookings_won: number; conversion_rate_pct: number; avg_call_duration_seconds: number; followups_assigned: number; followups_completed: number };
  glance: { peak_call_hour: string; avg_call_duration: string; first_call_time: string; last_call_time: string; pending_followups_count: number };
  outcome_breakdown: Record<string, { count: number; pct: number }>;
  hourly_calls: { hourly_counts: { hour: string; count: number }[]; peak_hour: string; peak_count: number };
  hourly_conversion: { hourly_rates: { hour: string; conversion_rate_pct: number | null }[] };
  insights: string[];
  coaching_tip: string;
  pending_followups: { call_id: string; guest_name: string | null; guest_phone: string | null; intent_score: number; call_timestamp: string }[];
  completed_followups: { call_id: string; guest_name: string | null; guest_phone: string | null; intent_score: number; call_timestamp: string }[];
  trend_conversion: { daily_rates: { date: string; conversion_rate_pct: number | null }[] };
  trend_enquiries: { date: string; count: number }[];
  comparison: ComparisonData | null;
  guest_requests_pct: Record<string, { percentage: number; count: number }>;
  lost_reasons: Record<string, { percentage: number; count: number }>;
  fd_gaps: { gap: string; count: number }[];
  repeat_caller_rate?: { count: number; pct_of_total: number };
  repeat_callers_detail?: { caller_phone: string; caller_name: string | null; call_count: number }[];
  recoverable_leads?: { caller_phone: string; caller_name: string | null; call_timestamp: string; recovery_reason: string | null; raw_lost_reason: string | null; gdrive_folder_id: string | null; audio_filename: string | null; call_uuid: string; }[];
}

const OUTCOME_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#94a3b8"];

const card = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px" };

function MetricCard({ label, value, icon: Icon, iconBg, iconColor, delta, deltaDir, sub, invertDeltaColor, onClick }: any) {
  const isUp = deltaDir === "up";
  const color = invertDeltaColor 
    ? (isUp ? "#ef4444" : "#10b981") 
    : (isUp ? "#10b981" : "#ef4444");

  return (
    <div onClick={onClick} style={{ ...card, display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: "160px", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ background: iconBg, borderRadius: "50%", width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={iconColor} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: value.toString().length > 8 ? 18 : 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{sub}</div>}
        {delta && (
          <div style={{ fontSize: 11, color: color, marginTop: 2 }}>
            {deltaDir === "up" ? "↑" : "↓"} {delta} vs yesterday
          </div>
        )}
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

const formatSlotRangeCompact = (slot: string | null) => {
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
  if (mapping[slot]) return mapping[slot];

  const parts = slot.split("-");
  if (parts.length === 2) {
    const formatHourStr = (timeStr: string) => {
      const hourPart = timeStr.split(":")[0];
      const hourVal = parseInt(hourPart, 10);
      if (isNaN(hourVal)) return timeStr;
      const ampm = (hourVal === 24 || hourVal < 12) ? "AM" : "PM";
      const displayHour = hourVal % 12 === 0 ? 12 : hourVal % 12;
      return `${displayHour}${ampm}`;
    };
    return `${formatHourStr(parts[0].trim())}-${formatHourStr(parts[1].trim())}`;
  }
  return slot;
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function DailyDashboard() {
  const [data, setData] = useState<DailyData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<{ insights?: string[], coaching_tip?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const [selectedOutcomeModal, setSelectedOutcomeModal] = useState<"won" | "lost" | "total_calls" | null>(null);
  const startStr = dateRange.start.toISOString().split("T")[0];
  const endStr = dateRange.end.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [modalContent, setModalContent] = useState<{ title: string; children: React.ReactNode } | null>(null);

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
      const res = await fetch(`${api}/api/metrics/daily/insights?${params.toString()}`, { credentials: "include" });
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
      const url = `${api}/api/metrics/daily?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error();
      const json: DailyData = await res.json();
      setData(json);
      if (json.start_date) setStartDate(json.start_date);
      if (json.end_date) setEndDate(json.end_date);
      fetchInsights_(json.start_date || s, json.end_date || e);
    } catch { setError(`Cannot connect to backend at ${BASE}.`); }
    finally { setLoading(false); }
  };

  const markDone = async (callId: string) => {
    setSyncing(p => ({ ...p, [callId]: true }));
    try {
      const api = BASE;
      await fetch(`${api}/api/followup/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ call_id: callId }) });
      if (data) {
        const item = data.pending_followups.find(x => x.call_id === callId);
        if (item) setData({ ...data, pending_followups: data.pending_followups.filter(x => x.call_id !== callId), completed_followups: [item, ...data.completed_followups] });
      }
    } catch { /* silent */ }
    finally { setSyncing(p => ({ ...p, [callId]: false })); }
  };

  if (!mounted) return null;
  if (loading) return <Spinner />;
  if (error || !data) return <Err msg={error!} retry={() => fetch_()} />;

  const trendMap = new Map(data.trend_enquiries.map(x => [x.date, x.count]));
  const trendData = data.trend_conversion.daily_rates.map(x => ({
    date: x.date.slice(5),
    "Calls": trendMap.get(x.date) ?? 0,
    "Conv %": x.conversion_rate_pct ?? 0,
  }));

  const hourlyData = data.hourly_calls.hourly_counts.map((h, i) => ({
    hour: formatSlotRangeCompact(h.hour),
    "Calls": h.count,
    "Conv %": data.hourly_conversion.hourly_rates[i]?.conversion_rate_pct ?? 0,
  }));

  const outcomes = [
    { name: "Bookings Won", value: data.outcome_breakdown.confirmed?.count ?? 0 },
    { name: "Bookings Lost", value: data.outcome_breakdown.lost_booking?.count ?? 0 },
    { name: "Follow-up", value: data.outcome_breakdown.followup_needed?.count ?? 0 },
    { name: "Info Only", value: data.outcome_breakdown.general_enquiry?.count ?? 0 },
    { name: "Service Calls", value: data.outcome_breakdown.service_calls?.count ?? 0 },
  ].filter(x => x.value > 0);
  const totalOutcome = data.outcome_breakdown.total?.count ?? outcomes.reduce((a, b) => a + b.value, 0);

  const todayLimit = getTodayString();

  return (
    <>
      <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* Top Bar */}
      <div className="responsive-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>Daily Performance Dashboard</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Front Desk Call Receiver — Your daily call summary and performance insights</p>
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
            <form onSubmit={e => { e.preventDefault(); fetch_(startDate, isCustomRange ? endDate : startDate); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px" }}>
              <CalendarDays size={14} color="#6366f1" />
              <input type="date" min="2026-06-10" max={todayLimit} value={startDate} onChange={e => { const val = e.target.value; setStartDate(val); if (!isCustomRange) { setEndDate(val); fetch_(val, val); } }} style={{ border: "none", outline: "none", fontSize: 12, fontWeight: 500, color: "#374151", background: "transparent", width: 120 }} />
              {isCustomRange && (
                <>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>→</span>
                  <input type="date" min="2026-06-10" max={todayLimit} value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 12, fontWeight: 500, color: "#374151", background: "transparent", width: 120 }} />
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
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>AR</div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container">

        {/* KPI Row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MetricCard label="Total Calls" value={data.summary.total_calls} icon={Phone} iconBg="#eff6ff" iconColor="#3b82f6" {...getDelta(data.comparison, "total_calls")} onClick={() => setSelectedOutcomeModal("total_calls")} />
          <MetricCard label="Bookings Won" value={data.summary.bookings_won} icon={CheckSquare} iconBg="#f0fdf4" iconColor="#10b981" {...getDelta(data.comparison, "bookings_won")} onClick={() => setSelectedOutcomeModal("won")} />
          <MetricCard label="Bookings Lost" value={data.outcome_breakdown.lost_booking?.count ?? 0} icon={XSquare} iconBg="#fef2f2" iconColor="#ef4444" {...getDelta(data.comparison, "bookings_lost")} invertDeltaColor={true} onClick={() => setSelectedOutcomeModal("lost")} />
          <MetricCard label="Conversion Rate" value={`${data.summary.conversion_rate_pct}%`} icon={TrendingUp} iconBg="#faf5ff" iconColor="#8b5cf6" {...getDelta(data.comparison, "conversion_rate")} />
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
          <MetricCard label="Avg Duration" value={data.glance.avg_call_duration} icon={Clock} iconBg="#fffbeb" iconColor="#f59e0b" sub="per call" />
          <MetricCard label="Follow-ups" value={`${data.summary.followups_completed}/${data.summary.followups_assigned}`} icon={ShieldCheck} iconBg="#f0fdf4" iconColor="#10b981" sub="completed" />
        </div>

        {/* Mid Charts row */}
        <div className="charts-grid-4">

          {/* Recover Leads */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12, flexShrink: 0 }}>Recover Leads</div>
            <div style={{ flex: 1, width: "100%", minWidth: 0, overflowY: "auto", maxHeight: "200px", paddingRight: 4 }}>
              {data.recoverable_leads && data.recoverable_leads.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.recoverable_leads.map((lead, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{lead.caller_name || lead.caller_phone || "Unknown Caller"}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(lead.call_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        <strong style={{ color: "#ef4444" }}>Lost:</strong> {lead.raw_lost_reason || "Unknown reason"}
                      </div>
                      <div style={{ fontSize: 12, color: "#10b981", fontWeight: 500 }}>
                        <strong>Action:</strong> {lead.recovery_reason || "Follow up to recover"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 40 }}>No recoverable leads found.</div>
              )}
            </div>
          </div>

          {/* Call Outcome Donut */}
          <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 8, flexShrink: 0 }}>Call Outcome Breakdown</div>
            <div style={{ position: "relative", flex: 1, minHeight: 190, width: "100%", minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={outcomes} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" dataKey="value" startAngle={90} endAngle={-270}>
                    {outcomes.map((_, i) => <Cell key={i} fill={OUTCOME_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a" }}>{totalOutcome}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>Total Calls</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {outcomes.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: OUTCOME_COLORS[i] ?? "#94a3b8", flexShrink: 0 }} />
                  <span style={{ color: "#475569", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</span>
                  <span style={{ color: "#64748b", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 4 }}>{o.value} ({totalOutcome ? Math.round(o.value / totalOutcome * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Rate Over Time */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12, flexShrink: 0 }}>Conversion Rate Over Time</div>
            <div style={{ flex: 1, width: "100%", minWidth: 0, minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={(isCustomRange ? trendData : hourlyData) as any[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={isCustomRange ? "date" : "hour"} tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Conv %" stroke="#10b981" strokeWidth={2} dot={{ r: 2.5, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today at a Glance */}
          <div style={{ ...card, padding: "18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Today at a Glance</div>
            {[
              { icon: TrendingUp, iconColor: "#3b82f6", label: "Peak Call Hour", value: data.glance.peak_call_hour },
              { icon: Clock, iconColor: "#64748b", label: "Avg Call Duration", value: data.glance.avg_call_duration },
              { icon: PhoneIncoming, iconColor: "#10b981", label: "First Call Received", value: data.glance.first_call_time },
              { icon: PhoneOutgoing, iconColor: "#ef4444", label: "Last Call Received", value: data.glance.last_call_time },
              { icon: RotateCcw, iconColor: "#f59e0b", label: "Follow-ups Pending", value: `${data.glance.pending_followups_count}` },
            ].map(({ icon: Icon, iconColor, label, value }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#64748b" }}>
                  <Icon size={12} color={iconColor} />{label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{value}</div>
              </div>
            ))}
            <div 
              onClick={() => setModalContent({
                title: "Today at a Glance - Detailed Metrics",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { icon: TrendingUp, iconColor: "#3b82f6", label: "Peak Call Hour", desc: "The hour window where you received the highest volume of reservation enquiries.", value: data.glance.peak_call_hour },
                      { icon: Clock, iconColor: "#64748b", label: "Avg Call Duration", desc: "Average time spent per call (includes reservation confirmations and inquiries).", value: data.glance.avg_call_duration },
                      { icon: PhoneIncoming, iconColor: "#10b981", label: "First Call Received", desc: "Timestamp of the very first call handled today.", value: data.glance.first_call_time },
                      { icon: PhoneOutgoing, iconColor: "#ef4444", label: "Last Call Received", desc: "Timestamp of the last call handled today.", value: data.glance.last_call_time },
                      { icon: RotateCcw, iconColor: "#f59e0b", label: "Follow-ups Pending", desc: "Outstanding client call-backs that require front-desk attention.", value: `${data.glance.pending_followups_count}` },
                    ].map(({ icon: Icon, iconColor, label, desc, value }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#1f2937" }}>
                            <Icon size={14} color={iconColor} />
                            <span>{label}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{desc}</p>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all details <ChevronRight size={12} />
            </div>
          </div>
        </div>

        {/* Follow-ups and Coaching Row */}
        <div className="charts-grid-4">

          {/* Top Guest Requests */}
          <div style={{ ...card }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 10 }}>Top Guest Requests</div>
            {Object.entries(data.guest_requests_pct || {}).length === 0
              ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No requests logged</div>
              : Object.entries(data.guest_requests_pct)
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .slice(0, 5)
                  .map(([name, val], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 && i < Object.entries(data.guest_requests_pct).length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                      <span style={{ fontSize: 12, color: "#334155", flex: 1, textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{val.count} Guests ({val.percentage}% of guests)</span>
                    </div>
                  ))
            }
            <div 
              onClick={() => setModalContent({
                title: "All Guest Requests",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(data.guest_requests_pct || {}).length > 0 ? (
                      Object.entries(data.guest_requests_pct).sort((a, b) => b[1].percentage - a[1].percentage).map(([name, val], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: 14, color: "#334155", textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6" }}>{val.count} Guests ({val.percentage}% of guests)</span>
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
              style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all requests <ChevronRight size={12} />
            </div>
          </div>

          {/* Top Lost Booking Reasons */}
          <div style={{ ...card }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ef4444", marginBottom: 10 }}>Top Lost Booking Reasons</div>
            {Object.entries(data.lost_reasons || {}).length === 0
              ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No data available</div>
              : Object.entries(data.lost_reasons)
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .slice(0, 5)
                  .map(([name, val], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 && i < Object.entries(data.lost_reasons).length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fef2f2", color: "#ef4444", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                      <span style={{ fontSize: 12, color: "#334155", flex: 1, textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
                      <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{val.percentage}% ({val.count})</span>
                    </div>
                  ))
            }
            <div 
              onClick={() => setModalContent({
                title: "All Lost Booking Reasons",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(data.lost_reasons || {}).length > 0 ? (
                      Object.entries(data.lost_reasons).sort((a, b) => b[1].percentage - a[1].percentage).map(([name, val], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: 14, color: "#334155", textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{val.percentage}% ({val.count})</span>
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
              style={{ marginTop: 10, fontSize: 12, color: "#ef4444", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all reasons <ChevronRight size={12} />
            </div>
          </div>

          {/* Front Desk Gaps Identified */}
          <div style={{ ...card }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f59e0b", marginBottom: 10 }}>FD Gaps Identified</div>
            {(data.fd_gaps || []).length === 0
              ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No gaps identified — great job!</div>
              : (data.fd_gaps || []).slice(0, 5).map((g, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 && i < (data.fd_gaps || []).length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fffbeb", color: "#f59e0b", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                    <span style={{ fontSize: 12, color: "#334155", flex: 1, textTransform: "capitalize" }}>{g.gap.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>{g.count}×</span>
                  </div>
                ))
            }
            <div
              onClick={() => setModalContent({
                title: "All Front Desk Gaps Identified",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>These gaps were detected across call transcripts in the selected date range. Each represents a process failure by the front desk agent.</div>
                    {(data.fd_gaps || []).length > 0 ? (
                      (data.fd_gaps || []).map((g, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", textTransform: "capitalize" }}>{g.gap.replace(/_/g, " ")}</div>
                            <div style={{ fontSize: 11, color: "#78350f", marginTop: 3 }}>Detected in {g.count} call{g.count !== 1 ? "s" : ""}</div>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{g.count}×</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No FD gaps identified for this period.</div>
                    )}
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#f59e0b", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all gaps <ChevronRight size={12} />
            </div>
          </div>

          {/* Your Performance Summary */}
          <div style={{ ...card, padding: "18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Your Performance Summary</div>
            {[
              { label: "Total Calls Handled", value: data.summary.total_calls },
              { label: "Bookings Won", value: data.summary.bookings_won },
              { label: "Conversion Rate", value: `${data.summary.conversion_rate_pct}%` },
              { label: "Average Call Duration", value: data.glance.avg_call_duration },
              { label: "Follow-ups Assigned", value: data.summary.followups_assigned },
              { label: "Follow-ups Completed", value: data.summary.followups_completed },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>{value}</span>
              </div>
            ))}
            <div 
              onClick={() => setModalContent({
                title: "Detailed Performance Summary",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Total Calls Handled", desc: "Total reservation telephone interactions processed by the frontend agent.", value: data.summary.total_calls },
                      { label: "Bookings Won", desc: "Total successful reservations finalized and logged in the system.", value: data.summary.bookings_won },
                      { label: "Conversion Rate", desc: "Percentage of calls successfully converted to won bookings.", value: `${data.summary.conversion_rate_pct}%` },
                      { label: "Average Call Duration", desc: "Average time in minutes and seconds per conversation.", value: data.glance.avg_call_duration },
                      { label: "Follow-ups Assigned", desc: "Follow-up tasks automatically flagged by Nexrova for call-backs.", value: data.summary.followups_assigned },
                      { label: "Follow-ups Completed", desc: "Tasks actioned and completed.", value: data.summary.followups_completed },
                    ].map(({ label, desc, value }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1f2937" }}>{label}</div>
                          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{desc}</p>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View detailed performance <ChevronRight size={12} />
            </div>
          </div>

          {/* Recent Follow-ups */}
          <div style={{ ...card, padding: "18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12 }}>Recent Follow-ups</div>
            {data.pending_followups.slice(0, 3).map((r) => (
              <div key={r.call_id} style={{ padding: "7px 0", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{r.guest_name || "Unknown Guest"}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: 999, padding: "1px 7px" }}>Pending</span>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>Intent: {r.intent_score}/100</div>
              </div>
            ))}
            {data.pending_followups.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>No pending follow-ups</div>}
            <div 
              onClick={() => setModalContent({
                title: "All Follow-up Task History",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>Pending Queue ({data.pending_followups.length})</div>
                    {data.pending_followups.map(r => (
                      <div key={r.call_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.guest_name || "Unknown Guest"}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.guest_phone || "—"} | Intent: {r.intent_score}/100</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</div>
                        </div>
                        <button onClick={() => { markDone(r.call_id); setModalContent(null); }} style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Mark Done
                        </button>
                      </div>
                    ))}
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginTop: 8 }}>Completed Tasks ({data.completed_followups.length})</div>
                    {data.completed_followups.map(r => (
                      <div key={r.call_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid #bbf7d0", background: "#f0fdf4", borderRadius: 8, opacity: 0.8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.guest_name || "Unknown Guest"}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.guest_phone || "—"} | Intent: {r.intent_score}/100</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700 }}>Done</span>
                      </div>
                    ))}
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#3b82f6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all follow-ups <ChevronRight size={12} />
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-[14px]">

          {/* Hourly Call Distribution */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 12, flexShrink: 0 }}>Hourly Call Distribution</div>
            <div style={{ flex: 1, width: "100%", minWidth: 0, minHeight: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="Calls" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Zap size={13} color="#8b5cf6" />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>AI Insights For You</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insightsLoading ? (
                <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8, padding: 12 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  Generating AI Insights...
                </div>
              ) : (insightsData.insights && insightsData.insights.length > 0 ? insightsData.insights : ["No insights generated for today. Keep calling!"]).map((ins, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#f0fdf4" : i === 1 ? "#fffbeb" : "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i === 0 ? (
                      <CheckCircle2 size={11} color="#10b981" />
                    ) : i === 1 ? (
                      <Zap size={11} color="#f59e0b" />
                    ) : (
                      <AlertTriangle size={11} color="#ef4444" />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{ins}</div>
                </div>
              ))}
            </div>
            <div 
              onClick={() => setModalContent({
                title: "All AI Insights For Front Desk",
                children: (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {(insightsData.insights && insightsData.insights.length > 0 ? insightsData.insights : ["No insights generated for today. Keep calling!"]).map((ins, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "16px", background: "#f8fafc", borderRadius: 8, borderLeft: i === 0 ? "4px solid #10b981" : i === 1 ? "4px solid #f59e0b" : "4px solid #ef4444" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#f0fdf4" : i === 1 ? "#fffbeb" : "#fef2f2", flexShrink: 0 }}>
                          {i === 0 ? (
                            <CheckCircle2 size={14} color="#10b981" />
                          ) : i === 1 ? (
                            <Zap size={14} color="#f59e0b" />
                          ) : (
                            <AlertTriangle size={14} color="#ef4444" />
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{ins}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
              style={{ marginTop: 12, fontSize: 12, color: "#8b5cf6", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all insights <ChevronRight size={12} />
            </div>
          </div>

          {/* Coaching Tip */}
          <div style={{ ...card, background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", border: "1px solid #ddd6fe" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6366f1", marginBottom: 12 }}>Today's Coaching Tip</div>
            <div style={{ fontSize: 32, color: "#c7d2fe", fontWeight: 700, lineHeight: 0.8, marginBottom: 8 }}>"</div>
            <p style={{ fontSize: 13, color: "#334155", fontStyle: "italic", lineHeight: 1.6, borderLeft: "3px solid #6366f1", paddingLeft: 12 }}>
              {insightsLoading ? "Generating your coaching tip..." : (insightsData.coaching_tip || "Maintain standard greeting compliance and ensure every call ends with a clear next step or follow-up plan.")}
            </p>
            <div style={{ marginTop: 10, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>— Nexrova Coaching</div>
            <div 
              onClick={() => setModalContent({
                title: "Front Desk Coaching Tip Details",
                children: (
                  <div style={{ padding: 20, background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", borderRadius: 12, border: "1px solid #ddd6fe" }}>
                    <div style={{ fontSize: 48, color: "#c7d2fe", fontWeight: 700, lineHeight: 0.5 }}>"</div>
                    <p style={{ fontSize: 15, color: "#1e1b4b", fontStyle: "italic", lineHeight: 1.7, borderLeft: "4px solid #6366f1", paddingLeft: 16 }}>
                      {insightsLoading ? "Generating your coaching tip..." : (insightsData.coaching_tip || "Maintain standard greeting compliance and ensure every call ends with a clear next step or follow-up plan.")}
                    </p>
                    <div style={{ marginTop: 16, fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>— Nexrova Coaching Engine</div>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 12, lineHeight: 1.5 }}>
                      This coaching recommendation is dynamically generated by analyzing transcripts of call recordings received within the selected date range. Ensure that you capture the guest name, handle objections using price justification templates, and set follow-up tasks for potential leads.
                    </p>
                  </div>
                )
              })}
              style={{ marginTop: 10, fontSize: 12, color: "#6366f1", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all tips <ChevronRight size={12} />
            </div>
          </div>
        </div>

        {/* Follow-up Queue Table */}
        <div style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 14 }}>
            <RotateCcw size={13} color="#64748b" />
            <span>Pending Follow-up Action Queue</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Time", "Guest Name", "Phone", "Intent Score", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pending_followups.map(r => (
                  <tr key={r.call_id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}><span style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={13} color="#94a3b8" />{r.guest_name || "Not captured"}</span></td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{r.guest_phone || "—"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#6366f1" }}>{r.intent_score}/100</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: "#fffbeb", color: "#f59e0b", border: "1px solid #fde68a", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>pending</span></td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => markDone(r.call_id)} disabled={syncing[r.call_id]} style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        {syncing[r.call_id] ? "Saving..." : "Mark Done"}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.completed_followups.map(r => (
                  <tr key={r.call_id} style={{ borderBottom: "1px solid #f8fafc", opacity: 0.7 }}>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>{r.call_timestamp.replace("T", " ").slice(0, 16)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{r.guest_name || "Not captured"}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{r.guest_phone || "—"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#94a3b8" }}>{r.intent_score}/100</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: "#f0fdf4", color: "#10b981", border: "1px solid #bbf7d0", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>completed</span></td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Done</td>
                  </tr>
                ))}
                {data.pending_followups.length === 0 && data.completed_followups.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>No follow-ups recorded for this date.</td></tr>
                )}
              </tbody>
            </table>
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
      <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Dashboard Unavailable</div>
      <div style={{ fontSize: 13, color: "#64748b", maxWidth: 400 }}>{msg}</div>
      <button onClick={retry} style={{ padding: "8px 20px", borderRadius: 8, background: "#1e40af", color: "white", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>Retry</button>
    </div>
  );
}
