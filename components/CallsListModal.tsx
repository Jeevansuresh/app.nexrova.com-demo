"use client";

import React, { useState, useEffect } from "react";
import { X, PhoneCall, Calendar, AlertCircle } from "lucide-react";
import AnalysisModal, { formatAnalyzedDate } from "./AnalysisModal";

interface CallsListModalProps {
  outcome: "won" | "lost" | "first_time" | "revisiting" | "high_intent" | "revenue_influenced" | "total_calls" | "unique_enquirers" | string;
  startDate?: string;
  endDate?: string;
  folderId?: string;
  onClose: () => void;
}

export default function CallsListModal({ outcome, startDate, endDate, folderId, onClose }: CallsListModalProps) {
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const getModalTitle = () => {
    switch (outcome) {
      case "won": return "Bookings Won Details";
      case "lost": return "Bookings Lost Details";
      case "first_time": return "First-Time Callers Details";
      case "revisiting": return "Revisiting Guests Details";
      case "total_calls": return "Total Calls Details";
      case "unique_enquirers": return "Unique Enquirers Details";
      default: return `${outcome.replace(/_/g, " ")} Details`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const queryParams = new URLSearchParams();
        if (outcome) queryParams.append("outcome", outcome);
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);
        if (folderId && folderId !== "all") queryParams.append("folder_id", folderId);
        
        const res = await fetch(`/api/analysis/history?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        const historyData = json.history || json.data || [];
        setData({ ...json, history: historyData });
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [outcome, startDate, endDate, folderId]);

  return (
    <>
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
          zIndex: 99998,
          padding: "16px"
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "#000000",
            border: "1px solid #333333",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #333333", background: "#0a0a0a" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ededed", margin: 0, textTransform: "capitalize" }}>
                {outcome.replace(/_/g, " ")} Calls
              </h2>
              <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0 0" }}>
                {startDate === endDate && startDate ? startDate : `${startDate || "All"} - ${endDate || "All"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                transition: "background 0.2s, color 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#27272a"; e.currentTarget.style.color = "#ededed"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", background: "#000000" }}>
            {isLoading && (
              <div style={{ textAlign: "center", padding: "40px", color: "#a1a1aa", fontSize: 14 }}>
                Loading calls...
              </div>
            )}
            {error && (
              <div style={{ textAlign: "center", padding: "40px", color: "#ef4444", fontSize: 14 }}>
                Failed to load calls.
              </div>
            )}
            {data && data.history && data.history.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#a1a1aa", fontSize: 14 }}>
                No {outcome} calls found for this period.
              </div>
            )}
            {data && data.history && data.history.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.history.map((call: any) => (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#52525b"; e.currentTarget.style.background = "#18181b"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#27272a"; e.currentTarget.style.background = "#0a0a0a"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ background: outcome === "won" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "8px", color: outcome === "won" ? "#10b981" : "#ef4444" }}>
                          <PhoneCall size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#ededed" }}>
                            {call.caller_name || call.persona_name || "Unknown Caller"}
                            {call.caller_phone && <span style={{ fontSize: 13, color: "#a1a1aa", marginLeft: "8px", fontWeight: 400 }}>{call.caller_phone}</span>}
                          </div>
                          <div style={{ fontSize: 13, color: "#a1a1aa", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <Calendar size={12} />
                            {formatAnalyzedDate(call.call_timestamp || call.created_at)}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: outcome === "won" ? "#10b981" : outcome === "lost" ? "#ef4444" : "#3b82f6", textTransform: "capitalize" }}>
                          {outcome === "total_calls" || outcome === "unique_enquirers" ? call.outcome.replace(/_/g, " ") : outcome.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: "2px" }}>
                          Score: {call.total_score}
                          {outcome === "revenue_influenced" && call.estimated_revenue_inr > 0 && ` | ₹${call.estimated_revenue_inr.toLocaleString("en-IN")}`}
                        </div>
                      </div>
                    </div>
                    
                    {outcome === "lost" && call.raw_lost_reason && call.raw_lost_reason !== "not_lost" && call.raw_lost_reason !== "None" && (
                      <div style={{ marginTop: "12px", padding: "8px 12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <AlertCircle size={14} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Reason Lost</div>
                          <div style={{ fontSize: 13, color: "#fca5a5" }}>{call.raw_lost_reason}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCall && (
        <AnalysisModal
          selectedHistoryItem={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </>
  );
}
