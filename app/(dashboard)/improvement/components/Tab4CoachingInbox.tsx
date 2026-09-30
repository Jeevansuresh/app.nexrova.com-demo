"use client";
import { useEffect, useState } from "react";
import { BASE } from "@/lib/api";
import { Mail, ShieldAlert, Award, Phone, DollarSign, Calendar, Landmark, AlertTriangle, CheckCircle2, Info, ChevronRight, RefreshCw } from "lucide-react";

interface Tab4Props {
  startDate: string;
  endDate: string;
  property: string;
}

export default function Tab4CoachingInbox({ startDate, endDate, property }: Tab4Props) {
  const [calls, setCalls] = useState<any[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallDetail, setSelectedCallDetail] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchInbox = async () => {
    setLoadingList(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const res = await fetch(`${BASE}/api/ai-coach/triage-inbox?start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
        if (data.length > 0 && !selectedCallId) {
          // Auto-select first call
          setSelectedCallId(data[0].call_uuid);
        }
      }
    } catch (err) {
      console.error("[TRIAGE FETCH ERROR]", err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${BASE}/api/ai-coach/call/${id}`, { credentials: "include" });
      if (res.ok) {
        setSelectedCallDetail(await res.json());
      }
    } catch (err) {
      console.error("[DETAIL FETCH ERROR]", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [startDate, endDate, property]);

  useEffect(() => {
    if (selectedCallId) {
      fetchDetail(selectedCallId);
    } else {
      setSelectedCallDetail(null);
    }
  }, [selectedCallId]);

  const cardStyle = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.12), 0 2px 8px -1px rgba(148, 163, 184, 0.08)",
    border: "1px solid #e2e8f0",
    padding: "20px",
    display: "flex",
    flexDirection: "column" as const
  };

  const isNoneCall = selectedCallDetail?.what_went_wrong?.toLowerCase().startsWith("none") ||
                     selectedCallDetail?.what_went_wrong?.toLowerCase().includes("no issues noted") ||
                     selectedCallDetail?.what_went_wrong?.toLowerCase().trim() === "none";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 24, height: "70vh", minHeight: "550px" }}>
      
      {/* Left Column: Inbox List */}
      <div style={{ ...cardStyle, overflow: "hidden", height: "100%" }}>
        <div style={{ paddingBottom: 14, borderBottom: "1px solid #e2e8f0", marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={18} color="#6366f1" /> Coaching Triage Inbox
          </h3>
          <p style={{ fontSize: 11, color: "#64748b", marginTop: 4, margin: 0 }}>
            Surfaces pending booking leads, low confidence logs, and high-priority compliance gaps.
          </p>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
          {loadingList && calls.length === 0 ? (
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
              Loading inbox...
            </div>
          ) : calls.length === 0 ? (
            <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, fontStyle: "italic", textAlign: "center", padding: 20 }}>
              Inbox clear! No high-priority triage cases in this period.
            </div>
          ) : (
            calls.map((call) => {
              const isSelected = selectedCallId === call.call_uuid;
              return (
                <div
                  key={call.call_uuid}
                  onClick={() => setSelectedCallId(call.call_uuid)}
                  style={{
                    padding: "14px",
                    borderRadius: 12,
                    border: `1px solid ${isSelected ? "#6366f1" : "#e2e8f0"}`,
                    background: isSelected ? "#f5f3ff" : "#fcfcfc",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#fff";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.background = "#fcfcfc";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: 13, color: isSelected ? "#4f46e5" : "#1e293b", display: "block" }}>
                        {call.caller_name}
                      </strong>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, display: "block" }}>
                        {new Date(call.call_timestamp).toLocaleDateString()} at {new Date(call.call_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <ChevronRight size={16} color={isSelected ? "#6366f1" : "#cbd5e1"} />
                  </div>

                  {/* Badges & Revenue */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {call.priority === "High" && (
                        <span style={{ fontSize: 9, background: "#fef2f2", color: "#b91c1c", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          HIGH PRIORITY
                        </span>
                      )}
                      {call.price_sensitive && call.outcome !== "won" && (
                        <span style={{ fontSize: 9, background: "#fffbeb", color: "#b45309", padding: "2px 6px", borderRadius: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                          <Info size={10} /> RATE RESISTANCE
                        </span>
                      )}
                      <span style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700,
                        background: call.outcome === "won" ? "#ecfdf5" : call.outcome === "lost" ? "#fef2f2" : "#fffbeb",
                        color: call.outcome === "won" ? "#047857" : call.outcome === "lost" ? "#b91c1c" : "#b45309",
                        textTransform: "uppercase"
                      }}>
                        {call.outcome}
                      </span>
                    </div>

                    <strong style={{ fontSize: 13, color: call.outcome === "won" ? "#10b981" : "#e11d48" }}>
                      ₹{call.estimated_revenue_inr.toLocaleString()}
                    </strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Coaching Panel */}
      <div style={{ ...cardStyle, overflow: "hidden", height: "100%" }}>
        {loadingDetail && (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#64748b", gap: 10 }}>
            <RefreshCw className="animate-spin" size={18} />
            <span>Loading detailed coaching analysis...</span>
          </div>
        )}

        {!loadingDetail && !selectedCallDetail && (
          <div style={{ display: "flex", height: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", textAlign: "center", padding: 40, gap: 16 }}>
            <Award size={48} strokeWidth={1} color="#a5b4fc" />
            <div>
              <strong style={{ color: "#475569", fontSize: 14.5, display: "block", marginBottom: 6 }}>Triage Coaching Panel</strong>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, display: "block" }}>
                Select a high-priority call from the inbox list to review detailed diagnostic feedback, transcript dialogues, and recommended coach scripts.
              </span>
            </div>
          </div>
        )}

        {!loadingDetail && selectedCallDetail && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto", gap: 16, paddingRight: 4 }}>
            {/* Panel Header */}
            <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 850, color: "#0f172a", margin: 0 }}>
                    {selectedCallDetail.caller_name}
                  </h3>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11.5, color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={13} /> {new Date(selectedCallDetail.call_timestamp).toLocaleDateString()}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Landmark size={13} /> {selectedCallDetail.property_called.toUpperCase()}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={13} /> {selectedCallDetail.outcome.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Intent Score</span>
                  <span style={{
                    fontSize: 16, fontWeight: 850, padding: "2px 8px", borderRadius: 6,
                    background: selectedCallDetail.intent_score >= 70 ? "#ecfdf5" : selectedCallDetail.intent_score >= 45 ? "#fffbeb" : "#fef2f2",
                    color: selectedCallDetail.intent_score >= 70 ? "#047857" : selectedCallDetail.intent_score >= 45 ? "#b45309" : "#b91c1c"
                  }}>
                    {selectedCallDetail.intent_score}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Resistance Advisory Banner */}
            {selectedCallDetail.price_sensitive && selectedCallDetail.outcome !== "won" && (
              <div style={{
                padding: "12px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 12,
                display: "flex",
                alignItems: "flex-start",
                gap: 10
              }}>
                <Info size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 12, color: "#78350f", display: "block" }}>Rate Resistance Detected</strong>
                  <span style={{ fontSize: 11.5, color: "#92400e", display: "block", marginTop: 2, lineHeight: 1.4 }}>
                    This customer negotiated room rates, requested discounts, or disputed pricing. Review the transcript turns below to evaluate if the agent pitched value correctly or offered a structured discount strategy.
                  </span>
                </div>
              </div>
            )}

            {/* Financial Highlight */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px",
              background: selectedCallDetail.outcome === "lost" ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${selectedCallDetail.outcome === "lost" ? "#fecaca" : "#bbf7d0"}`,
              borderRadius: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: selectedCallDetail.outcome === "lost" ? "#991b1b" : "#166534" }}>
                <DollarSign size={16} />
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>
                  {selectedCallDetail.outcome === "lost" ? "Lost Booking Value" : "Estimated Booking Value"}
                </span>
              </div>
              <strong style={{ fontSize: 16, color: selectedCallDetail.outcome === "lost" ? "#dc2626" : "#15803d" }}>
                ₹{selectedCallDetail.estimated_revenue_inr.toLocaleString()}
              </strong>
            </div>

            {/* AI Coaching Boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Left Box (Critique) */}
              <div style={{
                padding: "14px",
                background: isNoneCall ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${isNoneCall ? "#dcfce7" : "#fee2e2"}`,
                borderRadius: 12, display: "flex", flexDirection: "column", gap: 6
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  color: isNoneCall ? "#166534" : "#991b1b",
                  fontWeight: 700, fontSize: 12
                }}>
                  {isNoneCall ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{isNoneCall ? "Performance Highlights" : "What Went Wrong"}</span>
                </div>
                <p style={{ fontSize: 12, color: isNoneCall ? "#14532d" : "#7f1d1d", margin: 0, lineHeight: 1.45 }}>
                  {selectedCallDetail.what_went_wrong}
                </p>
              </div>

              {/* Right Box (Suggested Action Script) */}
              <div style={{
                padding: "14px", background: "#f0fdf4", border: "1px solid #dcfce7",
                borderRadius: 12, display: "flex", flexDirection: "column", gap: 6
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: 12 }}>
                  <Phone size={14} />
                  <span>{isNoneCall ? "Appreciation" : "Suggested Action Script"}</span>
                </div>
                <p style={{ fontSize: 12, color: "#14532d", margin: 0, lineHeight: 1.45, fontStyle: isNoneCall ? "normal" : "italic" }}>
                  {isNoneCall
                    ? "Excellent compliance and execution! The front desk agent properly handled all requirements and locked in the booking details flawlessly."
                    : `"${selectedCallDetail.suggested_action}"`
                  }
                </p>
              </div>
            </div>

            {/* Call Transcript */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 750, color: "#1e293b", marginBottom: 6 }}>Call Transcript</h4>
              <div style={{
                border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px",
                background: "#fafafa", maxHeight: "180px", overflowY: "auto",
                fontSize: 12, lineHeight: 1.5, color: "#334155",
                whiteSpace: "pre-wrap"
              }}>
                {selectedCallDetail.transcript_text}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
