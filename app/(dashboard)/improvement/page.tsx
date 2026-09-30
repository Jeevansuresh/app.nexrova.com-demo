"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Clock, CalendarDays, Award, Building2, Brain, AlertCircle, MessageSquare
} from "lucide-react";
import Tab1FinancialLeakage from "./components/Tab1FinancialLeakage";
import Tab2AgentLeaderboard from "./components/Tab2AgentLeaderboard";
import Tab3TimelineInsights from "./components/Tab3TimelineInsights";
import Tab4CoachingInbox from "./components/Tab4CoachingInbox";

const PRIMARY_COLOR = "#6366f1"; // Indigo
const CARD_BG = "#fff";
const CARD_BORDER = "#e2e8f0";

const cardStyle = {
  background: CARD_BG,
  borderRadius: 16,
  boxShadow: "0 4px 20px -2px rgba(148, 163, 184, 0.12), 0 2px 8px -1px rgba(148, 163, 184, 0.08)",
  border: `1px solid ${CARD_BORDER}`,
  padding: "24px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ImprovementDashboard() {
  const [mounted, setMounted] = useState(false);
  
  // Date Picker local inputs
  const [inputStart, setInputStart] = useState(getTodayString());
  const [inputEnd, setInputEnd] = useState(getTodayString());
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  // Actually applied Date Filters (what we pass to our endpoints)
  const [appliedStart, setAppliedStart] = useState(getTodayString());
  const [appliedEnd, setAppliedEnd] = useState(getTodayString());
  
  const [property, setProperty] = useState("all");
  
  // Tabs State (leakage, leaderboard, timeline, inbox)
  const [activeTab, setActiveTab] = useState("leakage");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const todayLimit = getTodayString();

  const handleApplyDates = (e?: any) => {
    if (e) e.preventDefault();
    setAppliedStart(inputStart);
    setAppliedEnd(inputEnd);
  };

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "inherit" }}>
      
      {/* Header bar */}
      <div className="responsive-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Brain size={28} color={PRIMARY_COLOR} style={{ animation: "pulse 2s infinite" }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>AI Sales Coaching Hub</h1>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4, margin: 0 }}>
            &quot;Make every call marginally better at converting the next one.&quot;
          </p>
        </div>
        
        {/* Filters */}
        <div className="responsive-controls">
          
          {/* Custom Date Range Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            
            {/* Single / Custom Range toggle buttons */}
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 2, border: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => {
                  setIsCustomRange(false);
                  setInputEnd(inputStart);
                  // Auto-apply single date changes for quicker navigation
                  setAppliedStart(inputStart);
                  setAppliedEnd(inputStart);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
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
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
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

            {/* Date Input Box */}
            <form onSubmit={handleApplyDates} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", flexWrap: "wrap" }}>
                <CalendarDays size={14} color={PRIMARY_COLOR} />
                <input 
                  type="date" 
                  min="2026-06-10" 
                  max={todayLimit} 
                  value={inputStart} 
                  onChange={e => {
                    setInputStart(e.target.value);
                    if (!isCustomRange) {
                      setInputEnd(e.target.value);
                      setAppliedStart(e.target.value);
                      setAppliedEnd(e.target.value);
                    }
                  }} 
                  style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 500, color: "#374151", background: "transparent", width: 125 }} 
                />
                {isCustomRange && (
                  <>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>→</span>
                    <input 
                      type="date" 
                      min="2026-06-10" 
                      max={todayLimit} 
                      value={inputEnd} 
                      onChange={e => setInputEnd(e.target.value)} 
                      style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 500, color: "#374151", background: "transparent", width: 125 }} 
                    />
                  </>
                )}
              </div>
              
              {/* Apply Button */}
              <button 
                type="submit" 
                style={{
                  background: PRIMARY_COLOR, color: "white", border: "none",
                  borderRadius: 10, padding: "9px 16px", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#4f46e5"}
                onMouseLeave={e => e.currentTarget.style.background = PRIMARY_COLOR}
              >
                Apply
              </button>
            </form>
          </div>

          {/* Property Filter */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Building2 size={14} color={PRIMARY_COLOR} style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
            <select
              value={property}
              onChange={ev => setProperty(ev.target.value)}
              style={{
                padding: "8px 14px 8px 32px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                paddingRight: "30px"
              }}
            >
              <option value="all">All Properties</option>
              <option value="gandhi">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Grand" : "Oasis Grand Reservation"}</option>
              <option value="ridhi">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Palm" : "Oasis Palm Reservation"}</option>
              <option value="qbyk">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Boutique" : "Oasis Boutique Reservation"}</option>
            </select>
            <span style={{ position: "absolute", right: "12px", color: "#94a3b8", fontSize: "10px", pointerEvents: "none" }}>▼</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        {[
          { id: "leakage", label: "FD Gap Analysis", icon: <TrendingUp size={16} /> },
          { id: "leaderboard", label: "Agent Leaderboard", icon: <Award size={16} /> },
          { id: "timeline", label: "Timeline Insights", icon: <Clock size={16} /> },
          { id: "inbox", label: "Coaching Inbox", icon: <MessageSquare size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
            }}
            style={{
              padding: "16px 20px",
              borderBottom: activeTab === t.id ? `3px solid ${PRIMARY_COLOR}` : "3px solid transparent",
              color: activeTab === t.id ? PRIMARY_COLOR : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 600,
              fontSize: 14,
              cursor: "pointer",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              outline: "none",
              transition: "all 0.15s ease-in-out",
              opacity: 1
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {t.icon}
              {t.label}
            </div>
          </button>
        ))}
      </div>

      {/* Body content wrapper */}
      <div className="page-container" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
        {activeTab === "leakage" && (
          <Tab1FinancialLeakage startDate={appliedStart} endDate={appliedEnd} property={property} />
        )}
        {activeTab === "leaderboard" && (
          <Tab2AgentLeaderboard startDate={appliedStart} endDate={appliedEnd} property={property} />
        )}
        {activeTab === "timeline" && (
          <Tab3TimelineInsights startDate={appliedStart} endDate={appliedEnd} property={property} />
        )}
        {activeTab === "inbox" && (
          <Tab4CoachingInbox startDate={appliedStart} endDate={appliedEnd} property={property} />
        )}
      </div>
    </div>
  );
}
