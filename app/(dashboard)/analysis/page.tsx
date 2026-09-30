"use client";

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, Brain, Activity, List, Trophy, ChevronDown, CheckCircle, AlertCircle, X, RefreshCw, Loader2, Building2, Trash2, Save, Send, Check, AlertTriangle, Clock, Calendar, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { api, BASE } from "@/lib/api";
import { getDateRangeBounds } from "@/lib/dateUtils";
import DateRangePicker from "@/components/DateRangePicker";

const parseDateStr = (dateStr?: string) => {
  if (!dateStr || dateStr === "None" || String(dateStr).trim() === "") return new Date();
  try {
    const s = String(dateStr);
    if (s.endsWith("Z")) {
      return new Date(s);
    }
    return new Date(s.replace(" ", "T"));
  } catch (e) {
    return new Date();
  }
};

const formatAnalyzedDate = (dateStr?: string) => {
  const d = parseDateStr(dateStr);
  if (isNaN(d.getTime())) {
    return "Unknown Date";
  }
  try {
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch (e) {
    return d.toString();
  }
};

const formatTableDate = (dateStr?: string) => {
  const d = parseDateStr(dateStr);
  if (isNaN(d.getTime())) {
    return "N/A";
  }
  try {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch (e) {
    return "N/A";
  }
};

const formatTableTime = (dateStr?: string) => {
  const d = parseDateStr(dateStr);
  if (isNaN(d.getTime())) {
    return "";
  }
  try {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "";
  }
};

export default function AnalysisPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [transcript, setTranscript] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("Reservation Closer");
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ingestStatus, setIngestStatus] = useState<any>(null);
  
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const datePreset = useStore((s: any) => s.datePreset);
  const customStartDate = useStore((s: any) => s.customStartDate);
  const customEndDate = useStore((s: any) => s.customEndDate);
  const storeSettings = useStore((s: any) => s.settings);
  const setSettings = useStore((s: any) => s.setSettings);

  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [formattedSyncTime, setFormattedSyncTime] = useState("");
  const [formattedSyncDate, setFormattedSyncDate] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [viewModeTab, setViewModeTab] = useState<"ranking" | "recent">("ranking");

  // Followup status filter state
  const [followupFilter, setFollowupFilter] = useState<"all" | "missing" | "pending" | "sent">("all");
  const [callCategoryFilter, setCallCategoryFilter] = useState<"all" | "enquiries">("all");
  const [selectedTiersFilter, setSelectedTiersFilter] = useState<string[]>(["A", "B", "C", "D"]);
  
  // Followup action states
  const [phoneInputs, setPhoneInputs] = useState<Record<number, string>>({});
  const [updatingPhone, setUpdatingPhone] = useState<Record<number, boolean>>({});
  const [sendingIndividual, setSendingIndividual] = useState<Record<number, boolean>>({});
  const [sendingAll, setSendingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local settings states for auto-send toggles
  const [pickyEnabled, setPickyEnabled] = useState(false);
  const [followupTiers, setFollowupTiers] = useState<string[]>([]);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (storeSettings) {
      setPickyEnabled(!!storeSettings.picky_assist_enabled);
      setFollowupTiers(storeSettings.followup_tiers || []);
    }
  }, [storeSettings]);

  const handleToggleAutoSend = async () => {
    const newVal = !pickyEnabled;
    setPickyEnabled(newVal);
    setSettingsSaving(true);
    try {
      const res = await fetch(`${BASE}/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picky_assist_enabled: newVal,
          followup_tiers: followupTiers,
        }),
      });
      const data = await res.json();
      if (data.status === "success" && data.settings) {
        setSettings(data.settings);
      } else {
        alert("Failed to toggle settings: " + data.message);
        setPickyEnabled(!newVal); // revert
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings: " + err.message);
      setPickyEnabled(!newVal); // revert
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleToggleTier = async (tier: string) => {
    let updatedTiers = [...followupTiers];
    if (updatedTiers.includes(tier)) {
      updatedTiers = updatedTiers.filter(t => t !== tier);
    } else {
      updatedTiers.push(tier);
    }
    setFollowupTiers(updatedTiers);
    setSettingsSaving(true);
    try {
      const res = await fetch(`${BASE}/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          picky_assist_enabled: pickyEnabled,
          followup_tiers: updatedTiers,
        }),
      });
      const data = await res.json();
      if (data.status === "success" && data.settings) {
        setSettings(data.settings);
      } else {
        alert("Failed to update tiers settings: " + data.message);
        setFollowupTiers(followupTiers); // revert
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings: " + err.message);
      setFollowupTiers(followupTiers); // revert
    } finally {
      setSettingsSaving(false);
    }
  };

  const enquiriesCount = history.filter((item) => {
    const callType = item.call_type;
    const segment  = item.enquirer_segment;
    const name     = (item.caller_name || "").toLowerCase();
    return callType !== "OTHER" && segment !== "other" && !name.includes("caretaker");
  }).length;

  const filteredCategoryHistory = history.filter((item) => {
    if (callCategoryFilter === "enquiries") {
      const callType = item.call_type;
      const segment  = item.enquirer_segment;
      const name     = (item.caller_name || "").toLowerCase();

      if (callType === "OTHER") return false;
      if (segment === "other") return false;
      if (name.includes("caretaker")) return false;
    }
    return true;
  });

  const missingCount = filteredCategoryHistory.filter(item => item.followup_sent === 0 && item.tier !== "N/A" && (!item.caller_phone || !item.caller_phone.trim())).length;
  const pendingCount = filteredCategoryHistory.filter(item => item.followup_sent === 0 && item.tier !== "N/A" && item.caller_phone && item.caller_phone.trim()).length;
  const sentCount = filteredCategoryHistory.filter(item => item.followup_sent === 1 && item.tier !== "N/A").length;

  const filteredHistory = filteredCategoryHistory.filter((item) => {
    if (!selectedTiersFilter.includes(item.tier)) {
      return false;
    }
    if (followupFilter === "missing") {
      return item.followup_sent === 0 && item.tier !== "N/A" && (!item.caller_phone || !item.caller_phone.trim());
    }
    if (followupFilter === "pending") {
      return item.followup_sent === 0 && item.tier !== "N/A" && item.caller_phone && item.caller_phone.trim();
    }
    if (followupFilter === "sent") {
      return item.followup_sent === 1 && item.tier !== "N/A";
    }
    return true;
  });

  useEffect(() => {
    if (ingestStatus?.last_auto_sync) {
      const utcDate = parseDateStr(ingestStatus.last_auto_sync);
      
      // format local time like "11:31 AM"
      setFormattedSyncTime(utcDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
      
      // format local date like "08 Jun 2026"
      setFormattedSyncDate(utcDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
    } else {
      setFormattedSyncTime("Never");
      setFormattedSyncDate("");
    }
  }, [ingestStatus?.last_auto_sync]);

  const handleGDriveSync = async () => {
    try {
      setIngestStatus((prev: any) => prev ? { ...prev, is_syncing: true } : { is_syncing: true });
      const res = await fetch(`${BASE}/api/analysis/sync_gdrive`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        fetchIngestStatus();
      } else {
        alert("Sync failed: " + data.message);
      }
    } catch (error) {
      console.error("GDrive Sync Error:", error);
      alert("Failed to connect to the backend.");
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchIngestStatus();
    fetchSettings();
  }, [selectedPersona]);

  useEffect(() => {
    fetchHistory();
  }, [datePreset, customStartDate, customEndDate, selectedFolder, viewModeTab]);

  // Auto-refresh history + ingest status every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistory();
      fetchIngestStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [datePreset, customStartDate, customEndDate, selectedFolder, viewModeTab]);

  // Fast-polling during active sync
  useEffect(() => {
    if (ingestStatus?.is_syncing) {
      const interval = setInterval(() => {
        fetchIngestStatus();
        fetchHistory();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [ingestStatus?.is_syncing, datePreset, customStartDate, customEndDate, selectedFolder, viewModeTab]);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/analysis/templates`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        const fetchedTemplates = Array.isArray(data.data) ? data.data : [];
        setTemplates(fetchedTemplates);
        if (fetchedTemplates.length > 0) {
          const current = fetchedTemplates.find((t: any) => t.persona === selectedPersona) || fetchedTemplates[0];
          setSelectedPersona(current.persona);
          setTranscript(current.transcript || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    }
  }, []);

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/settings`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success" && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  }, [setSettings]);

  const fetchIngestStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/analysis/ingest_status`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") setIngestStatus(data);
    } catch (error) {
      console.error("Failed to fetch ingest status", error);
    }
  }, []);

  const fetchHistory = React.useCallback(async () => {
    try {
      const bounds = getDateRangeBounds(datePreset, customStartDate, customEndDate);
      let url = `${BASE}/api/analysis/history`;
      const params = new URLSearchParams();
      if (bounds.start) params.append("start_date", bounds.start);
      if (bounds.end) params.append("end_date", bounds.end);
      if (selectedFolder !== "all") params.append("folder_id", selectedFolder);
      if (viewModeTab !== "ranking") params.append("sort_by", viewModeTab);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  }, [datePreset, customStartDate, customEndDate, selectedFolder, viewModeTab]);

  const handlePhoneInputChange = React.useCallback((id: number, value: string) => {
    setPhoneInputs((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSavePhone = React.useCallback(async (id: number) => {
    const rawPhone = phoneInputs[id];
    if (!rawPhone || !rawPhone.trim()) {
      alert("Please enter a valid phone number.");
      return;
    }

    setUpdatingPhone((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.followups.updatePhone(id, rawPhone.trim());
      if (res.status === "success") {
        setSuccessMessage("Phone number saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchHistory();
      } else {
        alert("Failed to save phone number: " + res.message);
      }
    } catch (err: any) {
      console.error("Error saving phone:", err);
      alert("Error saving phone: " + err.message);
    } finally {
      setUpdatingPhone((prev) => ({ ...prev, [id]: false }));
    }
  }, [phoneInputs, fetchHistory]);

  const handleSendAll = React.useCallback(async () => {
    const pendingItems = history.filter(
      (item) => item.followup_sent === 0 && item.tier !== "N/A" && item.caller_phone && item.caller_phone.trim()
    );
    if (pendingItems.length === 0) {
      alert("No pending follow-ups to send.");
      return;
    }

    if (!confirm(`Are you sure you want to send follow-ups to all ${pendingItems.length} pending leads in bulk?`)) {
      return;
    }

    setSendingAll(true);
    try {
      const res = await api.followups.sendAllFailed();
      if (res.status === "success") {
        alert(res.message || "Successfully sent bulk follow-ups!");
        fetchHistory();
      } else {
        alert("Failed to send bulk follow-ups: " + res.message);
      }
    } catch (err: any) {
      console.error("Error sending bulk follow-ups:", err);
      alert("Error sending bulk follow-ups: " + err.message);
    } finally {
      setSendingAll(false);
    }
  }, [history, fetchHistory]);

  const deleteRecord = React.useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this historical record? This will permanently remove it from the dashboard and database.")) return;
    try {
      const res = await fetch(`${BASE}/api/analysis/history/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        fetchHistory();
        fetchIngestStatus();
      } else {
        alert("Failed to delete record: " + data.message);
      }
    } catch (err) {
      console.error("Error deleting record", err);
      alert("Error deleting record.");
    }
  }, [fetchHistory, fetchIngestStatus]);

  const clearHistory = React.useCallback(async () => {
    if (!confirm("WARNING: Are you sure you want to delete ALL historical records from the dashboard and database? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE}/api/analysis/history/clear`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        fetchHistory();
        fetchIngestStatus();
      } else {
        alert("Failed to clear history: " + data.message);
      }
    } catch (err) {
      console.error("Error clearing history", err);
      alert("Error clearing history.");
    }
  }, [fetchHistory, fetchIngestStatus]);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPersona(val);
    const tmpl = templates.find((t) => t.persona === val);
    if (tmpl) setTranscript(tmpl.transcript);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTranscribing(true);
    setTranscript("⏳ Transcribing audio with Azure Speech-to-Text...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use the full STT + o3-mini pipeline endpoint (s_no=0 = no DB save for analysis page)
      const res = await fetch(`${BASE}/api/analysis/transcribe_polished`, { credentials: "include",
        method: "POST",
        body: formData,
      });

      // Fallback: if the new endpoint doesn't exist yet, fall back to basic transcribe
      if (res.status === 404) {
        const fallback = await fetch(`${BASE}/api/analysis/transcribe`, { credentials: "include",
          method: "POST",
          body: formData,
        });
        const fd = await fallback.json();
        if (fd.status === "success") {
          setTranscript(fd.transcript);
        } else {
          alert("Transcription failed: " + fd.message);
          setTranscript("");
        }
        return;
      }

      const data = await res.json();
      if (data.status === "success" || data.status === "partial") {
        setTranscript(data.transcript || data.raw_text || "");
      } else {
        alert("Transcription failed: " + (data.message || "Unknown error"));
        setTranscript("");
      }
    } catch (error) {
      console.error("Transcription Error:", error);
      alert("Failed to connect to the backend for transcription.");
      setTranscript("");
    } finally {
      setTranscribing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BASE}/api/analysis/analyze`, { credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, persona: selectedPersona })
      });
      const data = await res.json();
      if (data.status === "success") {
        setResult(data);
        fetchHistory(); // Refresh history
      } else {
        alert("Analysis failed: " + data.message);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const rankingsTable = (
      <div className="kecie-card animate-fade-in-up" style={{ marginTop: "24px", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {viewModeTab === "ranking" ? (
              <Trophy size={18} className="text-amber-500" />
            ) : (
              <Activity size={18} className="text-blue-500" />
            )}
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0, whiteSpace: "nowrap" }}>
              {viewModeTab === "ranking" ? "Historical Rankings" : "Recent Uploads"}
            </h2>
            
            {/* View Mode Toggle: Segmented Control */}
            <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0", marginLeft: "6px" }}>
              <button
                onClick={() => setViewModeTab("ranking")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewModeTab === "ranking" ? "#ffffff" : "transparent",
                  color: viewModeTab === "ranking" ? "#0f172a" : "#64748b",
                  boxShadow: viewModeTab === "ranking" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s"
                }}
              >
                Rankings
              </button>
              <button
                onClick={() => setViewModeTab("recent")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewModeTab === "recent" ? "#ffffff" : "transparent",
                  color: viewModeTab === "recent" ? "#0f172a" : "#64748b",
                  boxShadow: viewModeTab === "recent" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.15s"
                }}
              >
                Recent
              </button>
            </div>
          </div>

          {/* Right side global filters */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Building2 size={13} style={{ position: "absolute", left: "10px", color: "#94a3b8", pointerEvents: "none" }} />
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "6px 12px 6px 30px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.15s"
                }}
              >
                <option value="all">All Properties</option>
                <option value="1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO">Oasis Palm Reservation</option>
                <option value="1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66">Oasis Boutique Reservation</option>
                <option value="1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47">{typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Grand" : "Oasis Grand Reservation"}</option>
              </select>
            </div>

            <DateRangePicker align="right" />

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ef4444",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fee2e2",
                  borderRadius: "8px",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
                title="Delete All Historical Records"
              >
                <Trash2 size={13} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Sub-bar (Table status filter tabs + bulk actions) */}
        <div style={{ padding: "12px 24px", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          {/* Status filter tabs styled as button pills */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", maxWidth: "100%", paddingBottom: "2px" }}>
            <button
              onClick={() => {
                setCallCategoryFilter("enquiries");
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                backgroundColor: callCategoryFilter === "enquiries" ? "#0f172a" : "transparent",
                color: callCategoryFilter === "enquiries" ? "#ffffff" : "#64748b"
              }}
            >
              Enquiries ({enquiriesCount})
            </button>

            {/* Tiers Filter Checkboxes */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px", marginLeft: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Tiers:</span>
              {["A", "B", "C", "D", "N/A"].map((tier) => {
                const checked = selectedTiersFilter.includes(tier);
                return (
                  <label key={tier} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#475569", cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedTiersFilter(prev => 
                          prev.includes(tier) 
                            ? prev.filter(t => t !== tier) 
                            : [...prev, tier]
                        );
                      }}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        cursor: "pointer",
                        accentColor: "#0f172a"
                      }}
                    />
                    {tier}
                  </label>
                );
              })}
            </div>

            <button
              onClick={() => {
                setFollowupFilter("all");
                setCallCategoryFilter("all");
                setSelectedTiersFilter(["A", "B", "C", "D", "N/A"]);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                backgroundColor: (callCategoryFilter === "all" && followupFilter === "all") ? "#0f172a" : "transparent",
                color: (callCategoryFilter === "all" && followupFilter === "all") ? "#ffffff" : "#64748b"
              }}
            >
              All Calls ({history.length})
            </button>
            <button
              onClick={() => setFollowupFilter("missing")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: followupFilter === "missing" ? "#0f172a" : "transparent",
                color: followupFilter === "missing" ? "#ffffff" : "#64748b"
              }}
            >
              Missing Number
              <span style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "999px",
                fontWeight: 700,
                backgroundColor: followupFilter === "missing" ? "rgba(255,255,255,0.2)" : "#fee2e2",
                color: followupFilter === "missing" ? "#ffffff" : "#ef4444"
              }}>
                {missingCount}
              </span>
            </button>
            <button
              onClick={() => setFollowupFilter("pending")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: followupFilter === "pending" ? "#0f172a" : "transparent",
                color: followupFilter === "pending" ? "#ffffff" : "#64748b"
              }}
            >
              Pending Send
              <span style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "999px",
                fontWeight: 700,
                backgroundColor: followupFilter === "pending" ? "rgba(255,255,255,0.2)" : "#dbeafe",
                color: followupFilter === "pending" ? "#ffffff" : "#2563eb"
              }}>
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setFollowupFilter("sent")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: followupFilter === "sent" ? "#0f172a" : "transparent",
                color: followupFilter === "sent" ? "#ffffff" : "#64748b"
              }}
            >
              Sent Successfully
              <span style={{
                fontSize: "10px",
                padding: "1px 6px",
                borderRadius: "999px",
                fontWeight: 700,
                backgroundColor: followupFilter === "sent" ? "rgba(255,255,255,0.2)" : "#d1fae5",
                color: followupFilter === "sent" ? "#ffffff" : "#059669"
              }}>
                {sentCount}
              </span>
            </button>
          </div>

          {/* Right side stats & primary bulk action button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>
              Showing {filteredHistory.length} of {history.length} Calls
            </span>
            {followupFilter === "pending" && pendingCount > 0 && (
              <button
                onClick={handleSendAll}
                disabled={sendingAll}
                className="kecie-btn-primary"
                style={{ padding: "6px 14px", fontSize: "12px", height: "30px" }}
              >
                {sendingAll ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Send All Pending
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          {successMessage && (
            <div style={{ backgroundColor: "#ecfdf5", borderBottom: "1px solid #d1fae5", color: "#065f46", padding: "10px 24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 600 }}>
              <CheckCircle size={15} style={{ color: "#059669" }} />
              <span>{successMessage}</span>
            </div>
          )}           <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>
                  {viewModeTab === "ranking" ? "Rank" : "Uploaded At"}
                </th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Persona</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Enquiry Details</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Score</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Tier</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Follow-up</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Delete</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#ffffff" }}>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 18px", textAlign: "center", color: "#94a3b8", fontWeight: 500 }}>
                    No transcripts matching the filter were found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/40" style={{ transition: "all 0.15s", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                      {viewModeTab === "ranking" ? (
                        index < 3 ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            fontSize: "12px",
                            fontWeight: 700,
                            backgroundColor: index === 0 ? '#fef3c7' : index === 1 ? '#f1f5f9' : '#ffedd5',
                            color: index === 0 ? '#b45309' : index === 1 ? '#475569' : '#c2410c'
                          }}>
                            {index + 1}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontWeight: 600, paddingLeft: "8px", fontSize: "13px" }}>{index + 1}</span>
                        )
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "12px" }}>
                            {formatTableDate(item.created_at)}
                          </span>
                          <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 400, marginTop: "2px" }}>
                            {formatTableTime(item.created_at)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px" }}>{item.caller_name || item.persona_name}</div>
                      {item.caller_phone && (
                        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace", marginTop: "2px" }}>{item.caller_phone}</div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                        {item.call_count > 1 && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            border: "1px solid #fee2e2"
                          }}>
                            Called {item.call_count} times today
                          </span>
                        )}
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: item.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#faf5ff" :
                                           item.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#e0e7ff" :
                                           item.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#fffbeb" : "#f1f5f9",
                          color: item.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#7e22ce" :
                                 item.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#4338ca" :
                                 item.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#b45309" : "#475569",
                          border: `1px solid ${
                            item.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "#f3e8ff" :
                            item.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "#c7d2fe" :
                            item.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? "#fef3c7" : "#e2e8f0"
                          }`
                        }}>
                          {item.gdrive_folder_id === "1sVQdZu3CkXuGco18NmJh9AQa0xGeNHYO" ? "Oasis Palm Reservation" :
                           item.gdrive_folder_id === "1OeOnMYkXWS_i8DV1NDoIqA5Gfovv1d66" ? "Oasis Boutique Reservation" :
                           item.gdrive_folder_id === "1rg3JvWsseCJF_N5beZ2BZCP0kgn0GZ47" ? (typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Oasis Grand" : "Oasis Grand Reservation") :
                           item.source === "android_auto" ? "Android Ingest" : "Manual Upload"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistoryItem(item);
                          }}
                          style={{
                            padding: "5px 10px",
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s",
                            whiteSpace: "nowrap"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#eff6ff"; e.currentTarget.style.borderColor = "#bfdbfe"; }}
                        >
                          <FileText size={12} />
                          View Transcript
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "64px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                          <div 
                            style={{ height: "100%", backgroundColor: "#3b82f6", borderRadius: "999px", width: `${item.total_score}%` }} 
                          />
                        </div>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.total_score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                      <span style={{
                        whiteSpace: "nowrap",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "999px",
                        backgroundColor: item.tier === 'A' ? '#d1fae5' :
                                         item.tier === 'B' ? '#dbeafe' :
                                         item.tier === 'C' ? '#fef3c7' :
                                         item.tier === 'D' ? '#fee2e2' : '#f1f5f9',
                        color: item.tier === 'A' ? '#065f46' :
                               item.tier === 'B' ? '#1e40af' :
                               item.tier === 'C' ? '#92400e' :
                               item.tier === 'D' ? '#991b1b' : '#374151'
                      }}>
                        Tier {item.tier}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle" }} onClick={(e) => e.stopPropagation()}>
                      {item.tier === "N/A" ? (
                        <span style={{ color: "#94a3b8", fontWeight: 500 }}>—</span>
                      ) : item.followup_sent === 1 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#047857", backgroundColor: "#ecfdf5", border: "1px solid #d1fae5", padding: "4px 8px", borderRadius: "999px" }}>
                          <Check size={13} />
                          Sent
                        </span>
                      ) : (!item.caller_phone || !item.caller_phone.trim()) ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="text"
                            placeholder="e.g. +919876543210"
                            value={phoneInputs[item.id] || ""}
                            onChange={(e) => handlePhoneInputChange(item.id, e.target.value)}
                            style={{
                              padding: "5px 10px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              fontSize: "12px",
                              width: "135px",
                              outline: "none",
                              boxSizing: "border-box"
                            }}
                          />
                          <button
                            onClick={() => handleSavePhone(item.id)}
                            disabled={updatingPhone[item.id]}
                            style={{
                              padding: "6px",
                              backgroundColor: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#2563eb",
                              borderRadius: "6px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: updatingPhone[item.id] ? 0.6 : 1
                            }}
                            title="Save Phone Number"
                          >
                            {updatingPhone[item.id] ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Save size={13} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to send this WhatsApp follow-up via Picky Assist?")) {
                                return;
                              }
                              setSendingIndividual((prev) => ({ ...prev, [item.id]: true }));
                              try {
                                const res = await fetch(`${BASE}/api/analysis/history/${item.id}/trigger_followup`, { credentials: "include",
                                  method: "POST",
                                });
                                const data = await res.json();
                                if (data.status === "success") {
                                  setSuccessMessage(data.message || "Follow-up sent successfully!");
                                  setTimeout(() => setSuccessMessage(null), 3000);
                                  fetchHistory();
                                } else {
                                  alert("Failed to send follow-up: " + data.message);
                                }
                              } catch (err: any) {
                                console.error("Error triggering follow-up:", err);
                                alert("Error sending follow-up: " + err.message);
                              } finally {
                                setSendingIndividual((prev) => ({ ...prev, [item.id]: false }));
                              }
                            }}
                            disabled={sendingIndividual[item.id]}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "6px 12px",
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              whiteSpace: "nowrap",
                              opacity: sendingIndividual[item.id] ? 0.6 : 1
                            }}
                          >
                            {sendingIndividual[item.id] ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                Send
                              </>
                            )}
                          </button>
                          {item.needs_followup === 1 && (
                            <span style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              color: "#ea580c",
                              backgroundColor: "#ffedd5",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap"
                            }}>
                              Requires Follow-up
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", verticalAlign: "middle", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => deleteRecord(item.id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                        title="Delete Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
    </div>
  );


  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>LEAD INTELLIGENCE</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Tri-Agent pipeline analysis for voice call transcripts</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
            MP
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ padding: "20px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Auto-Sync Status Panel */}
      {ingestStatus && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "8px" }}>
          {/* Card 1: Total Processed */}
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ background: "#eff6ff", borderRadius: "50%", width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 2 }}>Total Processed</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{ingestStatus.total_processed}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>all time</div>
            </div>
          </div>

          {/* Card 2: GDrive Synced */}
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ background: "#ecfdf5", borderRadius: "50%", width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={22} color="#059669" className={ingestStatus.is_syncing ? "animate-spin" : ""} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#059669", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} className={ingestStatus.is_syncing ? "animate-ping" : "animate-pulse"} />
                GDrive Synced
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#047857", lineHeight: 1.1 }}>{ingestStatus.auto_synced}</span>
                <button
                  onClick={handleGDriveSync}
                  disabled={ingestStatus.is_syncing}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#059669",
                    background: "#f0fdf4",
                    border: "1px solid #d1fae5",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    opacity: ingestStatus.is_syncing ? 0.6 : 1
                  }}
                >
                  {ingestStatus.is_syncing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Sync Now
                    </>
                  )}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>from Google Drive</div>
            </div>
          </div>

          {/* Card 3: Manual Uploads */}
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ background: "#fef3c7", borderRadius: "50%", width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UploadCloud size={22} color="#d97706" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 2 }}>Manual Uploads</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{ingestStatus.manual_uploaded}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>via dashboard</div>
            </div>
          </div>

          {/* Card 4: Last Sync */}
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ background: "#f3f4f6", borderRadius: "50%", width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={22} color="#4b5563" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 2 }}>Last Sync</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{formattedSyncTime}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{formattedSyncDate ? `on ${formattedSyncDate}` : "on demand"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Automation Configuration Card */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "18px 20px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: pickyEnabled ? "#16a34a" : "#cbd5e1", display: "inline-block" }} className={pickyEnabled ? "animate-pulse" : ""} />
              Automated WhatsApp Follow-ups Control
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Enable or pause automatic messages via Picky Assist. Follow-ups will be sent instantly to leads that strictly require it.
            </p>
          </div>

          {/* Master Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Auto-Send:</span>
            <button
              onClick={handleToggleAutoSend}
              disabled={settingsSaving}
              style={{
                position: "relative",
                display: "inline-flex",
                height: 22,
                width: 42,
                flexShrink: 0,
                cursor: settingsSaving ? "not-allowed" : "pointer",
                borderRadius: 9999,
                border: "2px solid transparent",
                backgroundColor: pickyEnabled ? "#16a34a" : "#cbd5e1",
                transition: "background-color 0.2s ease",
                outline: "none",
                opacity: settingsSaving ? 0.7 : 1
              }}
            >
              <span
                style={{
                  pointerEvents: "none",
                  display: "inline-block",
                  height: 18,
                  width: 18,
                  transform: pickyEnabled ? "translateX(20px)" : "translateX(0px)",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease"
                }}
              />
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", minWidth: 40 }}>
              {settingsSaving ? "..." : (pickyEnabled ? "Active" : "Paused")}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#f1f5f9" }} />

        {/* Tier Flex Selection */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Auto-Send Target Tiers:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {["A", "B", "C", "D"].map((t) => {
              const isChecked = followupTiers.includes(t);
              return (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={settingsSaving}
                    onChange={() => handleToggleTier(t)}
                    style={{
                      accentColor: "#2563eb",
                      width: 15,
                      height: 15,
                      cursor: "pointer"
                    }}
                  />
                  <span>Tier {t}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 auto", minWidth: "250px" }}>
            <List size={16} color="#94a3b8" />
            <select 
              value={selectedPersona}
              onChange={handleTemplateSelect}
              style={{
                fontSize: "13px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "8px 12px",
                outline: "none",
                background: "#fff",
                width: "100%",
                maxWidth: "320px",
                cursor: "pointer"
              }}
            >
                            {templates.map((t, i) => (
                <option key={i} value={t.persona}>{t.persona}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input 
              type="file" 
              accept=".wav,.mp3,.m4a,.ogg" 
              className="hidden" 
              ref={audioFileInputRef} 
              onChange={handleAudioUpload}
            />
            <button 
              onClick={() => audioFileInputRef.current?.click()}
              disabled={transcribing || loading}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: (transcribing || loading) ? 0.6 : 1
              }}
            >
              <UploadCloud size={16} />
              {transcribing ? "Transcribing..." : "Upload Audio"}
            </button>
            <button 
              onClick={handleAnalyze}
              disabled={loading || transcribing || !transcript.trim()}
              style={{
                background: (loading || transcribing || !transcript.trim()) ? "#e2e8f0" : "#1e40af",
                color: (loading || transcribing || !transcript.trim()) ? "#94a3b8" : "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: (loading || transcribing || !transcript.trim()) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.15s ease"
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Activity size={16} />
              )}
              {loading ? "Analyzing..." : transcribing ? "Transcribing..." : "Analyze Transcript"}
            </button>
          </div>
        </div>
        
        <div style={{ padding: 0 }}>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your call transcript here or select a template..."
            style={{
              width: "100%",
              height: "260px",
              padding: "20px",
              fontSize: "14px",
              fontFamily: "monospace",
              color: "#334155",
              border: "none",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* Results Dashboard */}
      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "12px", marginBottom: "12px" }}>
          
          {/* Card 1: Signals */}
          <div className="kecie-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>1. Extracted Signals</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>Rooms</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", backgroundColor: "#ffffff", padding: "2px 8px", borderRadius: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>{result.signals.rooms_requested}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>Nights</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", backgroundColor: "#ffffff", padding: "2px 8px", borderRadius: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>{result.signals.stay_duration}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>Price Sensitive</span>
                {result.signals.price_sensitive ? (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", backgroundColor: "#fee2e2", padding: "4px 8px", borderRadius: "6px" }}>Yes</span>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", backgroundColor: "#d1fae5", padding: "4px 8px", borderRadius: "6px" }}>No</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>Event Lock-in</span>
                {result.signals.event_related ? (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", backgroundColor: "#dbeafe", padding: "4px 8px", borderRadius: "6px" }}>Yes</span>
                ) : (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>No</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Score */}
          <div className="kecie-card" style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", width: "100%", textAlign: "left", marginBottom: "20px" }}>2. Lead Score</h3>
            
            <div style={{ position: "relative", width: "128px", height: "128px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "10px solid #f1f5f9", marginBottom: "20px" }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }} viewBox="0 0 100 100">
                <circle style={{ color: "#3b82f6", stroke: "currentColor", strokeWidth: "10", strokeLinecap: "round", fill: "none", strokeDasharray: `${result.score.total * 2.83} 283` }} cx="50" cy="50" r="45" />
              </svg>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a" }}>{result.score.total}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>/ 100</span>
              </div>
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 500 }}>
                <span style={{ color: "#64748b" }}>Lock-in</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{result.score.lock_in} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/ 30</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 500 }}>
                <span style={{ color: "#64748b" }}>Revenue</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{result.score.revenue} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/ 25</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 500 }}>
                <span style={{ color: "#64748b" }}>Intent</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{result.score.intent} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/ 25</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 500 }}>
                <span style={{ color: "#64748b" }}>Sensitivity</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{result.score.sensitivity} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/ 20</span></span>
              </div>
            </div>
            {result.score.reasoning && (
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#475569", textAlign: "left", width: "100%", overflowY: "auto", maxHeight: "120px" }}>
                <span style={{ fontWeight: 700, color: "#334155", marginBottom: "4px", display: "block" }}>AI Reasoning:</span>
                {result.score.reasoning}
              </div>
            )}
          </div>

          {/* Card 3: Decision */}
          <div className="kecie-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>3. Decision & Action</h3>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{
                padding: "6px 12px",
                fontSize: "20px",
                fontWeight: 900,
                borderRadius: "8px",
                backgroundColor: result.decision.tier === 'A' ? '#d1fae5' :
                                 result.decision.tier === 'B' ? '#dbeafe' :
                                 result.decision.tier === 'C' ? '#fef3c7' : '#fee2e2',
                color: result.decision.tier === 'A' ? '#065f46' :
                       result.decision.tier === 'B' ? '#1e40af' :
                       result.decision.tier === 'C' ? '#92400e' : '#991b1b'
              }}>
                Tier {result.decision.tier}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{result.decision.priority} PRIORITY</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
              <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "12px", border: "1px solid #dbeafe" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <CheckCircle size={18} style={{ color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#1e40af", margin: "0 0 4px 0" }}>Follow-up Action</h4>
                    <p style={{ fontSize: "13.5px", color: "#1e3a8a", fontWeight: 500, margin: 0 }}>{result.decision.followup}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ backgroundColor: "#faf5ff", padding: "16px", borderRadius: "12px", border: "1px solid #f3e8ff" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <AlertCircle size={18} style={{ color: "#a855f7", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#7e22ce", margin: "0 0 4px 0" }}>Discount Strategy</h4>
                    <p style={{ fontSize: "13.5px", color: "#581c87", fontWeight: 500, margin: 0 }}>{result.decision.discount}</p>
                  </div>
                </div>
              </div>
              {result.decision.suggested_action && (
                <div style={{ backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #d1fae5" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <FileText size={18} style={{ color: "#22c55e", marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#16a34a", margin: "0 0 4px 0" }}>Suggested Script / Action</h4>
                      <p style={{ fontSize: "13px", color: "#14532d", fontWeight: 500, margin: 0, whiteSpace: "pre-wrap" }}>{result.decision.suggested_action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call Performance Critique */}
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.12)", borderRadius: "12px", padding: "24px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(239, 68, 68, 0.1)", paddingBottom: "12px" }}>
              <AlertCircle size={18} style={{ color: "#dc2626" }} />
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#991b1b", margin: 0 }}>Front Desk Audit & Performance Review</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <div style={{ padding: "16px", background: "#ffffff", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#991b1b", marginBottom: "8px", letterSpacing: "0.05em" }}>What Went Wrong / Missed Opportunities</h4>
                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                  {result.decision.what_went_wrong || "No major issues identified during the call."}
                </p>
              </div>
              <div style={{ padding: "16px", background: "#ffffff", borderRadius: "12px", border: "1px solid rgba(34, 197, 94, 0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#16a34a", marginBottom: "8px", letterSpacing: "0.05em" }}>How It Could Have Been Better</h4>
                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                  {result.decision.improvement_suggestions || "The front desk agent's performance was optimal."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {rankingsTable}

      {selectedHistoryItem && (
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
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>Analysis Details: {selectedHistoryItem.caller_name || selectedHistoryItem.persona_name}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}>
                    Analyzed on {formatAnalyzedDate(selectedHistoryItem.created_at)}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
                    Phone: {selectedHistoryItem.caller_phone || "Unknown"}
                  </span>
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
                onClick={() => setSelectedHistoryItem(null)}
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
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Full Call Transcript</h3>
                </div>
                
                {(() => {
                  const transcripts = selectedHistoryItem.all_transcripts && selectedHistoryItem.all_transcripts.length > 0 
                    ? selectedHistoryItem.all_transcripts 
                    : [{ timestamp: selectedHistoryItem.created_at || new Date().toISOString(), text: selectedHistoryItem.call_transcript }];
                    
                  if (transcripts.length === 0 || !transcripts[0].text) {
                    return (
                      <div style={{ backgroundColor: "#0f172a", borderRadius: "10px", padding: "18px 20px", color: "#64748b", fontStyle: "italic", fontSize: "12.5px" }}>
                        No transcript available for this call.
                      </div>
                    );
                  }
                  
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxHeight: "620px", overflowY: "auto" }}>
                      {transcripts.map((t: any, idx: number) => {
                        const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={idx}>
                            {transcripts.length > 1 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <div style={{ height: "1px", backgroundColor: "#e2e8f0", flex: 1 }}></div>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  Transcript {idx + 1} ({timeStr})
                                </span>
                                <div style={{ height: "1px", backgroundColor: "#e2e8f0", flex: 1 }}></div>
                              </div>
                            )}
                            <div style={{
                              backgroundColor: "#0f172a",
                              borderRadius: "10px",
                              padding: "22px 24px",
                              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                              fontSize: "14.5px",
                              lineHeight: "1.9",
                              color: "#e2e8f0",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word"
                            }}>
                              {t.text || <span style={{ color: "#64748b", fontStyle: "italic" }}>No transcript text.</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>


              {/* ── 1. Factual Booking Metadata ─────────────────────────── */}
              <div style={{ padding: "20px 24px 0" }}>
                <h3 style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>1. Factual Booking Metadata</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {[
                    { label: "Call Type",      value: selectedHistoryItem.call_type?.replace(/_/g, " ") || "N/A",         color: "#1d4ed8", bg: "#eff6ff", border: "#dbeafe" },
                    { label: "Property",       value: selectedHistoryItem.property_called?.replace(/_/g, " ") || "N/A",   color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                    { label: "Rooms",          value: selectedHistoryItem.rooms_requested || "N/A",                               color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                    { label: "Nights",         value: selectedHistoryItem.nights || "N/A",          color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
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

            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
