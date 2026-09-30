"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { DatePreset, getDateRangeBounds } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "this-week" },
  { label: "This month", value: "this-month" },
  { label: "Custom", value: "custom" },
];

export default function DateRangePicker({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { datePreset, customStartDate, customEndDate, setDateFilter } = useStore();

  const [localStart, setLocalStart] = useState<string>(customStartDate || "");
  const [localEnd, setLocalEnd] = useState<string>(customEndDate || "");

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Sync local inputs when store changes
  useEffect(() => {
    setLocalStart(customStartDate || "");
    setLocalEnd(customEndDate || "");
  }, [customStartDate, customEndDate]);

  const handleSelectPreset = (preset: DatePreset) => {
    if (preset === "custom") {
      setDateFilter("custom", localStart || null, localEnd || null);
    } else {
      setDateFilter(preset, null, null);
      setOpen(false); // Auto close for presets
    }
  };

  const handleApplyCustom = () => {
    setDateFilter("custom", localStart || null, localEnd || null);
    setOpen(false);
  };

  // Determine display label
  let displayLabel = "Date range";
  if (datePreset === "all") displayLabel = "All time";
  else if (datePreset === "today") displayLabel = "Today";
  else if (datePreset === "yesterday") displayLabel = "Yesterday";
  else if (datePreset === "this-week") displayLabel = "This week";
  else if (datePreset === "this-month") displayLabel = "This month";
  else if (datePreset === "custom") {
    if (customStartDate && customEndDate) {
      displayLabel = `${customStartDate} to ${customEndDate}`;
    } else if (customStartDate) {
      displayLabel = `From ${customStartDate}`;
    } else if (customEndDate) {
      displayLabel = `Until ${customEndDate}`;
    } else {
      displayLabel = "Custom range";
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block", textAlign: "left" }} ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "#475569",
          backgroundColor: open ? "#f8fafc" : "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "6px 12px",
          height: "30px",
          cursor: "pointer",
          outline: "none",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          boxSizing: "border-box"
        }}
      >
        <CalendarIcon size={13} style={{ color: "#94a3b8" }} />
        <span>{displayLabel}</span>
        <ChevronDown size={13} style={{ color: "#94a3b8", marginLeft: "2px" }} />
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            marginTop: "6px",
            width: "240px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 50,
            overflow: "hidden",
            right: align === "right" ? 0 : "auto",
            left: align === "left" ? 0 : "auto"
          }}
        >
          <div style={{ padding: "4px 0" }}>
            {PRESETS.map((preset) => {
              const isActive = datePreset === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => handleSelectPreset(preset.value)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 16px",
                    fontSize: "12px",
                    textAlign: "left",
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#0f172a" : "#475569",
                    backgroundColor: isActive ? "#f1f5f9" : "transparent",
                    transition: "background-color 0.1s"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span>{preset.label}</span>
                  {isActive && <Check size={13} style={{ color: "#0f172a" }} />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Inputs */}
          {datePreset === "custom" && (
            <div style={{ padding: "12px 16px 16px 16px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>Start Date</label>
                  <input
                    type="date"
                    value={localStart}
                    onChange={(e) => setLocalStart(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "6px 10px",
                      fontSize: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>End Date</label>
                  <input
                    type="date"
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "6px 10px",
                      fontSize: "12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                      outline: "none"
                    }}
                  />
                </div>
                <button
                  onClick={handleApplyCustom}
                  style={{
                    width: "100%",
                    padding: "6px 0",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "4px",
                    transition: "background-color 0.15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1e293b"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#0f172a"}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
