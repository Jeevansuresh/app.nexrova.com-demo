"use client";
import { useEffect, useState } from "react";
import { BASE } from "@/lib/api";
import { X, Phone, DollarSign, Calendar, Landmark, AlertTriangle, Filter, CheckCircle2, Info, ChevronRight } from "lucide-react";

interface Tab1Props {
  startDate: string;
  endDate: string;
  property: string;
}

function formatFdGaps(fdGaps: unknown): string {
  let gaps: string[] = [];

  if (Array.isArray(fdGaps)) {
    gaps = fdGaps;
  } else if (typeof fdGaps === "string") {
    try {
      const parsed = JSON.parse(fdGaps);
      if (Array.isArray(parsed)) {
        gaps = parsed;
      }
    } catch {
      gaps = [];
    }
  }

  return gaps.length > 0 ? gaps.join(", ").replace(/_/g, " ") : "None";
}

export default function Tab1FinancialLeakage({ startDate, endDate, property }: Tab1Props) {
  // Original leakage/bleeding lists
  const [leakageCalls, setLeakageCalls] = useState([]);
  const [bleedingCalls, setBleedingCalls] = useState([]);
  const [loadingLeakage, setLoadingLeakage] = useState(false);
  const [loadingBleeding, setLoadingBleeding] = useState(false);
  const [activeGap, setActiveGap] = useState("all");
  
  // Standard Modal states
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [loadingModalDetail, setLoadingModalDetail] = useState(false);

  // New Overview & Drilldown States
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [selectedGap, setSelectedGap] = useState<string | null>(null);
  const [gapCalls, setGapCalls] = useState([]);
  const [loadingGapCalls, setLoadingGapCalls] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallDetail, setSelectedCallDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Overview stats
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const res = await fetch(`${BASE}/api/ai-coach/gap-overview?start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (res.ok) setOverview(await res.json());
    } catch (err) {
      console.error("Overview Fetch Error:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch Calls for a specific gap
  const fetchGapCalls = async (gap: string) => {
    setLoadingGapCalls(true);
    setSelectedCallId(null);
    setSelectedCallDetail(null);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const res = await fetch(`${BASE}/api/ai-coach/gap-calls?gap_type=${gap}&start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (res.ok) setGapCalls(await res.json());
    } catch (err) {
      console.error("Gap Calls Fetch Error:", err);
    } finally {
      setLoadingGapCalls(false);
    }
  };

  // Fetch details of a call under a specific gap (requests specific LLM audit context)
  const handleGapCallClick = async (callUuid: string) => {
    setSelectedCallId(callUuid);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${BASE}/api/ai-coach/call/${callUuid}?gap_type=${selectedGap}`, { credentials: "include" });
      if (res.ok) setSelectedCallDetail(await res.json());
    } catch (err) {
      console.error("Gap Detail Fetch Error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Original fetchers
  const fetchLeakageData = async () => {
    setLoadingLeakage(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const leakageRes = await fetch(`${BASE}/api/ai-coach/leakage-calls?gap=${activeGap}&start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (leakageRes.ok) setLeakageCalls(await leakageRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeakage(false);
    }
  };

  const fetchBleedingData = async () => {
    setLoadingBleeding(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const bleedingRes = await fetch(`${BASE}/api/ai-coach/bleeding?start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (bleedingRes.ok) setBleedingCalls(await bleedingRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBleeding(false);
    }
  };

  const handleCallClick = async (callUuid: string) => {
    setLoadingModalDetail(true);
    try {
      const res = await fetch(`${BASE}/api/ai-coach/call/${callUuid}`, { credentials: "include" });
      if (res.ok) {
        setSelectedCall(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModalDetail(false);
    }
  };

  // Handle updates
  useEffect(() => {
    fetchOverview();
    if (selectedGap) {
      fetchGapCalls(selectedGap);
    }
  }, [startDate, endDate, property]);

  useEffect(() => {
    fetchLeakageData();
  }, [activeGap, startDate, endDate, property]);

  useEffect(() => {
    fetchBleedingData();
    const interval = setInterval(fetchBleedingData, 10000);
    return () => clearInterval(interval);
  }, [startDate, endDate, property]);

  const gapCards = [
    { id: "process_intake", label: "Process Intake Gaps", count: overview?.process_intake || 0, desc: "Passive intake failures", color: "#6366f1", bg: "#f5f3ff", border: "#ddd6fe" },
    { id: "inventory", label: "Inventory Gaps", count: overview?.inventory || 0, desc: "PMS checks missed", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { id: "financial", label: "Financial Gaps", count: overview?.financial || 0, desc: "Pricing quotes missing", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
    { id: "sales", label: "Sales Gaps", count: overview?.sales || 0, desc: "Value pitch pushbacks", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
    { id: "diversion", label: "Diversion Gaps", count: overview?.diversion || 0, desc: "Cross-sells ignored", color: "#fbbf24", bg: "#fffbeb", border: "#fef3c7" },
    { id: "closing", label: "Closing Gaps", count: overview?.closing || 0, desc: "Commitment failures", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  ];

  const CARD_BG = "#fff";
  const CARD_BORDER = "#e2e8f0";
  const PRIMARY_COLOR = "#6366f1";
  
  const cardStyle = {
    background: CARD_BG,
    borderRadius: 16,
    boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.12), 0 2px 8px -1px rgba(148, 163, 184, 0.08)",
    border: `1px solid ${CARD_BORDER}`,
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "480px"
  };

  const selectedGapCard = gapCards.find(c => c.id === selectedGap);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. Gap Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
        {/* Total Calls Audited Card */}
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(148, 163, 184, 0.05)"
        }}>
          <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>TOTAL AUDITED</span>
          <strong style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
            {loadingOverview ? "..." : (overview?.total_calls || 0)}
          </strong>
          <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Booking intent calls</span>
        </div>

        {gapCards.map(c => {
          const isSelected = selectedGap === c.id;
          return (
            <div
              key={c.id}
              onClick={() => {
                if (isSelected) {
                  setSelectedGap(null);
                } else {
                  setSelectedGap(c.id);
                  fetchGapCalls(c.id);
                }
              }}
              style={{
                background: isSelected ? c.bg : "#fff",
                border: `1px solid ${isSelected ? c.border : "#e2e8f0"}`,
                borderRadius: 14, padding: "16px", cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(148, 163, 184, 0.05)",
                transition: "all 0.15s ease-in-out"
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = c.border;
                  e.currentTarget.style.background = c.bg;
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#fff";
                }
              }}
            >
              <span style={{ fontSize: 9.5, color: isSelected ? c.color : "#64748b", fontWeight: 700, letterSpacing: "0.02em" }}>
                {c.label.toUpperCase()}
              </span>
              <strong style={{ fontSize: 24, fontWeight: 900, color: c.color, marginTop: 8 }}>
                {loadingOverview ? "..." : c.count}
              </strong>
              <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{c.desc}</span>
            </div>
          );
        })}
      </div>

      {/* 2. Workspace Content (Swapping standard view vs. drilldown mode) */}
      {!selectedGap ? (
        // Standard Side-by-side Layout
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Leakage List Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Booking Lost Call Details</h3>
              
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Filter size={13} color={PRIMARY_COLOR} style={{ position: "absolute", left: "10px", pointerEvents: "none" }} />
                <select
                  value={activeGap}
                  onChange={ev => setActiveGap(ev.target.value)}
                  style={{
                    padding: "6px 28px 6px 28px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    outline: "none",
                    appearance: "none"
                  }}
                >
                  <option value="all">All Gaps</option>
                  <option value="no_proactive_intake">No Proactive Intake</option>
                  <option value="no_booking_action_closed">No Booking Action Closed</option>
                  <option value="cross_sell_not_offered">Cross Sell Not Offered</option>
                  <option value="other">Other Gaps</option>
                </select>
                <span style={{ position: "absolute", right: "10px", color: "#94a3b8", fontSize: "9px", pointerEvents: "none" }}>▼</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1, maxHeight: "380px" }}>
              {loadingLeakage && leakageCalls.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading...</div>
              ) : leakageCalls.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic", textAlign: "center", padding: 20 }}>
                  No lost calls with this gap filter recorded in this range.
                </div>
              ) : (
                leakageCalls.map((call: any) => (
                  <div 
                    key={call.call_uuid}
                    onClick={() => handleCallClick(call.call_uuid)}
                    style={{
                      display: "flex", flexDirection: "column", padding: "16px",
                      background: "#fcfcfc", border: "1px solid #e2e8f0", borderRadius: 12,
                      cursor: "pointer", transition: "transform 0.15s ease-in-out, box-shadow 0.15s",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#334155", fontSize: 14 }}>{call.caller_name || "Unknown Enquirer"}</strong>
                      <span style={{ fontWeight: 800, color: "#dc2626", fontSize: 15 }}>
                        {call.estimated_revenue_inr > 0 ? `₹${call.estimated_revenue_inr.toLocaleString()}` : "Value Not Extracted"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.4 }}>
                      <strong>Gaps Identified: </strong> {formatFdGaps(call.fd_gaps)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                        Called at: {new Date(call.call_timestamp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        LOST
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bleeding Opportunities Card */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Top Bleeding Opportunities (Unresolved Gaps)</h3>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>Active pending calls containing operational gaps sorted by value.</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1, maxHeight: "380px" }}>
              {loadingBleeding && bleedingCalls.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading...</div>
              ) : bleedingCalls.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic" }}>
                  No bleeding opportunities found.
                </div>
              ) : (
                bleedingCalls.map((call: any) => (
                  <div 
                    key={call.call_uuid} 
                    onClick={() => handleCallClick(call.call_uuid)}
                    style={{
                      display: "flex", flexDirection: "column", padding: "16px",
                      background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 12,
                      cursor: "pointer", transition: "transform 0.15s ease-in-out, box-shadow 0.15s",
                      boxShadow: "0 1px 3px rgba(239, 68, 68, 0.05)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(239, 68, 68, 0.05)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#991b1b", fontSize: 14 }}>{call.caller_name || "Unknown Enquirer"}</strong>
                      <span style={{ fontWeight: 800, color: "#ef4444", fontSize: 15 }}>₹{call.estimated_revenue_inr.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 8, lineHeight: 1.4 }}>
                      <strong>Gaps Identified: </strong> {formatFdGaps(call.fd_gaps)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: "#b91c1c", fontStyle: "italic" }}>
                        Called at: {new Date(call.call_timestamp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        PENDING
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // GAP DRILLDOWN WORKSPACE (Split-Pane layout mapping specifically clicked category)
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fff", padding: "14px 24px", borderRadius: 16,
            border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(148, 163, 184, 0.04)"
          }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 850, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: selectedGapCard?.color }} />
                Gap Drilldown Workspace: <span style={{ color: selectedGapCard?.color }}>{selectedGapCard?.label}</span>
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, marginTop: 3 }}>
                Reviewing transcript dialogue turns and LLM audit reports flagged under {selectedGapCard?.desc}.
              </p>
            </div>
            <button
              onClick={() => setSelectedGap(null)}
              style={{
                background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px",
                fontSize: 12, fontWeight: 700, color: "#475569", cursor: "pointer", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; }}
            >
              Exit Drilldown
            </button>
          </div>

          {/* Drilldown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, height: "580px" }}>
            {/* Left list of calls */}
            <div style={{ ...cardStyle, padding: "20px", height: "100%", overflowY: "auto" }}>
              <div style={{ marginBottom: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: "#334155", margin: 0 }}>
                  Drilldown Call Inbox ({gapCalls.length})
                </h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {loadingGapCalls ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#64748b" }}>Loading gap calls...</div>
                ) : gapCalls.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#94a3b8", fontStyle: "italic" }}>
                    No calls categorized under this gap.
                  </div>
                ) : (
                  gapCalls.map(call => {
                    const isSelected = selectedCallId === call.call_uuid;
                    return (
                      <div
                        key={call.call_uuid}
                        onClick={() => handleGapCallClick(call.call_uuid)}
                        style={{
                          padding: "12px 14px", borderRadius: 12,
                          border: `1px solid ${isSelected ? selectedGapCard?.color : "#e2e8f0"}`,
                          background: isSelected ? selectedGapCard?.bg : "#fcfcfc",
                          cursor: "pointer", transition: "all 0.15s",
                          display: "flex", flexDirection: "column", gap: 6
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: 13, color: isSelected ? selectedGapCard?.color : "#1e293b" }}>
                            {call.caller_name}
                          </strong>
                          <span style={{ fontSize: 13, fontWeight: 800, color: call.outcome === "won" ? "#10b981" : "#e11d48" }}>
                            ₹{call.estimated_revenue_inr.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, color: "#94a3b8" }}>
                          <span>{new Date(call.call_timestamp).toLocaleDateString()} at {new Date(call.call_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{
                            textTransform: "uppercase", fontWeight: 700, fontSize: 9,
                            color: call.outcome === "won" ? "#047857" : call.outcome === "lost" ? "#b91c1c" : "#b45309"
                          }}>
                            {call.outcome}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right detailed coaching workspace */}
            <div style={{ ...cardStyle, padding: "20px", height: "100%", overflowY: "auto" }}>
              {loadingDetail && (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#64748b", gap: 10 }}>
                  <span>Querying LLM analysis for {selectedGapCard?.label}...</span>
                </div>
              )}

              {!loadingDetail && !selectedCallDetail && (
                <div style={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", textAlign: "center", padding: 40, gap: 12 }}>
                  <Info size={40} color="#a5b4fc" />
                  <div>
                    <strong style={{ color: "#475569", fontSize: 14, display: "block", marginBottom: 4 }}>Select a Call</strong>
                    <span style={{ fontSize: 12, lineHeight: 1.5, display: "block" }}>
                      Select any call from the left listing. The AI auditor will dynamically scan the script and isolate why it triggered a "{selectedGapCard?.label}" violation.
                    </span>
                  </div>
                </div>
              )}

              {!loadingDetail && selectedCallDetail && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Call Meta */}
                  <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 850, color: "#0f172a", margin: 0 }}>
                        {selectedCallDetail.caller_name}
                      </h3>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11, color: "#64748b" }}>
                        <span>{selectedCallDetail.property_called.toUpperCase()}</span>
                        <span>•</span>
                        <span>{selectedCallDetail.outcome.toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(selectedCallDetail.call_timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>ESTIMATED REVENUE</span>
                      <strong style={{ fontSize: 16, color: "#0f172a" }}>₹{selectedCallDetail.estimated_revenue_inr.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Isolated Gap Context Container */}
                  <div style={{
                    padding: "16px", background: selectedGapCard?.bg,
                    border: `1px solid ${selectedGapCard?.border}`, borderRadius: 14,
                    display: "flex", flexDirection: "column", gap: 8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: selectedGapCard?.color, fontWeight: 800, fontSize: 12 }}>
                      <AlertTriangle size={14} />
                      <span>ISOLATED GAP AUDIT: {selectedGapCard?.label.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                      {selectedCallDetail.what_went_wrong}
                    </div>
                  </div>

                  {/* Suggested Script */}
                  <div style={{
                    padding: "16px", background: "#f0fdf4",
                    border: "1px solid #dcfce7", borderRadius: 14,
                    display: "flex", flexDirection: "column", gap: 8
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 800, fontSize: 12 }}>
                      <CheckCircle2 size={14} />
                      <span>SUGGESTED ACTION SCRIPT</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#14532d", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                      "{selectedCallDetail.suggested_action}"
                    </p>
                  </div>

                  {/* Call Transcript */}
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 8 }}>Audit Call Transcript</h4>
                    <div style={{
                      border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px",
                      background: "#fafafa", maxHeight: "180px", overflowY: "auto",
                      fontSize: 12, lineHeight: 1.6, color: "#475569", whiteSpace: "pre-wrap"
                    }}>
                      {selectedCallDetail.transcript_text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Original Call Detail Modal Overlay (For Standard View) */}
      {selectedCall && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "800px", maxWidth: "90%",
            height: "80vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0", overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#f8fafc"
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {selectedCall.caller_name}
                </h3>
                <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={13} /> {new Date(selectedCall.call_timestamp).toLocaleDateString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Landmark size={13} /> {selectedCall.property_called.toUpperCase()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Phone size={13} /> {selectedCall.outcome.toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCall(null)}
                style={{
                  border: "none", background: "transparent", cursor: "pointer",
                  color: "#64748b", padding: 6, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Financial Highlight */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", background: selectedCall.outcome === "lost" ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${selectedCall.outcome === "lost" ? "#fecaca" : "#bbf7d0"}`,
                borderRadius: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: selectedCall.outcome === "lost" ? "#991b1b" : "#166534" }}>
                  <DollarSign size={20} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {selectedCall.outcome === "lost" ? "Lost Booking Value" : "Estimated Booking Value"}
                  </span>
                </div>
                <strong style={{ fontSize: 20, color: selectedCall.outcome === "lost" ? "#dc2626" : "#15803d" }}>
                  {selectedCall.estimated_revenue_inr > 0 ? `₹${selectedCall.estimated_revenue_inr.toLocaleString()}` : "Value Not Extracted"}
                </strong>
              </div>

              {/* AI Coaching Boxes */}
              {(() => {
                const isNoneCall = selectedCall.what_went_wrong?.toLowerCase().startsWith("none") ||
                                   selectedCall.what_went_wrong?.toLowerCase().includes("no issues noted") ||
                                   selectedCall.what_went_wrong?.toLowerCase().trim() === "none";
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Left Box */}
                    <div style={{
                      padding: "16px", 
                      background: isNoneCall ? "#ecfdf5" : "#fef2f2", 
                      border: `1px solid ${isNoneCall ? "#dcfce7" : "#fee2e2"}`,
                      borderRadius: 12, display: "flex", flexDirection: "column", gap: 8
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6, 
                        color: isNoneCall ? "#166534" : "#991b1b", 
                        fontWeight: 700, 
                        fontSize: 13 
                      }}>
                        {isNoneCall ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                        <span>{isNoneCall ? "Performance Highlights" : "What Went Wrong"}</span>
                      </div>
                      <p style={{ fontSize: 13, color: isNoneCall ? "#14532d" : "#7f1d1d", margin: 0, lineHeight: 1.5 }}>
                        {selectedCall.what_went_wrong}
                      </p>
                    </div>

                    {/* Right Box */}
                    <div style={{
                      padding: "16px", background: "#f0fdf4", border: "1px solid #dcfce7",
                      borderRadius: 12, display: "flex", flexDirection: "column", gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: 13 }}>
                        <Phone size={15} />
                        <span>{isNoneCall ? "Appreciation" : "Suggested Action Script"}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#14532d", margin: 0, lineHeight: 1.5, fontStyle: isNoneCall ? "normal" : "italic" }}>
                        {isNoneCall 
                          ? "Excellent compliance and execution! The front desk agent properly handled all requirements and locked in the booking details flawlessly." 
                          : `"${selectedCall.suggested_action}"`
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Call Transcript */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Call Transcript</h4>
                <div style={{
                  border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px",
                  background: "#fafafa", maxHeight: "250px", overflowY: "auto",
                  fontSize: 12.5, lineHeight: 1.6, color: "#334155",
                  whiteSpace: "pre-wrap"
                }}>
                  {selectedCall.transcript_text}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px", borderTop: "1px solid #e2e8f0",
              display: "flex", justifyContent: "flex-end", background: "#f8fafc"
            }}>
              <button 
                onClick={() => setSelectedCall(null)}
                style={{
                  background: PRIMARY_COLOR, color: "#fff", border: "none",
                  padding: "8px 20px", borderRadius: 8, fontSize: 13,
                  fontWeight: 600, cursor: "pointer"
                }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
