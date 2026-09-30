"use client";

import React, { useState, useEffect } from "react";
import { X, PhoneCall, Calendar, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import AnalysisModal, { formatAnalyzedDate } from "./AnalysisModal";

interface CrossSellModalProps {
  startDate?: string;
  endDate?: string;
  folderId?: string;
  onClose: () => void;
}

export default function CrossSellModal({ startDate, endDate, folderId, onClose }: CrossSellModalProps) {
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  const [offeredData, setOfferedData] = useState<any[]>([]);
  const [missedData, setMissedData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.append("start_date", startDate);
        if (endDate) queryParams.append("end_date", endDate);
        if (folderId && folderId !== "all") queryParams.append("folder_id", folderId);
        
        // Fetch Offered
        const qOffered = new URLSearchParams(queryParams);
        qOffered.append("outcome", "cross_sell_offered");
        const resOffered = await fetch(`/api/analysis/history?${qOffered.toString()}`);
        
        // Fetch Missed
        const qMissed = new URLSearchParams(queryParams);
        qMissed.append("outcome", "cross_sell_missed");
        const resMissed = await fetch(`/api/analysis/history?${qMissed.toString()}`);

        if (!resOffered.ok || !resMissed.ok) throw new Error("Network response was not ok");
        
        const jsonOffered = await resOffered.json();
        const jsonMissed = await resMissed.json();

        setOfferedData(jsonOffered.history || jsonOffered.data || []);
        setMissedData(jsonMissed.history || jsonMissed.data || []);
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, folderId]);

  const renderCallCard = (call: any, type: "offered" | "missed") => (
    <div
      key={call.id}
      onClick={() => setSelectedCall(call)}
      style={{
        background: type === "offered" ? "rgba(16, 185, 129, 0.02)" : "rgba(239, 68, 68, 0.02)",
        border: `1px solid ${type === "offered" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
        borderRadius: "10px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.borderColor = type === "offered" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"; 
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = type === "offered" ? "0 4px 12px rgba(16, 185, 129, 0.1)" : "0 4px 12px rgba(239, 68, 68, 0.1)";
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.borderColor = type === "offered" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"; 
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: type === "offered" ? "#10b981" : "#ef4444" }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: type === "offered" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "10px", color: type === "offered" ? "#10b981" : "#ef4444" }}>
            <PhoneCall size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#ededed" }}>
              {call.caller_name || call.persona_name || "Unknown Caller"}
              {call.caller_phone && <span style={{ fontSize: 13, color: "#a1a1aa", marginLeft: "8px", fontWeight: 400 }}>{call.caller_phone}</span>}
            </div>
            <div style={{ fontSize: 13, color: "#a1a1aa", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <Calendar size={12} />
              {formatAnalyzedDate(call.call_timestamp || call.created_at)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: type === "offered" ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
            {type === "offered" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {type === "offered" ? "Revenue Saved" : "Revenue Lost"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ededed", marginTop: "2px" }}>
            ₹{call.estimated_revenue_inr ? call.estimated_revenue_inr.toLocaleString("en-IN") : "0"}
          </div>
        </div>
      </div>
      
      {type === "missed" && call.fd_gaps_json && call.fd_gaps_json.includes("cross_sell_not_offered") && (
        <div style={{ marginLeft: "4px", marginTop: "4px", padding: "8px 12px", background: "rgba(239, 68, 68, 0.05)", borderRadius: "6px", border: "1px dashed rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} color="#ef4444" />
          <span style={{ fontSize: 12, color: "#fca5a5" }}>Guest called {call.property_called}, it was {call.availability_status}, but FD did not pitch alternates.</span>
        </div>
      )}
      
      {type === "offered" && call.cross_sell_property_offered && (
        <div style={{ marginLeft: "4px", marginTop: "4px", padding: "8px 12px", background: "rgba(16, 185, 129, 0.05)", borderRadius: "6px", border: "1px dashed rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: 12, color: "#6ee7b7", display: "flex", alignItems: "center", gap: "6px" }}>
            {call.property_called} <ArrowRight size={12} /> {call.cross_sell_property_offered}
          </span>
        </div>
      )}
    </div>
  );

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
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          padding: "16px"
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #27272a",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
            width: "100%",
            maxWidth: "800px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalFadeIn 0.2s ease-out"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #27272a", background: "#050505" }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ededed", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                Cross-Sell Opportunities
              </h2>
              <p style={{ fontSize: 13, color: "#a1a1aa", margin: "4px 0 0 0" }}>
                {startDate === endDate && startDate ? startDate : `${startDate || "All"} - ${endDate || "All"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#a1a1aa",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#ededed"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", background: "linear-gradient(180deg, #050505 0%, #000000 100%)" }}>
            {isLoading && (
              <div style={{ gridColumn: "span 2", textAlign: "center", padding: "60px", color: "#a1a1aa", fontSize: 14 }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid #333", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                Loading cross-sell data...
              </div>
            )}
            {error && (
              <div style={{ gridColumn: "span 2", textAlign: "center", padding: "40px", color: "#ef4444", fontSize: 14 }}>
                Failed to load cross-sell data.
              </div>
            )}
            
            {!isLoading && !error && (
              <>
                {/* Offered Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #27272a" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
                      Successfully Offered
                    </div>
                    <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "2px 8px", borderRadius: "12px", fontSize: 12, fontWeight: 600 }}>
                      {offeredData.length}
                    </div>
                  </div>
                  
                  {offeredData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#52525b", fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed #27272a" }}>
                      No successful cross-sells in this period.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {offeredData.map(call => renderCallCard(call, "offered"))}
                    </div>
                  )}
                </div>

                {/* Missed Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #27272a" }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                      Missed Opportunities
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "2px 8px", borderRadius: "12px", fontSize: 12, fontWeight: 600 }}>
                      {missedData.length}
                    </div>
                  </div>
                  
                  {missedData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#52525b", fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed #27272a" }}>
                      No missed cross-sells in this period!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {missedData.map(call => renderCallCard(call, "missed"))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

      {selectedCall && (
        <AnalysisModal
          selectedHistoryItem={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </>
  );
}
