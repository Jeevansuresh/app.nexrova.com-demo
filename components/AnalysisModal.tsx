import React, { useState } from "react";
import { X, FileText, ExternalLink, CheckCircle, AlertCircle, Edit2, Save, Loader2, Bug } from "lucide-react";
import { BASE } from "@/lib/api";

export const parseDateStr = (dateStr?: string) => {
  if (!dateStr) return new Date(NaN);
  
  if (dateStr.endsWith("Z") || dateStr.includes("+") || (dateStr.includes("T") && dateStr.split("T")[1].includes("-"))) {
    return new Date(dateStr);
  }
  
  if (dateStr.includes("T")) {
    return new Date(dateStr + "+05:30");
  }

  const parts = dateStr.split(" ");
  if (parts.length === 2) {
    return new Date(dateStr.replace(" ", "T") + "+05:30");
  }
  
  return new Date(dateStr);
};


export const formatAnalyzedDate = (dateStr?: string) => {
  const d = parseDateStr(dateStr);
  if (isNaN(d.getTime())) {
    return "Unknown Date";
  }
  try {
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch (e) {
    return dateStr || "Unknown Date";
  }
};

export default function AnalysisModal({ selectedHistoryItem, onClose }: { selectedHistoryItem: any, onClose: () => void }) {
  const [isEditingQA, setIsEditingQA] = useState(false);
  const [qaNotes, setQaNotes] = useState(selectedHistoryItem?.pipeline_issue_notes || "");
  const [callerName, setCallerName] = useState(selectedHistoryItem?.manual_caller_name || selectedHistoryItem?.caller_name || selectedHistoryItem?.persona_name || "");
  const [driveLink, setDriveLink] = useState(selectedHistoryItem?.manual_drive_link || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!selectedHistoryItem) return null;

  const handleSaveQA = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE}/api/analysis/calls/${selectedHistoryItem.call_uuid}/pipeline_qa`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manual_caller_name: callerName,
          pipeline_issue_notes: qaNotes,
          manual_drive_link: driveLink
        }),
        credentials: "include"
      });
      if (res.ok) {
        setIsEditingQA(false);
        selectedHistoryItem.manual_caller_name = callerName;
        selectedHistoryItem.pipeline_issue_notes = qaNotes;
        selectedHistoryItem.manual_drive_link = driveLink;
        // Optionally trigger a re-fetch in parent, but mutating the object updates it locally for now.
      } else {
        alert("Failed to save QA notes.");
      }
    } catch (e) {
      alert("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 99999,
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          width: "100%",
          maxWidth: "896px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isEditingQA ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: 600 }}>
                  <input 
                    type="text" 
                    value={callerName} 
                    onChange={e => setCallerName(e.target.value)}
                    style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0, padding: "4px 10px", borderRadius: 6, border: "1px solid #cbd5e1", outline: "none", flex: 1 }}
                    placeholder="Caller Name..."
                  />
                  <input 
                    type="text" 
                    value={driveLink} 
                    onChange={e => setDriveLink(e.target.value)}
                    style={{ fontSize: 13, color: "#0f172a", margin: 0, padding: "5px 10px", borderRadius: 6, border: "1px solid #cbd5e1", outline: "none", flex: 1 }}
                    placeholder="Paste Google Drive URL..."
                  />
                  <button
                    onClick={handleSaveQA}
                    disabled={isSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              ) : (
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Analysis Details: {selectedHistoryItem.manual_caller_name || selectedHistoryItem.caller_name || selectedHistoryItem.persona_name}
                </h2>
              )}
              {!isEditingQA && (
                <button 
                  onClick={() => setIsEditingQA(true)} 
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
                  title="Edit Call Name & Drive Link"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                Analyzed on {formatAnalyzedDate(selectedHistoryItem.created_at)}
              </span>
              
              {selectedHistoryItem.manual_drive_link ? (
                <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                  <a href={selectedHistoryItem.manual_drive_link} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    <ExternalLink size={12} />
                    Drive Link
                  </a>
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                  Phone: {selectedHistoryItem.caller_phone || "Unknown"}
                </span>
              )}
              
              <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: selectedHistoryItem.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#f3e8ff" :
                                   selectedHistoryItem.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#e0e7ff" :
                                   selectedHistoryItem.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#fef3c7" :
                                   "#f3f4f6",
                  color: selectedHistoryItem.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#7e22ce" :
                         selectedHistoryItem.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#4338ca" :
                         selectedHistoryItem.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#b45309" :
                         "#374151",
                  border: "1px solid " + (
                         selectedHistoryItem.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#e9d5ff" :
                         selectedHistoryItem.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#c7d2fe" :
                         selectedHistoryItem.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#fde68a" :
                         "#e5e7eb"
                  )
                }}>
                  {selectedHistoryItem.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "Oasis Palm Reservation" :
                   selectedHistoryItem.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "Oasis Boutique Reservation" :
                   selectedHistoryItem.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? (typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Grand" : "Oasis Grand Reservation") :
                   selectedHistoryItem.source === "android_auto" ? "Android Ingest" : "Manual Upload"}
                </span>
              </span>
              {selectedHistoryItem.audio_filename && (
                <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", color: "#64748b" }}>
                  <FileText size={12} style={{ marginRight: 4 }} />
                  <span title={selectedHistoryItem.audio_filename} style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedHistoryItem.audio_filename}
                  </span>
                </span>
              )}
              {selectedHistoryItem.source === "android_auto" && selectedHistoryItem.call_uuid && (
                <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                  <a href={`https://drive.google.com/file/d/${selectedHistoryItem.call_uuid}/view`} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <ExternalLink size={12} />
                    Drive Link
                  </a>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
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
            <X size={16} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1" style={{ padding: "0" }}>

          {/* ── Transcript ────────────────────────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <FileText size={15} style={{ color: "#2563eb" }} />
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Full Call Transcript</h3>
              {selectedHistoryItem.call_transcript && (
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "999px" }}>
                  {selectedHistoryItem.call_transcript.length} chars
                </span>
              )}
            </div>
            <div style={{
              backgroundColor: "#0f172a",
              borderRadius: "10px",
              padding: "18px 20px",
              minHeight: "280px",
              maxHeight: "380px",
              overflowY: "auto",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "12.5px",
              lineHeight: "1.7",
              color: "#e2e8f0",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {selectedHistoryItem.call_transcript
                ? selectedHistoryItem.call_transcript
                : <span style={{ color: "#64748b", fontStyle: "italic" }}>No transcript available for this call.</span>
              }
            </div>
          </div>

          {/* ── 1. Factual Booking Metadata ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>1. Factual Booking Metadata</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { label: "Call Type",      value: selectedHistoryItem.call_type?.replace(/_/g, " ") || "N/A",         color: "#1d4ed8", bg: "#eff6ff", border: "#dbeafe" },
                { label: "Property",       value: selectedHistoryItem.property_called?.replace(/_/g, " ") || "N/A",   color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Rooms",          value: selectedHistoryItem.rooms_requested || "N/A",                               color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Nights",         value: selectedHistoryItem.nights || "N/A",          color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Stay Duration",  value: selectedHistoryItem.nights ? (selectedHistoryItem.nights < 7 ? "Short Stay (<7)" : selectedHistoryItem.nights < 14 ? "Medium Stay (<14)" : "Long Stay (14+)") : "Unknown", color: "#7e22ce", bg: "#faf5ff", border: "#f3e8ff" },
                { label: "Check-in",       value: selectedHistoryItem.checkin_date || "N/A",                        color: "#065f46", bg: "#f0fdf4", border: "#d1fae5" },
                { label: "Check-out",      value: selectedHistoryItem.checkout_date || "N/A",                       color: "#92400e", bg: "#fffbeb", border: "#fef3c7" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: color, textTransform: "capitalize" }}>{String(value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Context & Intent Signals ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>2. Context & Intent Signals</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div style={{ backgroundColor: "#faf5ff", border: `1px solid #f3e8ff`, borderRadius: "8px", padding: "10px 12px", gridColumn: "span 3" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Enquirer Segment</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#7e22ce", textTransform: "capitalize" }}>{selectedHistoryItem.enquirer_segment?.replace(/_/g, " ") || "N/A"}</div>
              </div>
              {[
                { label: "Booking Intent",    value: selectedHistoryItem.was_booking_intent ? "Yes" : "No", color: selectedHistoryItem.was_booking_intent ? "#065f46" : "#64748b", bg: selectedHistoryItem.was_booking_intent ? "#f0fdf4" : "#f8fafc", border: selectedHistoryItem.was_booking_intent ? "#d1fae5" : "#e2e8f0" },
                { label: "Asked Pricing",     value: selectedHistoryItem.asked_about_pricing ? "Yes" : "No", color: selectedHistoryItem.asked_about_pricing ? "#1d4ed8" : "#64748b", bg: selectedHistoryItem.asked_about_pricing ? "#eff6ff" : "#f8fafc", border: selectedHistoryItem.asked_about_pricing ? "#dbeafe" : "#e2e8f0" },
                { label: "Asked Amenities",   value: selectedHistoryItem.asked_about_amenities ? "Yes" : "No", color: selectedHistoryItem.asked_about_amenities ? "#1d4ed8" : "#64748b", bg: selectedHistoryItem.asked_about_amenities ? "#eff6ff" : "#f8fafc", border: selectedHistoryItem.asked_about_amenities ? "#dbeafe" : "#e2e8f0" },
                { label: "Asked Offers",      value: selectedHistoryItem.asked_about_offers ? "Yes" : "No", color: selectedHistoryItem.asked_about_offers ? "#1d4ed8" : "#64748b", bg: selectedHistoryItem.asked_about_offers ? "#eff6ff" : "#f8fafc", border: selectedHistoryItem.asked_about_offers ? "#dbeafe" : "#e2e8f0" },
                { label: "Price Sensitive",   value: selectedHistoryItem.price_sensitive ? "Yes" : "No", color: selectedHistoryItem.price_sensitive ? "#92400e" : "#64748b", bg: selectedHistoryItem.price_sensitive ? "#fffbeb" : "#f8fafc", border: selectedHistoryItem.price_sensitive ? "#fef3c7" : "#e2e8f0" },
                { label: "Sensitivity Score", value: selectedHistoryItem.sensitivity_score || "0", color: "#92400e", bg: "#fffbeb", border: "#fef3c7" },
                { label: "Repeat Caller",     value: selectedHistoryItem.repeat_caller_signal ? "Yes" : "No", color: selectedHistoryItem.repeat_caller_signal ? "#065f46" : "#64748b", bg: selectedHistoryItem.repeat_caller_signal ? "#f0fdf4" : "#f8fafc", border: selectedHistoryItem.repeat_caller_signal ? "#d1fae5" : "#e2e8f0" },
                { label: "Referral",          value: selectedHistoryItem.referral ? "Yes" : "No", color: selectedHistoryItem.referral ? "#065f46" : "#64748b", bg: selectedHistoryItem.referral ? "#f0fdf4" : "#f8fafc", border: selectedHistoryItem.referral ? "#d1fae5" : "#e2e8f0" },
                { label: "Service Failure",   value: selectedHistoryItem.service_failure_detected ? "Yes" : "No", color: selectedHistoryItem.service_failure_detected ? "#991b1b" : "#64748b", bg: selectedHistoryItem.service_failure_detected ? "#fef2f2" : "#f8fafc", border: selectedHistoryItem.service_failure_detected ? "#fee2e2" : "#e2e8f0" },
                { label: "Language Barrier",  value: selectedHistoryItem.language_barrier_detected ? "Yes" : "No", color: selectedHistoryItem.language_barrier_detected ? "#991b1b" : "#64748b", bg: selectedHistoryItem.language_barrier_detected ? "#fef2f2" : "#f8fafc", border: selectedHistoryItem.language_barrier_detected ? "#fee2e2" : "#e2e8f0" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: color }}>{String(value)}</div>
                </div>
              ))}
              <div style={{ backgroundColor: "#f8fafc", border: `1px solid #e2e8f0`, borderRadius: "8px", padding: "10px 12px", gridColumn: "span 3" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Guest Requests</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", textTransform: "capitalize" }}>
                  {(() => {
                    try {
                      const reqs = JSON.parse(selectedHistoryItem.guest_requests || "[]");
                      return reqs.length > 0 && reqs[0] !== "none" ? reqs.map((r:string) => r.replace(/_/g, " ")).join(", ") : "None Detected";
                    } catch(e) { return "None Detected"; }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Outcomes & Lead Status ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>3. Outcomes & Lead Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {[
                { label: "Outcome",               value: selectedHistoryItem.outcome?.replace(/_/g, " ") || "N/A", color: selectedHistoryItem.outcome === "won" ? "#065f46" : selectedHistoryItem.outcome === "lost" ? "#991b1b" : "#92400e", bg: selectedHistoryItem.outcome === "won" ? "#f0fdf4" : selectedHistoryItem.outcome === "lost" ? "#fef2f2" : "#fffbeb", border: selectedHistoryItem.outcome === "won" ? "#d1fae5" : selectedHistoryItem.outcome === "lost" ? "#fee2e2" : "#fef3c7" },
                { label: "Availability Status",   value: selectedHistoryItem.availability_status?.replace(/_/g, " ") || "N/A", color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Confirmation Detected", value: selectedHistoryItem.confirmation_detected ? "Yes" : "No", color: selectedHistoryItem.confirmation_detected ? "#065f46" : "#64748b", bg: selectedHistoryItem.confirmation_detected ? "#f0fdf4" : "#f8fafc", border: selectedHistoryItem.confirmation_detected ? "#d1fae5" : "#e2e8f0" },
                { label: "Needs Follow-up",       value: selectedHistoryItem.needs_followup ? "Yes" : "No", color: selectedHistoryItem.needs_followup ? "#92400e" : "#64748b", bg: selectedHistoryItem.needs_followup ? "#fffbeb" : "#f8fafc", border: selectedHistoryItem.needs_followup ? "#fef3c7" : "#e2e8f0" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: color, textTransform: "capitalize" }}>{String(value)}</div>
                </div>
              ))}
              {selectedHistoryItem.raw_lost_reason && selectedHistoryItem.raw_lost_reason !== "not_lost" && selectedHistoryItem.raw_lost_reason !== "None" && (
                <div style={{ backgroundColor: "#fef2f2", border: `1px solid #fee2e2`, borderRadius: "8px", padding: "10px 12px", gridColumn: "span 2" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Lost Reason</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#7f1d1d" }}>{selectedHistoryItem.raw_lost_reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Cross-Sell Intelligence ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>4. Cross-Sell Intelligence</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {[
                { label: "Property Offered", value: selectedHistoryItem.cross_sell_property_offered?.replace(/_/g, " ") || "None", color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Cross-Sell Outcome", value: selectedHistoryItem.cross_sell_outcome?.replace(/_/g, " ") || "N/A", color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: color, textTransform: "capitalize" }}>{String(value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Staff QA & Coaching ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>5. Staff QA & Coaching</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "8px" }}>
              <div style={{ backgroundColor: selectedHistoryItem.greeted_properly ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selectedHistoryItem.greeted_properly ? "#d1fae5" : "#fee2e2"}`, borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Greeted Properly</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: selectedHistoryItem.greeted_properly ? "#065f46" : "#991b1b" }}>{selectedHistoryItem.greeted_properly ? "Yes" : "No"}</div>
              </div>
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Extraction Confidence</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{selectedHistoryItem.extraction_confidence ? `${Math.round(selectedHistoryItem.extraction_confidence * 100)}%` : "N/A"}</div>
              </div>
              <div style={{ backgroundColor: "#f8fafc", border: `1px solid #e2e8f0`, borderRadius: "8px", padding: "10px 12px", gridColumn: "span 2" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Front Desk Gaps</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", textTransform: "capitalize" }}>
                  {(() => {
                    try {
                      const gaps = JSON.parse(selectedHistoryItem.fd_gaps || "[]");
                      return gaps.length > 0 && gaps[0] !== "none" ? gaps.map((r:string) => r.replace(/_/g, " ")).join(", ") : "None Detected";
                    } catch(e) { return "None Detected"; }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. Computed Scoring ─────────────────────────── */}
          <div style={{ padding: "20px 24px 0" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>6. Computed Scoring</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {[
                { label: "Total Score",      value: `${selectedHistoryItem.total_score} / 100`, color: "#1d4ed8", bg: "#eff6ff", border: "#dbeafe" },
                { label: "Priority Tier",    value: `Tier ${selectedHistoryItem.tier}`, color: "#1d4ed8", bg: "#eff6ff", border: "#dbeafe" },
                { label: "Est. Revenue",     value: `₹${selectedHistoryItem.estimated_revenue_inr?.toLocaleString() || 0}`, color: "#065f46", bg: "#f0fdf4", border: "#d1fae5" },
                { label: "Intent Score",     value: `${selectedHistoryItem.intent_score} / 100`, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Lock-in Score",    value: `${selectedHistoryItem.lock_in_score} / 100`, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                { label: "Revenue Score",    value: `${selectedHistoryItem.revenue_score} / 100`, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: color }}>{String(value)}</div>
                </div>
              ))}
              <div style={{ backgroundColor: "#f8fafc", border: `1px solid #e2e8f0`, borderRadius: "8px", padding: "10px 12px", gridColumn: "span 3" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Discount Strategy</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{selectedHistoryItem.discount_strategy || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* ── AI Decision & Actions ─────────────────────────────── */}
          <div style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>AI Decision & Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedHistoryItem.followup_action && (
                <div style={{ padding: "12px", backgroundColor: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#065f46", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Follow-up Plan</span>
                  <span style={{ fontSize: "13px", color: "#14532d" }}>{selectedHistoryItem.followup_action}</span>
                </div>
              )}

              {selectedHistoryItem.decision_json?.what_went_wrong && (
                <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>What Went Wrong</span>
                  <span style={{ fontSize: "12px", color: "#7f1d1d", whiteSpace: "pre-wrap" }}>{selectedHistoryItem.decision_json.what_went_wrong}</span>
                </div>
              )}
              {selectedHistoryItem.decision_json?.improvement_suggestions && (
                <div style={{ padding: "12px", backgroundColor: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#065f46", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>How To Improve</span>
                  <span style={{ fontSize: "12px", color: "#14532d", whiteSpace: "pre-wrap" }}>{selectedHistoryItem.decision_json.improvement_suggestions}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 7. Developer QA Notes ─────────────────────────────── */}
          <div style={{ padding: "20px 24px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Bug size={14} color="#dc2626" />
                <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Developer QA Notes (Pipeline Issues)</h3>
              </div>
              {isEditingQA ? (
                <button 
                  onClick={handleSaveQA} 
                  disabled={isSaving}
                  style={{ background: "#dc2626", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save QA Notes
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditingQA(true)} 
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Edit2 size={12} />
                  Edit Feedback
                </button>
              )}
            </div>
            
            {isEditingQA ? (
              <textarea
                value={qaNotes}
                onChange={e => setQaNotes(e.target.value)}
                placeholder="Describe STT inaccuracies, LLM hallucinations, or pipeline bugs here..."
                style={{ width: "100%", minHeight: "100px", padding: "12px", borderRadius: "8px", border: "1px solid #fca5a5", backgroundColor: "#fef2f2", color: "#7f1d1d", fontSize: "13px", resize: "vertical", outline: "none" }}
              />
            ) : (
              <div style={{ width: "100%", minHeight: selectedHistoryItem.pipeline_issue_notes ? "auto" : "60px", padding: "12px", borderRadius: "8px", border: "1px dashed #fca5a5", backgroundColor: "#fef2f2", color: selectedHistoryItem.pipeline_issue_notes ? "#7f1d1d" : "#ef4444", fontSize: "13px", whiteSpace: "pre-wrap", display: "flex", alignItems: selectedHistoryItem.pipeline_issue_notes ? "flex-start" : "center", justifyContent: selectedHistoryItem.pipeline_issue_notes ? "flex-start" : "center" }}>
                {selectedHistoryItem.pipeline_issue_notes ? selectedHistoryItem.pipeline_issue_notes : <span style={{ fontStyle: "italic", opacity: 0.7 }}>No pipeline QA feedback added for this call yet.</span>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
