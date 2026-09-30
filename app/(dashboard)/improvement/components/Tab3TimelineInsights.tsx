"use client";
import { useEffect, useState } from "react";
import { BASE } from "@/lib/api";
import { Brain, Sparkles, TrendingUp, BarChart3, AlertCircle, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  BarChart
} from "recharts";

interface Tab3Props {
  startDate: string;
  endDate: string;
  property: string;
}

export default function Tab3TimelineInsights({ startDate, endDate, property }: Tab3Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const res = await fetch(`${BASE}/api/ai-coach/timeline-insights?start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("[TIMELINE FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineData();
  }, [startDate, endDate, property]);

  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.12), 0 2px 8px -1px rgba(148, 163, 184, 0.08)",
    border: "1px solid #e2e8f0",
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const
  };

  if (loading && !data) {
    return (
      <div style={{ display: "flex", height: 350, alignItems: "center", justifyContent: "center", color: "#64748b", gap: 10 }}>
        <RefreshCw className="animate-spin" size={20} />
        <span>Loading AI Timeline Insights...</span>
      </div>
    );
  }

  // Handle empty / null data gracefully by defining mock/placeholder states instead of collapsing the page
  const hasData = data && data.timeline && data.timeline.length > 0;
  
  const summary = hasData ? data.summary : {
    narrative: "No call records found for the selected dates. Please adjust your filters or date range to generate AI timeline coaching feedback.",
    anomalies: ["No critical gap surges or compliance alerts detected."]
  };
  
  const timeline = hasData ? data.timeline : [];

  // Parse narrative into points-wise list
  const narrativePoints = summary.narrative
    ? summary.narrative
        .split(/(?<=[.!?])\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* Top Row: AI Narrative Summary & Anomalies */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
        
        {/* AI narrative */}
        <div style={{
          ...cardStyle,
          background: "linear-gradient(to bottom right, #ffffff, #faf5ff)",
          borderLeft: "6px solid #8b5cf6",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f5f3ff", display: "flex", justifyContent: "center", alignItems: "center", color: "#8b5cf6" }}>
              <Brain size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>AI-Generated Narrative Summary</h3>
              <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>Performance & trends analyzed by LLM</span>
            </div>
          </div>
          
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "#312e81", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 6, zIndex: 1 }}>
            {narrativePoints.map((pt: string, idx: number) => (
              <li key={idx} style={{ fontWeight: 500 }}>
                {pt}
              </li>
            ))}
          </ul>

          <div style={{ position: "absolute", right: -20, bottom: -20, opacity: 0.03, color: "#8b5cf6", pointerEvents: "none" }}>
            <Sparkles size={120} />
          </div>
        </div>

        {/* Gap Surges / Anomalies */}
        <div style={{
          ...cardStyle,
          background: "linear-gradient(to bottom right, #ffffff, #fffbeb)",
          borderLeft: "6px solid #f59e0b"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef3c7", display: "flex", justifyContent: "center", alignItems: "center", color: "#d97706" }}>
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#78350f", margin: 0 }}>Trend Anomalies & Gap Surges</h3>
              <span style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>Unusual operational failures</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {summary.anomalies.map((anomaly: string, index: number) => (
              <div 
                key={index}
                style={{
                  fontSize: 12,
                  padding: "8px 12px",
                  background: "#fff",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  color: "#92400e",
                  lineHeight: 1.4,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8
                }}
              >
                <span style={{ color: "#d97706", fontWeight: "bold" }}>•</span>
                <span>{anomaly}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Charts Row: Side-by-side Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        
        {/* Volume vs. Conversion Correlation Chart */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} color="#6366f1" /> Volume vs. Conversion Correlation
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>
              Analyze if high call volumes correlate with declines in booking conversion rate.
            </p>
          </div>

          <div style={{ width: "100%", height: 300, position: "relative" }}>
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#6366f1" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    name="Total Calls"
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    name="Conversion Rate"
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="total_calls" 
                    fill="#818cf8" 
                    name="Total Enquiry Volume" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="conversion_rate" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    name="Booking Conversion Rate (%)" 
                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic", border: "1px dashed #e2e8f0", borderRadius: 12 }}>
                No timeline records available to chart.
              </div>
            )}
          </div>
        </div>

        {/* Daily Gap Surges Breakdown Chart */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} color="#6366f1" /> Daily Gaps & Failure Points Breakdown
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>
              A stacked daily timeline visualizing which operational gaps surged on specific dates.
            </p>
          </div>

          <div style={{ width: "100%", height: 300, position: "relative" }}>
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={48} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                  />
                  <Bar dataKey="process_intake" name="Intake" stackId="a" fill="#6366f1" />
                  <Bar dataKey="inventory" name="Inventory" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="financial" name="Financial" stackId="a" fill="#ec4899" />
                  <Bar dataKey="sales" name="Sales" stackId="a" fill="#ef4444" />
                  <Bar dataKey="diversion" name="Diversion" stackId="a" fill="#fbbf24" />
                  <Bar dataKey="closing" name="Closing" stackId="a" fill="#10b981" />
                  <Bar dataKey="other" name="Other" stackId="a" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic", border: "1px dashed #e2e8f0", borderRadius: 12 }}>
                No gap breakdown data available to chart.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
