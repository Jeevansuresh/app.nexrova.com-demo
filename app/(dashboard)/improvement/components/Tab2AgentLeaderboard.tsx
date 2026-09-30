"use client";
import { useEffect, useState } from "react";
import { BASE } from "@/lib/api";
import { Award, Sparkles, HandCoins, Users, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, Calendar, Phone, Landmark, DollarSign, AlertTriangle, X, CheckSquare, MessageSquare, ShieldCheck, Flame, Info } from "lucide-react";

interface Tab2Props {
  startDate: string;
  endDate: string;
  property: string;
}

export default function Tab2AgentLeaderboard({ startDate, endDate, property }: Tab2Props) {
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Expanded property row state (accordion)
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null);
  
  // Drilldown list modal state
  const [drilldownModal, setDrilldownModal] = useState<{ title: string; calls: any[]; context: "negotiation" | "segment" } | null>(null);
  
  // Modal states for full call detail
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [selectedCallContext, setSelectedCallContext] = useState<"negotiation" | "segment" | "none">("none");
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const p = property !== "all" ? `&property=${property}` : "";
      const res = await fetch(`${BASE}/api/ai-coach/behavior-audit?start=${startDate}&end=${endDate}${p}`, { credentials: "include" });
      if (res.ok) {
        setAuditData(await res.json());
      }
    } catch (err) {
      console.error("[AUDIT FETCH ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallClick = async (callUuid: string, context: "negotiation" | "segment" | "none" = "none") => {
    setLoadingDetail(true);
    setSelectedCallContext(context);
    try {
      const res = await fetch(`${BASE}/api/ai-coach/call/${callUuid}`, { credentials: "include" });
      if (res.ok) {
        setSelectedCall(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(fetchAuditData, 10000);
    return () => clearInterval(interval);
  }, [startDate, endDate, property]);

  const CARD_BG = "#fff";
  const CARD_BORDER = "#e2e8f0";
  const PRIMARY_COLOR = "#6366f1"; // Indigo
  const EMERALD = "#10b981"; // Green
  const ROSE = "#f43f5e"; // Rose
  const AMBER = "#f59e0b"; // Amber
  
  const cardStyle = {
    background: CARD_BG,
    borderRadius: 16,
    boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.12), 0 2px 8px -1px rgba(148, 163, 184, 0.08)",
    border: `1px solid ${CARD_BORDER}`,
    padding: "24px",
    display: "flex",
    flexDirection: "column" as const
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
    if (score >= 50) return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" };
    return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
  };

  const formatPropertyName = (name: string) => {
    if (name === "gandhi") return "Oasis Grand Reservation";
    if (name === "ridhi") return "Oasis Palm Reservation";
    if (name === "qbyk") return "Oasis Boutique Reservation";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const toggleExpand = (propName: string) => {
    if (expandedProperty === propName) {
      setExpandedProperty(null);
    } else {
      setExpandedProperty(propName);
    }
  };

  // Collect all unique segments found across all properties
  const allSegments = Array.from(
    new Set(
      auditData.flatMap((prop) => Object.keys(prop.segments || {}))
    )
  );

  // Compute aggregate KPI stats across all properties combined
  const totalCalls = auditData.reduce((acc, curr) => acc + curr.total_calls, 0);
  
  const totalGreeted = auditData.reduce((acc, curr) => acc + ((curr.greeting_rate / 100) * curr.total_calls), 0);
  const totalFormatOk = auditData.reduce((acc, curr) => acc + ((curr.format_rate / 100) * curr.total_calls), 0);
  const totalListeningOk = auditData.reduce((acc, curr) => acc + ((curr.listening_rate / 100) * curr.total_calls), 0);
  
  const overallGreetingRate = totalCalls > 0 ? Math.round((totalGreeted / totalCalls) * 100) : 0;
  const overallFormatRate = totalCalls > 0 ? Math.round((totalFormatOk / totalCalls) * 100) : 0;
  const overallListeningRate = totalCalls > 0 ? Math.round((totalListeningOk / totalCalls) * 100) : 0;
  const overallQualityScore = totalCalls > 0 ? Math.round(((totalGreeted / totalCalls) * 0.2 + (totalFormatOk / totalCalls) * 0.5 + (totalListeningOk / totalCalls) * 0.3) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      
      {/* Overview Intro Banner */}
      <div style={{
        ...cardStyle,
        background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
        color: "#fff",
        border: "none",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={22} style={{ color: "#a5b4fc" }} /> Property Behavioral Compliance & Scoring Auditor
          </h2>
          <p style={{ fontSize: 13, color: "#c7d2fe", marginTop: 6, marginBottom: 0, maxWidth: "600px" }}>
            Audit brand greeting compliance, formatting quality, and price closing metrics grouped by property. Click any metric block or cell to inspect the specific calls behind the numbers.
          </p>
        </div>
        <div style={{
          position: "absolute", right: -50, bottom: -50, width: 200, height: 200,
          background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none"
        }} />
      </div>

      {/* Aggregate KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {/* Card 1: Audited Calls */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", display: "flex", justifyContent: "center", alignItems: "center", color: "#3b82f6" }}>
            <Phone size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Audited Calls</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{totalCalls}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>For selected range</div>
          </div>
        </div>

        {/* Card 2: Greeting Compliance */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ecfdf5", display: "flex", justifyContent: "center", alignItems: "center", color: "#10b981" }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Greeting Compliance</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{overallGreetingRate}%</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Overall greeting rate</div>
          </div>
        </div>

        {/* Card 3: Format Compliance */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#faf5ff", display: "flex", justifyContent: "center", alignItems: "center", color: "#8b5cf6" }}>
            <CheckSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Format Compliance</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{overallFormatRate}%</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Script guidelines rate</div>
          </div>
        </div>

        {/* Card 4: Listening Excellence */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdfa", display: "flex", justifyContent: "center", alignItems: "center", color: "#0d9488" }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Listening Excellence</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{overallListeningRate}%</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>No repeated queries</div>
          </div>
        </div>

        {/* Card 5: Overall Quality */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e0e7ff", display: "flex", justifyContent: "center", alignItems: "center", color: "#4f46e5" }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Overall Quality</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>{overallQualityScore}/100</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Weighted group average</div>
          </div>
        </div>
      </div>

      {/* Row 1: Brand Compliance & Quality Audit Table */}
      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={18} color={PRIMARY_COLOR} /> Property Compliance Matrix
          </h3>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>
            Greeting compliance, formatting adherence, and listening excellence metrics. Click a row to expand individual call checklist breakdowns.
          </p>
        </div>

        {loading && auditData.length === 0 ? (
          <div style={{ display: "flex", height: 200, alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading Audit Matrix...</div>
        ) : auditData.length === 0 ? (
          <div style={{ display: "flex", height: 200, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic" }}>
            No calls audited for the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Property</th>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Audited Calls</th>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Greeting Compliance</th>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Format Compliance</th>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Listening Excellence</th>
                  <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 700 }}>Overall Quality</th>
                  <th style={{ padding: "12px 16px", width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {auditData.map((prop: any, idx) => {
                  const colors = getScoreColor(prop.compliance_score);
                  const isExpanded = expandedProperty === prop.property;
                  return (
                    <>
                      {/* Main Property Row */}
                      <tr 
                        key={idx} 
                        onClick={() => toggleExpand(prop.property)}
                        style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: isExpanded ? "#f8fafc" : "transparent", transition: "background 0.2s" }}
                        onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.background = "#faf5ff"; }}
                        onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "16px", fontWeight: 800, color: "#4f46e5" }}>{formatPropertyName(prop.property)}</td>
                        <td style={{ padding: "16px", color: "#475569", fontWeight: 600 }}>{prop.total_calls} calls</td>
                        
                        {/* Greeting Compliance Progress */}
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${prop.greeting_rate}%`, height: "100%", background: prop.greeting_rate >= 80 ? EMERALD : prop.greeting_rate >= 50 ? AMBER : ROSE, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 600, color: "#334155", minWidth: 38 }}>{prop.greeting_rate}%</span>
                          </div>
                        </td>

                        {/* Format Compliance Progress */}
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${prop.format_rate}%`, height: "100%", background: prop.format_rate >= 80 ? EMERALD : prop.format_rate >= 50 ? AMBER : ROSE, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 600, color: "#334155", minWidth: 38 }}>{prop.format_rate}%</span>
                          </div>
                        </td>

                        {/* Listening Compliance Progress */}
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${prop.listening_rate}%`, height: "100%", background: prop.listening_rate >= 80 ? EMERALD : prop.listening_rate >= 50 ? AMBER : ROSE, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 600, color: "#334155", minWidth: 38 }}>{prop.listening_rate}%</span>
                          </div>
                        </td>

                        {/* Overall Quality Badge */}
                        <td style={{ padding: "16px" }}>
                          <span style={{
                            display: "inline-block", padding: "6px 12px", borderRadius: 8,
                            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                            fontWeight: 800, fontSize: 12
                          }}>
                            {prop.compliance_score} / 100
                          </span>
                        </td>
                        <td style={{ padding: "16px", color: "#64748b" }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>

                      {/* Dropdown Call List Details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #e2e8f0" }}>
                            <div style={{ borderLeft: "4px solid #6366f1", paddingLeft: 16 }}>
                              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", margin: "0 0 12px 0" }}>
                                Individual Call Checklist Breakdowns ({formatPropertyName(prop.property)})
                              </h4>
                              
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {prop.calls.map((call: any) => (
                                  <div 
                                    key={call.call_uuid}
                                    onClick={() => handleCallClick(call.call_uuid, "none")}
                                    style={{
                                      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
                                      padding: "14px 16px", cursor: "pointer", transition: "all 0.15s ease-in-out",
                                      display: "flex", flexDirection: "column", gap: 8
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.borderColor = "#cbd5e1";
                                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.02)";
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.borderColor = "#e2e8f0";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    {/* Call row top */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <strong style={{ color: "#0f172a", fontSize: 13.5 }}>{call.caller_name}</strong>
                                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                          {new Date(call.call_timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                      
                                      {/* Total Score Meter */}
                                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 600 }}>
                                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: call.greeted_properly ? EMERALD : ROSE }}>
                                            {call.greeted_properly ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Greeted
                                          </span>
                                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: call.followed_call_format ? EMERALD : ROSE }}>
                                            {call.followed_call_format ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Format
                                          </span>
                                          <span style={{ display: "flex", alignItems: "center", gap: 4, color: call.repeated_info_flag === 0 ? EMERALD : ROSE }}>
                                            {call.repeated_info_flag === 0 ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Listened
                                          </span>
                                        </div>
                                        <span style={{
                                          fontWeight: 800, fontSize: 12.5, padding: "3px 8px", borderRadius: 6,
                                          background: call.total_score >= 80 ? "#ecfdf5" : call.total_score >= 50 ? "#fffbeb" : "#fef2f2",
                                          color: call.total_score >= 80 ? "#065f46" : call.total_score >= 50 ? "#92400e" : "#991b1b"
                                        }}>
                                          Score: {call.total_score}/100
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Reasoning explaining what caused the score */}
                                    <div style={{ fontSize: 12, color: "#475569", background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #f1f5f9", lineHeight: 1.4 }}>
                                      <strong>Diagnostic reasoning: </strong> {call.reasoning}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 2: Objection Handling & Segment Specialization */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        
        {/* Col A: Price Negotiation Auditor */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <HandCoins size={18} color={PRIMARY_COLOR} /> Rate Defense & Negotiation Audit
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>
              Performance metrics for closing property leads flagged as price-sensitive. Click any card block to list the negotiation calls.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {auditData.map((prop: any, idx) => (
              <div key={idx} style={{
                padding: "16px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <strong style={{ color: "#0f172a", fontSize: 14 }}>{formatPropertyName(prop.property)}</strong>
                  <span style={{
                    fontSize: 11, background: "#e0e7ff", color: "#4f46e5", padding: "2px 8px", borderRadius: 4, fontWeight: 700
                  }}>
                    Avg Sensitivity: {prop.avg_sensitivity}/100
                  </span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Price Sensitive Calls handled */}
                  <div 
                    onClick={() => {
                      const negotiationCalls = prop.calls.filter((c: any) => c.price_sensitive === 1);
                      setDrilldownModal({
                        title: `${formatPropertyName(prop.property)} - Negotiation Calls`,
                        calls: negotiationCalls,
                        context: "negotiation"
                      });
                    }}
                    style={{ background: "#fff", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9", cursor: "pointer", transition: "transform 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ fontSize: 11, color: "#64748b" }}>Negotiation Calls</div>
                    <strong style={{ fontSize: 16, color: "#1e293b", marginTop: 2, display: "block" }}>{prop.price_sensitive_calls}</strong>
                  </div>

                  {/* Negotiated closing rate */}
                  <div 
                    onClick={() => {
                      const negotiationCalls = prop.calls.filter((c: any) => c.price_sensitive === 1);
                      setDrilldownModal({
                        title: `${formatPropertyName(prop.property)} - Negotiation Calls`,
                        calls: negotiationCalls,
                        context: "negotiation"
                      });
                    }}
                    style={{ background: "#fff", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9", cursor: "pointer", transition: "transform 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ fontSize: 11, color: "#64748b" }}>Price closing rate</div>
                    <strong style={{
                      fontSize: 16, marginTop: 2, display: "block",
                      color: prop.price_conversion_rate >= 50 ? EMERALD : prop.price_conversion_rate >= 30 ? AMBER : ROSE
                    }}>
                      {prop.price_conversion_rate}%
                    </strong>
                  </div>
                </div>
              </div>
            ))}
            {auditData.length === 0 && (
              <div style={{ display: "flex", flex: 1, minHeight: 180, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic" }}>
                No negotiation logs recorded.
              </div>
            )}
          </div>
        </div>

        {/* Col B: Segment Specialization Matrix */}
        <div style={cardStyle}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color={PRIMARY_COLOR} /> Segment Conversion Matrix
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, margin: 0 }}>
              Conversion percentages across enquirer segments (Wedding, Family, Corporate, etc.). Click cells to view segment calls.
            </p>
          </div>

          {auditData.length === 0 ? (
            <div style={{ display: "flex", flex: 1, minHeight: 180, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic" }}>
              No segment data recorded.
            </div>
          ) : (
            <div style={{ overflowX: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                    <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700, textAlign: "left" }}>Property</th>
                    {allSegments.map((seg) => (
                      <th key={seg} style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700, textAlign: "center", textTransform: "capitalize" }}>
                        {seg.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditData.map((prop: any, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#334155" }}>{formatPropertyName(prop.property)}</td>
                      {allSegments.map((seg) => {
                        const data = prop.segments[seg];
                        if (!data) {
                          return (
                            <td key={seg} style={{ padding: "12px", textAlign: "center", color: "#cbd5e1", fontStyle: "italic" }}>
                              —
                            </td>
                          );
                        }
                        return (
                          <td 
                            key={seg} 
                            onClick={() => {
                              const segmentCalls = prop.calls.filter((c: any) => c.enquirer_segment === seg);
                              setDrilldownModal({
                                title: `${formatPropertyName(prop.property)} - ${seg.replace(/_/g, " ").toUpperCase()} Segment Calls`,
                                calls: segmentCalls,
                                context: "segment"
                              });
                            }}
                            style={{ padding: "12px", textAlign: "center", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <div style={{ fontWeight: 700, color: data.conversion_rate >= 60 ? EMERALD : data.conversion_rate >= 40 ? AMBER : ROSE }}>
                              {data.conversion_rate}%
                            </div>
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                              ({data.won}/{data.total})
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Drilldown List Modal (Lists matching calls) */}
      {drilldownModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 999,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "650px", maxWidth: "90%",
            maxHeight: "75vh", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0", overflow: "hidden"
          }}>
            {/* Header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#f8fafc"
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {drilldownModal.title}
              </h3>
              <button 
                onClick={() => setDrilldownModal(null)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List Body */}
            <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {drilldownModal.calls.map((call: any) => (
                <div 
                  key={call.call_uuid}
                  onClick={() => {
                    handleCallClick(call.call_uuid, drilldownModal.context);
                  }}
                  style={{
                    padding: "14px", border: "1px solid #e2e8f0", borderRadius: 10,
                    cursor: "pointer", transition: "all 0.15s ease", display: "flex",
                    justifyContent: "space-between", alignItems: "center", background: "#fcfcfc"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#fcfcfc";
                  }}
                >
                  <div>
                    <strong style={{ color: "#0f172a", fontSize: 13.5, display: "block" }}>{call.caller_name}</strong>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginTop: 2 }}>
                      {new Date(call.call_timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: call.outcome === "won" ? "#ecfdf5" : call.outcome === "lost" ? "#fef2f2" : "#fffbeb",
                      color: call.outcome === "won" ? "#047857" : call.outcome === "lost" ? "#b91c1c" : "#b45309",
                      textTransform: "uppercase"
                    }}>
                      {call.outcome}
                    </span>
                    <span style={{
                      fontWeight: 800, fontSize: 12, padding: "3px 8px", borderRadius: 6,
                      background: "#f1f5f9", color: "#475569"
                    }}>
                      {call.total_score}/100
                    </span>
                  </div>
                </div>
              ))}
              {drilldownModal.calls.length === 0 && (
                <div style={{ display: "flex", height: 100, alignItems: "center", justifyContent: "center", color: "#94a3b8", fontStyle: "italic" }}>
                  No calls matched this metric.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Call Detail Modal Overlay */}
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
              
              {/* Highlight Banner (Context-based) */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px", 
                background: selectedCallContext === "negotiation" ? "#eff6ff" : (selectedCallContext === "segment" ? "#faf5ff" : (selectedCall.outcome === "lost" ? "#fef2f2" : "#f0fdf4")),
                border: `1px solid ${selectedCallContext === "negotiation" ? "#bfdbfe" : (selectedCallContext === "segment" ? "#e9d5ff" : (selectedCall.outcome === "lost" ? "#fecaca" : "#bbf7d0"))}`,
                borderRadius: 12
              }}>
                <div style={{ 
                  display: "flex", alignItems: "center", gap: 8, 
                  color: selectedCallContext === "negotiation" ? "#1e40af" : (selectedCallContext === "segment" ? "#6b21a8" : (selectedCall.outcome === "lost" ? "#991b1b" : "#166534")) 
                }}>
                  {selectedCallContext === "none" ? <DollarSign size={20} /> : <Info size={20} />}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {selectedCallContext === "negotiation" 
                      ? "Price Negotiation Call Detected" 
                      : (selectedCallContext === "segment" ? "Segment Classification Analysis" : (selectedCall.outcome === "lost" ? "Lost Booking Value" : "Estimated Booking Value"))
                    }
                  </span>
                </div>
                <strong style={{ 
                  fontSize: 20, 
                  color: selectedCallContext === "negotiation" ? "#2563eb" : (selectedCallContext === "segment" ? "#7c3aed" : (selectedCall.outcome === "lost" ? "#dc2626" : "#15803d")) 
                }}>
                  {selectedCallContext === "negotiation" 
                    ? `Sensitivity: ${selectedCall.sensitivity_score}/100` 
                    : (selectedCallContext === "segment" 
                        ? `Segment: ${selectedCall.enquirer_segment ? selectedCall.enquirer_segment.replace(/_/g, " ").toUpperCase() : "OTHER"}`
                        : (selectedCall.estimated_revenue_inr > 0 ? `₹${selectedCall.estimated_revenue_inr}` : "Value Not Extracted")
                      )
                  }
                </strong>
              </div>

              {/* AI Coaching Boxes */}
              {(() => {
                const isNoneCall = selectedCall.what_went_wrong?.toLowerCase().startsWith("none") ||
                                   selectedCall.what_went_wrong?.toLowerCase().includes("no issues noted") ||
                                   selectedCall.what_went_wrong?.toLowerCase().trim() === "none";
                
                let leftBg = "#fef2f2";
                let leftBorder = "#fee2e2";
                let leftTextColor = "#7f1d1d";
                let leftHeaderColor = "#991b1b";
                let leftTitle = "What Went Wrong";
                let leftIcon = <AlertTriangle size={15} />;
                let leftContent = selectedCall.what_went_wrong;

                if (selectedCallContext === "negotiation") {
                  leftBg = "#faf5ff";
                  leftBorder = "#f3e8ff";
                  leftTextColor = "#581c87";
                  leftHeaderColor = "#6b21a8";
                  leftTitle = "Price Negotiation Dialogue & Context";
                  leftContent = selectedCall.negotiation_dialogue;
                } else if (selectedCallContext === "segment") {
                  leftBg = "#fdf4ff";
                  leftBorder = "#fae8ff";
                  leftTextColor = "#701a75";
                  leftHeaderColor = "#86198f";
                  leftTitle = "Segment Context & Dialogue Analysis";
                  leftContent = selectedCall.segment_dialogue;
                } else if (isNoneCall) {
                  leftBg = "#ecfdf5";
                  leftBorder = "#dcfce7";
                  leftTextColor = "#14532d";
                  leftHeaderColor = "#166534";
                  leftTitle = "Performance Highlights";
                  leftIcon = <CheckCircle2 size={15} />;
                }

                let rightTitle = "Suggested Action Script";
                let rightContent = `"${selectedCall.suggested_action}"`;
                let isItalic = true;

                if (selectedCallContext === "negotiation") {
                  rightTitle = "Suggested Negotiation & Discount Strategy";
                  rightContent = selectedCall.discount_strategy;
                  isItalic = false;
                } else if (selectedCallContext === "segment") {
                  rightTitle = "Segment Specific Action Script";
                  rightContent = selectedCall.suggested_action;
                  isItalic = false;
                } else if (isNoneCall) {
                  rightTitle = "Appreciation";
                  rightContent = "Excellent compliance and execution! The front desk agent properly handled all requirements and locked in the booking details flawlessly.";
                  isItalic = false;
                }

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Left Box */}
                    <div style={{
                      padding: "16px", background: leftBg, border: `1px solid ${leftBorder}`,
                      borderRadius: 12, display: "flex", flexDirection: "column", gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: leftHeaderColor, fontWeight: 700, fontSize: 13 }}>
                        {leftIcon}
                        <span>{leftTitle}</span>
                      </div>
                      <p style={{ 
                        fontSize: 13, color: leftTextColor, margin: 0, lineHeight: 1.5,
                        whiteSpace: selectedCallContext === "none" ? "normal" : "pre-wrap",
                        fontStyle: selectedCallContext === "none" ? "normal" : "italic"
                      }}>
                        {leftContent}
                      </p>
                    </div>

                    {/* Right Box */}
                    <div style={{
                      padding: "16px", background: "#f0fdf4", border: "1px solid #dcfce7",
                      borderRadius: 12, display: "flex", flexDirection: "column", gap: 8
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: 13 }}>
                        <Phone size={15} />
                        <span>{rightTitle}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#14532d", margin: 0, lineHeight: 1.5, fontStyle: isItalic ? "italic" : "normal" }}>
                        {rightContent}
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
