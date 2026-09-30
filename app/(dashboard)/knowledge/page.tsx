"use client";

import { useState, useEffect } from "react";
import { api, PROMPTS_BASE, BASE } from "@/lib/api";
import {
  Save,
  RefreshCw,
  BookOpen,
  Sparkles,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  ChevronDown,
  Undo
} from "lucide-react";
import { cn } from "@/lib/utils";

const FILE_METADATA: Record<string, { title: string; description: string; placeholder: string; iconColor: string; details: string }> = {
  "main_agent_prompt.txt": {
    title: "Receptionist AI Agent Prompt",
    description: "Core persona, behavior instructions, and response rules for the hotel booking receptionist.",
    placeholder: "Describe the persona and behavior of the AI receptionist...",
    iconColor: "text-blue-600 bg-blue-50 border border-blue-100",
    details: "Configures how the virtual receptionist greets callers, handles reservations, checks availability, quotes room rates, and escalates calls."
  },
  "knowledge.txt": {
    title: "WhatsApp AI FAQs & Knowledge Base",
    description: "Source of truth used by the WhatsApp AI Assistant to answer guest inquiries and FAQs.",
    placeholder: "Add property details, policies, room types, and FAQs...",
    iconColor: "text-teal-600 bg-teal-50 border border-teal-100",
    details: "Contains the property directory, check-in/out rules, pricing context, and FAQs used by the automated WhatsApp responder."
  },
  "analysis_extraction_prompt.txt": {
    title: "Analysis AI: Data Extraction Prompt",
    description: "Rules and context for extracting key booking signals from the transcript.",
    placeholder: "Define instructions for factual signal extraction...",
    iconColor: "text-purple-600 bg-purple-50 border border-purple-100",
    details: "Controls how the data extraction agent parses call transcripts to identify rooms, dates, booking intent, price sensitivity, and situational lock-in facts."
  },
  "analysis_scoring_prompt.txt": {
    title: "Analysis AI: Lead Scoring Prompt",
    description: "Rubric and rules for scoring leads out of 100 based on extracted signals.",
    placeholder: "Define lead scoring rubric and rules...",
    iconColor: "text-indigo-600 bg-indigo-50 border border-indigo-100",
    details: "Sets specific points for situational lock-in, revenue potential, booking intent, and price sensitivity to compute a structured score."
  },
  "analysis_decision_prompt.txt": {
    title: "Analysis AI: Decision & Action Prompt",
    description: "Rules for assigning follow-up tiers, discounts, suggested actions, and auditing agent performance.",
    placeholder: "Define general manager logic and audit rules...",
    iconColor: "text-pink-600 bg-pink-50 border border-pink-100",
    details: "Determines followup actions, discount parameters, and audits front desk agent performance with detailed feedback."
  },
  "coaching_report_prompt.txt": {
    title: "AI Coach: Individual Report Prompt",
    description: "Rules for generating the structured coaching scorecard for an individual agent after a call.",
    placeholder: "Define individual agent coaching rubric...",
    iconColor: "text-amber-600 bg-amber-50 border border-amber-100",
    details: "Determines how the AI Coach rates the front desk agent across 8 competencies, identifies missed opportunities, and generates sentiment arcs."
  },
  "weekly_brief_prompt.txt": {
    title: "AI Coach: Weekly Team Brief Prompt",
    description: "Rules for aggregating team performance and generating the 5-point weekly coaching brief.",
    placeholder: "Define team weekly summary rules...",
    iconColor: "text-orange-600 bg-orange-50 border border-orange-100",
    details: "Configures the tone and format of the weekly summary brief to highlight team strengths, missed goals, and actionable patterns."
  },
  "aggregate_intelligence_prompt.txt": {
    title: "AI Coach: Aggregate Intelligence Prompt",
    description: "Rules for generating deep insights across all calls for the manager dashboard.",
    placeholder: "Define aggregate intelligence rules...",
    iconColor: "text-rose-600 bg-rose-50 border border-rose-100",
    details: "Drives the executive manager dashboard by identifying staff habits, regression alerts, peak performance times, and specific topic patterns."
  }
};

export default function KnowledgePage() {
  const [files, setFiles] = useState<string[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});

  const [loadingList, setLoadingList] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const [savingFiles, setSavingFiles] = useState<Record<string, boolean>>({});
  const [lastSavedTimes, setLastSavedTimes] = useState<Record<string, string>>({});

  const [openFile, setOpenFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Creation Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [creatingFile, setCreatingFile] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);



  const fetchFiles = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.knowledge.listFiles();
      if (res.status === "success") {
        setFiles(res.files);

        // Reload the currently open file (or expand the first file if none is open)
        const activeFile = openFile || (res.files.length > 0 ? res.files[0] : null);
        if (activeFile && res.files.includes(activeFile)) {
          setOpenFile(activeFile);
          setLoadingFiles(prev => ({ ...prev, [activeFile]: true }));
          try {
            const fileRes = await api.knowledge.getFile(activeFile);
            if (fileRes.status === "success") {
              setFileContents(prev => ({ ...prev, [activeFile]: fileRes.content }));
              setOriginalContents(prev => ({ ...prev, [activeFile]: fileRes.content }));
              setLastSavedTimes(prev => ({ ...prev, [activeFile]: "Refreshed just now" }));
            } else {
              setFileContents(prev => ({ ...prev, [activeFile]: "Unable to fetch from server or not found." }));
            }
          } catch (err) {
            console.error(`Failed to reload file ${activeFile}:`, err);
            setFileContents(prev => ({ ...prev, [activeFile]: "Unable to fetch from server or not found." }));
          } finally {
            setLoadingFiles(prev => ({ ...prev, [activeFile]: false }));
          }
        }
      } else {
        setError("Failed to load knowledge base files.");
      }
    } catch (err) {
      setError("Failed to load knowledge base files.");
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleToggleFile = async (filename: string) => {
    if (openFile === filename) {
      setOpenFile(null);
      return;
    }
    setOpenFile(filename);

    // Fetch content if it hasn't been loaded in state yet
    if (fileContents[filename] === undefined) {
      setLoadingFiles(prev => ({ ...prev, [filename]: true }));
      try {
        const res = await api.knowledge.getFile(filename);
        if (res.status === "success") {
          setFileContents(prev => ({ ...prev, [filename]: res.content }));
          setOriginalContents(prev => ({ ...prev, [filename]: res.content }));
          setLastSavedTimes(prev => ({ ...prev, [filename]: "Just loaded" }));
        } else {
          setFileContents(prev => ({ ...prev, [filename]: "Unable to fetch from server or not found." }));
        }
      } catch (err) {
        console.error(`Failed to load file ${filename}:`, err);
        setFileContents(prev => ({ ...prev, [filename]: "Unable to fetch from server or not found." }));
      } finally {
        setLoadingFiles(prev => ({ ...prev, [filename]: false }));
      }
    }
  };

  const handleSaveFile = async (filename: string) => {
    const content = fileContents[filename] || "";
    setSavingFiles(prev => ({ ...prev, [filename]: true }));
    try {
      const res = await api.knowledge.updateFile(filename, content);
      if (res.status === "success") {
        setOriginalContents(prev => ({ ...prev, [filename]: content }));
        const now = new Date();
        setLastSavedTimes(prev => ({
          ...prev,
          [filename]: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }));
      } else {
        alert(`Failed to save ${filename}`);
      }
    } catch (err) {
      console.error("Failed to save file:", err);
      alert(`Failed to save ${filename}`);
    } finally {
      setSavingFiles(prev => ({ ...prev, [filename]: false }));
    }
  };

  const handleDiscardChanges = (filename: string) => {
    if (window.confirm(`Discard unsaved changes to ${filename}?`)) {
      setFileContents(prev => ({ ...prev, [filename]: originalContents[filename] || "" }));
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let cleanName = newFileName.trim();
    if (!cleanName.endsWith(".txt")) {
      cleanName += ".txt";
    }

    // Basic file safety validation
    if (cleanName.includes("/") || cleanName.includes("\\") || cleanName.includes("..")) {
      setCreateError("Invalid file name. Slashes or path traversal not allowed.");
      return;
    }

    setCreatingFile(true);
    setCreateError(null);
    try {
      const defaultHeader = cleanName.replace(".txt", "").toUpperCase();
      const initialContent = `[${defaultHeader}]\nInitialize your details here.`;

      const res = await api.knowledge.updateFile(cleanName, initialContent);
      if (res.status === "success") {
        setNewFileName("");
        setIsCreating(false);

        // Re-fetch listing
        const listRes = await api.knowledge.listFiles();
        if (listRes.status === "success") {
          setFiles(listRes.files);
          // Set text in state so it expands immediately without loading spinners
          setFileContents(prev => ({ ...prev, [cleanName]: initialContent }));
          setOriginalContents(prev => ({ ...prev, [cleanName]: initialContent }));
          setLastSavedTimes(prev => ({ ...prev, [cleanName]: "Created just now" }));
          setOpenFile(cleanName);
        }
      } else {
        setCreateError(res.message || "Failed to create file.");
      }
    } catch (err) {
      setCreateError("Failed to create file.");
      console.error(err);
    } finally {
      setCreatingFile(false);
    }
  };

  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>KNOWLEDGE BASE</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Configure and optimize your AI agent's core system prompts and templates in real-time</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={fetchFiles}
            disabled={loadingList}
            className="kecie-btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", fontSize: 13, height: "36px" }}
          >
            <RefreshCw className={cn("w-4 h-4", loadingList && "animate-spin")} />
            Refresh Files
          </button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
            MP
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ padding: "20px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#ef4444", borderRadius: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Main Split Grid Layout */}
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "24px", alignItems: "flex-start", width: "100%" }}>
          {/* Left Column: The Accordion Workspace */}
          <div style={{ flex: "2 1 600px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Loading Listing State */}
            {loadingList && files.length === 0 ? (
              <div style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", borderRadius: "12px", padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
                <span style={{ fontSize: "14px", color: "#94a3b8" }}>Loading system prompts...</span>
              </div>
            ) : files.length === 0 ? (
              <div style={{ border: "1px dashed #cbd5e1", backgroundColor: "#ffffff", borderRadius: "12px", padding: "48px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                <FileText className="w-10 h-10 text-gray-300" />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>No prompts found</span>
                <p style={{ fontSize: "12px", color: "#94a3b8", maxWidth: "240px", margin: "0 auto", lineHeight: "1.5" }}>
                  Ensure system prompt text files exist in the target directory.
                </p>
              </div>
            ) : (
              // Cards List
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {files.map((filename) => {
                  const isExpanded = openFile === filename;
                  const content = fileContents[filename] || "";
                  const original = originalContents[filename] || "";
                  const isDirty = content !== original;
                  const isLoading = loadingFiles[filename] || false;
                  const isSaving = savingFiles[filename] || false;
                  const lastSaved = lastSavedTimes[filename] || "Recently";

                  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
                  const charCount = content ? content.length : 0;

                  const meta = FILE_METADATA[filename] || {
                    title: filename.replace(".txt", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                    description: "Custom system module rules text document.",
                    placeholder: "Type in your document contents here...",
                    iconColor: "text-gray-500 bg-gray-50 border border-gray-100"
                  };

                  return (
                    <div
                      key={filename}
                      className="kecie-card animate-fade-in-up"
                      style={{
                        background: "#fff",
                        overflow: "hidden"
                      }}
                    >
                      {/* Card Header Accordion Trigger */}
                      <div
                        onClick={() => handleToggleFile(filename)}
                        style={{
                          padding: "18px 24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "background-color 0.15s ease-in-out",
                          backgroundColor: isExpanded ? "#f8fafc" : "#ffffff",
                          borderBottom: isExpanded ? "1px solid #e2e8f0" : "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                          <div className={cn("p-2.5 rounded-xl transition-all duration-200", meta.iconColor)} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", lineHeight: "1.2" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.title}</span>
                              <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", padding: "1px 5px", borderRadius: "4px", userSelect: "all", fontWeight: "normal" }}>
                                ({filename})
                              </span>
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {meta.description}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "12px", flexShrink: 0 }}>
                          {/* Status indicators */}
                          {isLoading ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe" }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Loading...
                            </span>
                          ) : isDirty ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fef3c7" }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Unsaved Changes
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: "#ecfdf5", color: "#059669", border: "1px solid #d1fae5" }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Synced
                            </span>
                          )}

                          <ChevronDown 
                            size={16} 
                            style={{ 
                              color: "#94a3b8", 
                              transition: "transform 0.2s ease",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                            }} 
                          />
                        </div>
                      </div>

                      {/* Card Expanded Content */}
                      {isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
                          {isLoading ? (
                            <div style={{ padding: "80px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                              <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
                              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>Fetching file workspace...</span>
                            </div>
                          ) : (
                            <div style={{ animation: "fadeIn 0.2s ease both" }}>
                              {/* Editor Workspace */}
                              <textarea
                                value={content}
                                onChange={(e) => setFileContents(prev => ({ ...prev, [filename]: e.target.value }))}
                                disabled={isSaving}
                                style={{
                                  width: "100%",
                                  padding: "20px",
                                  fontSize: "12px",
                                  color: "#334155",
                                  backgroundColor: "#ffffff",
                                  resize: "vertical",
                                  outline: "none",
                                  fontFamily: "monospace",
                                  lineHeight: "1.6",
                                  minHeight: "350px",
                                  border: "none",
                                  borderTop: "1px solid #e2e8f0",
                                  borderBottom: "1px solid #e2e8f0",
                                  transition: "all 0.15s ease-in-out"
                                }}
                                placeholder={meta.placeholder}
                                spellCheck={false}
                              />

                              {/* Editor Workspace Footer */}
                              <div style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", fontSize: "12px", color: "#64748b", fontWeight: 500, userSelect: "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                  <span>
                                    Words: <span style={{ color: "#1e293b", fontWeight: 600 }}>{wordCount}</span>
                                  </span>
                                  <span>
                                    Characters: <span style={{ color: "#1e293b", fontWeight: 600 }}>{charCount}</span>
                                  </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8" }}>
                                    <Clock size={14} />
                                    <span>{lastSaved}</span>
                                  </div>

                                  <div style={{ display: "flex", gap: "8px" }}>
                                    {isDirty && (
                                      <button
                                        onClick={() => handleDiscardChanges(filename)}
                                        disabled={isSaving}
                                        className="kecie-btn-secondary"
                                        style={{
                                          padding: "6px 12px",
                                          fontSize: "12px",
                                          height: "30px",
                                          opacity: isSaving ? 0.6 : 1
                                        }}
                                        title="Undo edits"
                                      >
                                        <Undo className="w-3.5 h-3.5" />
                                        Discard
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSaveFile(filename)}
                                      disabled={!isDirty || isSaving}
                                      className="kecie-btn-primary"
                                      style={{
                                        padding: "6px 14px",
                                        fontSize: "12px",
                                        height: "30px",
                                        backgroundColor: !isDirty ? "#cbd5e1" : "#1e40af",
                                        cursor: (!isDirty || isSaving) ? "not-allowed" : "pointer"
                                      }}
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      {isSaving ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: AI Prompt Helper & Guidelines */}
          <div style={{ flex: "1 1 300px", minWidth: "280px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Main Info Card */}
            <div className="kecie-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", backgroundColor: "#eff6ff", borderRadius: "8px", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} />
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>AI Context Engine</h3>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.6" }}>
                Modify the core system prompts in real-time to adjust how the AI Sales Agent communicates, translates, extracts metadata, and dispatches messages.
              </p>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Modules Guide</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {Object.entries(FILE_METADATA).map(([key, meta]) => (
                    <div key={key} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#3b82f6", fontWeight: "bold", fontSize: "12px", marginTop: "2px" }}>→</span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>{meta.title}</span>
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", lineHeight: "1.4" }}>{meta.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#fafafa", margin: "16px -24px -24px -24px", padding: "16px 24px", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, color: "#f59e0b", marginTop: "1px" }} />
                  <span style={{ lineHeight: "1.5" }}>
                    Always ensure variables such as check-in times, room rates, and phone numbers conform to the structural format required by your pipeline.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
