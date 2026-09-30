"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { api, BASE } from "@/lib/api";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Phone,
  Clock,
  ShieldAlert,
  ImageIcon,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  UploadCloud,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

function SettingCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="kecie-card animate-fade-in-up" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, marginBottom: 0 }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="kecie-btn-primary"
      style={{
        fontSize: "12px",
        height: "36px",
        padding: "0 16px",
        cursor: loading ? "not-allowed" : "pointer"
      }}
    >
      {loading ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function SettingsPage() {
  const storeSettings = useStore((s: any) => s.settings);
  const setSettings = useStore((s: any) => s.setSettings);

  const [escNumber, setEscNumber] = useState("");
  const [followupHours, setFollowupHours] = useState(2);
  const [syncStatus, setSyncStatus] = useState("active");
  const [bookingImages, setBookingImages] = useState<string[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [activeUploadFolder, setActiveUploadFolder] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pickyToken, setPickyToken] = useState("");
  const [pickyApp, setPickyApp] = useState(121);
  const [pickyTemplate, setPickyTemplate] = useState("");
  const [pickyMedia, setPickyMedia] = useState("");
  const [pickyLang, setPickyLang] = useState("en_US");

  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsLimit] = useState(5);
  const [contactsSearch, setContactsSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch(
        `${BASE}/api/contacts?page=${contactsPage}&limit=${contactsLimit}&search=${encodeURIComponent(
          contactsSearch
        )}`, { credentials: "include" }
      );
      const data = await res.json();
      if (data.status === "success") {
        setContacts(data.contacts || []);
        setContactsTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [contactsPage, contactsSearch]);

  const fetchImages = async () => {
    try {
      const res = await (api.settings as any).listImages();
      if (res.status === "success") {
        setAvailableImages(res.images || []);
        setFolders(res.folders || []);
      }
    } catch (e) {
      console.error("Failed to list settings images:", e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.followupImage.update(file.name, file);
      await fetchImages();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
    setUploading(false);
  };

  const handleDeleteImage = async (img: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${img}"?`)) return;
    try {
      const res = await (api.settings as any).deleteImage(img);
      if (res.status === "success") {
        setAvailableImages((prev) => prev.filter((i) => i !== img));
        setBookingImages((prev) => prev.filter((i) => i !== img));
        if (storeSettings) {
          const updatedImgs = (storeSettings.booking_images || []).filter((i: string) => i !== img);
          setSettings({
            ...storeSettings,
            booking_images: updatedImgs,
          });
        }
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await (api.settings as any).createFolder(newFolderName.trim());
      if (res.status === "success") {
        setNewFolderName("");
        setIsCreatingFolder(false);
        await fetchImages();
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleDeleteFolder = async (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete folder "${folder}" and ALL photos inside it?`)) return;
    try {
      const res = await (api.settings as any).deleteFolder(folder);
      if (res.status === "success") {
        await fetchImages();
        // Clean deleted folder's images from selected booking_images
        setBookingImages((prev) => prev.filter((i) => !i.startsWith(`${folder}/`)));
        if (storeSettings) {
          const updatedImgs = (storeSettings.booking_images || []).filter((i: string) => !i.startsWith(`${folder}/`));
          setSettings({
            ...storeSettings,
            booking_images: updatedImgs,
          });
        }
      }
    } catch (err) {
      console.error("Failed to delete folder:", err);
    }
  };

  const triggerFolderUpload = (folder: string) => {
    setActiveUploadFolder(folder);
    document.getElementById("hidden-image-uploader")?.click();
  };

  const handleUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const targetName = activeUploadFolder ? `${activeUploadFolder}/${file.name}` : file.name;
      await api.followupImage.update(targetName, file);
      await fetchImages();
    } catch (err) {
      console.error("Upload failed:", err);
    }
    setUploading(false);
    setActiveUploadFolder(null);
    e.target.value = "";
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.webkitRelativePath || file.name;
        if (!relativePath.match(/\.(png|jpg|jpeg|webp|gif)$/i)) continue;
        await api.followupImage.update(relativePath, file);
      }
      await fetchImages();
    } catch (err) {
      console.error("Folder upload failed:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (storeSettings) {
      setEscNumber(storeSettings.escalation_number);
      setFollowupHours(storeSettings.followup_interval_hours);
      setSyncStatus(storeSettings.sync_status);
      setBookingImages(storeSettings.booking_images || []);
      setPickyToken(storeSettings.picky_assist_token || "");
      setPickyApp(storeSettings.picky_assist_application || 121);
      setPickyTemplate(storeSettings.picky_assist_template_id || "");
      setPickyMedia(storeSettings.picky_assist_media_url || "");
      setPickyLang(storeSettings.picky_assist_language || "en_US");
    }
  }, [storeSettings]);

  const save = async (key: string, payload: Record<string, unknown>) => {
    setSaving(key);
    const res = await api.settings.update(payload as Parameters<typeof api.settings.update>[0]);
    const r = res as { settings?: typeof storeSettings };
    if (r?.settings) setSettings(r.settings!);
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const HOURS = [1, 2, 3, 4, 6, 12, 24];
  return (
    <div className="page-content" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>SYSTEM SETTINGS</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Configure agent behaviour, routing, and automation parameters</p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
          MP
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ padding: "20px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
        {/* Sync Status */}
        <SettingCard
          title="Inventory & Rate Sync"
          description="Monitor the real-time connection to your Property Management System (PMS)."
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {syncStatus === "active" ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                  {syncStatus === "active"
                    ? "System is actively syncing"
                    : "Sync error detected"}
                </p>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                  {syncStatus === "active"
                    ? "Room rates & availability in sync."
                    : "Check your PMS connection."}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={syncStatus}
                onChange={(e) => setSyncStatus(e.target.value)}
                className="kecie-select"
                style={{ height: "36px", padding: "0 28px 0 12px" }}
              >
                <option value="active">Active</option>
                <option value="error">Error</option>
              </select>
              <SaveButton
                onClick={() => save("sync", { sync_status: syncStatus })}
                loading={saving === "sync"}
              />
            </div>
          </div>
          {saved === "sync" && (
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "12px", fontWeight: 600 }}>✓ Saved successfully</p>
          )}
        </SettingCard>

        {/* Escalation Number */}
        <SettingCard
          title="Human Escalation Routing"
          description="Define where frustrated or high-priority callers are transferred."
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 300px", maxWidth: "450px" }}>
              <Phone style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#94a3b8" }} />
              <input
                type="text"
                value={escNumber}
                onChange={(e) => setEscNumber(e.target.value)}
                placeholder="+91-9876543210"
                className="kecie-input"
                style={{
                  width: "100%",
                  paddingLeft: "36px",
                  height: "36px"
                }}
              />
            </div>
            <SaveButton
              onClick={() =>
                save("esc", { escalation_number: escNumber })
              }
              loading={saving === "esc"}
            />
          </div>
          {saved === "esc" && (
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "12px", fontWeight: 600 }}>✓ Saved successfully</p>
          )}
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
            Please include the country code (e.g. +91)
          </p>
        </SettingCard>

        {/* Follow-up Cadence */}
        <SettingCard
          title="Automated Follow-up Cadence"
          description="Control the delay before WhatsApp/SMS nudges are triggered post-call."
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {HOURS.map((h) => (
              <button
                key={h}
                onClick={() => setFollowupHours(h)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  backgroundColor: followupHours === h ? "#0f172a" : "#ffffff",
                  color: followupHours === h ? "#ffffff" : "#475569",
                  border: followupHours === h ? "1px solid #0f172a" : "1px solid #e2e8f0"
                }}
              >
                {h}h
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "#eff6ff", border: "1px solid #dbeafe", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
            <Clock className="w-4 h-4 text-blue-500 shrink-0" style={{ marginTop: "2px" }} />
            <p style={{ fontSize: "12px", color: "#1e40af", margin: 0, lineHeight: "1.5" }}>
              Callers who don't book will receive a personalised WhatsApp message{" "}
              <span style={{ fontWeight: 700 }}>{followupHours} hours</span> after the call ends.
            </p>
          </div>
          <SaveButton
            onClick={() =>
              save("cadence", { followup_interval_hours: followupHours })
            }
            loading={saving === "cadence"}
          />
          {saved === "cadence" && (
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "12px", fontWeight: 600 }}>✓ Saved successfully</p>
          )}
        </SettingCard>

        {/* Booking Confirmation Images */}
        <SettingCard
          title="Booking Confirmation Images"
          description={`Manage property room photos by creating folders or uploading folders (${typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "e.g. oasis-grand, oasis-palm" : "e.g. kolam-gandhi, kolam-ridhi"}). Senders will receive photos matching their enquired property folder.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Hidden inputs for folder-specific upload & whole folder upload */}
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadToFolder}
              disabled={uploading}
              style={{ display: "none" }}
              id="hidden-image-uploader"
            />
            <input
              type="file"
              {...({
                webkitdirectory: "",
                directory: "",
                multiple: true
              } as any)}
              onChange={handleFolderUpload}
              disabled={uploading}
              style={{ display: "none" }}
              id="hidden-folder-uploader"
            />

            {/* Folder Actions Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isCreatingFolder ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder={typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "Folder name (e.g., oasis-grand)" : "Folder name (e.g., kolam-gandhi)"}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="kecie-input"
                      style={{
                        height: "32px",
                        fontSize: "12px",
                        padding: "0 10px",
                        width: "200px"
                      }}
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="kecie-btn-primary"
                      style={{
                        padding: "0 12px",
                        height: "32px",
                        fontSize: "12px"
                      }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName("");
                      }}
                      className="kecie-btn-secondary"
                      style={{
                        padding: "0 12px",
                        height: "32px",
                        fontSize: "12px"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="kecie-btn-secondary"
                    style={{
                      padding: "0 12px",
                      height: "32px",
                      fontSize: "12px",
                      gap: "6px"
                    }}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Create Folder
                  </button>
                )}
              </div>

              <button
                onClick={() => document.getElementById("hidden-folder-uploader")?.click()}
                disabled={uploading}
                className="kecie-btn-secondary"
                style={{
                  padding: "0 12px",
                  height: "32px",
                  fontSize: "12px",
                  gap: "6px"
                }}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Folder
              </button>
            </div>

            {/* Folder and Images listing */}
            {(() => {
              const rootImages = availableImages.filter((img) => !img.includes("/"));
              const folderGroups: Record<string, string[]> = {};
              
              // Seed folders list
              folders.forEach((f) => {
                folderGroups[f] = [];
              });
              
              // Group images
              availableImages.forEach((img) => {
                if (img.includes("/")) {
                  const folderName = img.split("/")[0];
                  if (!folderGroups[folderName]) {
                    folderGroups[folderName] = [];
                  }
                  if (!folderGroups[folderName].includes(img)) {
                    folderGroups[folderName].push(img);
                  }
                }
              });

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {Object.keys(folderGroups).map((folderName) => {
                    const folderImages = folderGroups[folderName];
                    const isExpanded = openFolders.includes(folderName);
                    return (
                      <div
                        key={typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? folderName.replace(/kolam/gi, "Oasis").replace(/gandhi/gi, "grand").replace(/ridhi/gi, "palm").replace(/q-by-Oasis/gi, "Oasis-Boutique") : folderName}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          overflow: "hidden",
                          backgroundColor: "#ffffff"
                        }}
                      >
                        {/* Folder Header */}
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setOpenFolders(openFolders.filter((f) => f !== folderName));
                            } else {
                              setOpenFolders([...openFolders, folderName]);
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            backgroundColor: "#f8fafc",
                            cursor: "pointer",
                            userSelect: "none"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            {isExpanded ? (
                              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0 fill-amber-100" />
                            ) : (
                              <Folder className="w-4 h-4 text-amber-500 shrink-0 fill-amber-100" />
                            )}
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? folderName.replace(/kolam/gi, "Oasis").replace(/gandhi/gi, "grand").replace(/ridhi/gi, "palm").replace(/q-by-Oasis/gi, "Oasis-Boutique") : folderName}
                            </span>
                            <span style={{ fontSize: "10px", backgroundColor: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: "999px", fontWeight: 600 }}>
                              {folderImages.length} image(s)
                            </span>
                          </div>

                          {/* Folder actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => triggerFolderUpload(folderName)}
                              className="kecie-btn-secondary"
                              style={{
                                padding: "0 10px",
                                height: "28px",
                                fontSize: "11px",
                                gap: "4px"
                              }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Image
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteFolder(folderName, e)}
                              style={{
                                padding: "6px",
                                background: "none",
                                border: "none",
                                borderRadius: "6px",
                                color: "#94a3b8",
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                              className="hover:text-red-600 hover:bg-red-50"
                              title="Delete Folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Folder Images Grid */}
                        {isExpanded && (
                          <div style={{ padding: "16px", backgroundColor: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                            {folderImages.length === 0 ? (
                              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: "12px" }}>
                                No images in this folder yet. Click "Add Image" above to upload.
                              </div>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                                {folderImages.map((img) => {
                                  const checked = bookingImages.includes(img);
                                  const filenameOnly = img.split("/").pop() || img;
                                  return (
                                    <div
                                      key={img}
                                      style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderRadius: "10px",
                                        border: checked ? "1px solid #0f172a" : "1px solid #e2e8f0",
                                        padding: "8px 12px",
                                        backgroundColor: "#ffffff",
                                        transition: "all 0.15s ease",
                                        userSelect: "none"
                                      }}
                                      className="group"
                                    >
                                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1, minWidth: 0 }}>
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            if (checked) {
                                              setBookingImages(bookingImages.filter((i) => i !== img));
                                            } else {
                                              setBookingImages([...bookingImages, img]);
                                            }
                                          }}
                                          style={{ cursor: "pointer" }}
                                        />
                                        <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={img}>
                                          {filenameOnly}
                                        </span>
                                      </label>

                                      {/* Actions */}
                                      <div 
                                        style={{ 
                                          display: "flex", 
                                          alignItems: "center", 
                                          gap: "2px",
                                          marginLeft: "8px",
                                          flexShrink: 0
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setPreviewImage(img)}
                                          style={{
                                            background: "none",
                                            border: "none",
                                            padding: "4px",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            borderRadius: "4px"
                                          }}
                                          className="hover:text-gray-900 hover:bg-gray-100 animate-fade-in"
                                          title="Preview Image"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteImage(img, e)}
                                          style={{
                                            background: "none",
                                            border: "none",
                                            padding: "4px",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            borderRadius: "4px"
                                          }}
                                          className="hover:text-red-600 hover:bg-red-50"
                                          title="Delete Image"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* General / Uncategorized Images */}
                  {rootImages.length > 0 && (
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", backgroundColor: "#f8fafc" }}>
                      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        General / Uncategorized Photos
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginTop: "12px" }}>
                        {rootImages.map((img) => {
                          const checked = bookingImages.includes(img);
                          return (
                            <div
                              key={img}
                              style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderRadius: "10px",
                                border: checked ? "1px solid #0f172a" : "1px solid #e2e8f0",
                                padding: "8px 12px",
                                backgroundColor: "#ffffff",
                                transition: "all 0.15s ease",
                                userSelect: "none"
                              }}
                              className="group"
                            >
                              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1, minWidth: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    if (checked) {
                                      setBookingImages(bookingImages.filter((i) => i !== img));
                                    } else {
                                      setBookingImages([...bookingImages, img]);
                                    }
                                  }}
                                  style={{ cursor: "pointer" }}
                                />
                                <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={img}>
                                  {img}
                                </span>
                              </label>

                              {/* Action buttons revealed on hover */}
                              <div 
                                style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: "2px",
                                  marginLeft: "8px",
                                  flexShrink: 0
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(img)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: "4px",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    borderRadius: "4px"
                                  }}
                                  className="hover:text-gray-900 hover:bg-gray-100"
                                  title="Preview Image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteImage(img, e)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: "4px",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    borderRadius: "4px"
                                  }}
                                  className="hover:text-red-600 hover:bg-red-50"
                                  title="Delete Image"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableImages.length === 0 && folders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: "12px", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#fafafa" }}>
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No images or folders uploaded yet. Use the buttons above to get started.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Root Upload Area */}
            <div 
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              className="group"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 10
                }}
                id="image-uploader"
              />
              <div 
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  marginBottom: "10px",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.15s ease"
                }}
                className="group-hover:scale-105"
              >
                {uploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-gray-950" />
                )}
              </div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                {uploading ? "Uploading image..." : "Upload new uncategorized property photo"}
              </p>
              <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", margin: 0 }}>
                Drag and drop or click to select a file (PNG, JPG, WEBP)
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {bookingImages.length === 0
                  ? "No images selected (will fall back to default behavior)"
                  : `${bookingImages.length} image(s) selected`}
              </span>
              <SaveButton
                onClick={() => save("images", { booking_images: bookingImages })}
                loading={saving === "images"}
              />
            </div>
          </div>
          {saved === "images" && (
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "12px", fontWeight: 600 }}>✓ Saved successfully</p>
          )}
        </SettingCard>

        {/* Picky Assist Configuration */}
        <SettingCard
          title="Picky Assist API Integration"
          description="Configure your official Picky Assist WhatsApp API credentials, channel ID, and templates."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Picky Assist API Token</label>
              <input
                type="password"
                value={pickyToken}
                onChange={(e) => setPickyToken(e.target.value)}
                placeholder="Enter API Token..."
                className="kecie-input"
                style={{
                  width: "100%",
                  height: "36px"
                }}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Channel Application ID</label>
                <input
                  type="number"
                  value={pickyApp}
                  onChange={(e) => setPickyApp(Number(e.target.value))}
                  className="kecie-input"
                  style={{
                    width: "100%",
                    height: "36px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>WhatsApp Template ID</label>
                <input
                  type="text"
                  value={pickyTemplate}
                  onChange={(e) => setPickyTemplate(e.target.value)}
                  placeholder={typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "e.g. oasis_followup" : "e.g. kolam_followup"}
                  className="kecie-input"
                  style={{
                    width: "100%",
                    height: "36px"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Attached Media / Photo URL</label>
                <input
                  type="text"
                  value={pickyMedia}
                  onChange={(e) => setPickyMedia(e.target.value)}
                  placeholder="https://example.com/flyer.jpg"
                  className="kecie-input"
                  style={{
                    width: "100%",
                    height: "36px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Template Language</label>
                <input
                  type="text"
                  value={pickyLang}
                  onChange={(e) => setPickyLang(e.target.value)}
                  placeholder="e.g. en_US"
                  className="kecie-input"
                  style={{
                    width: "100%",
                    height: "36px"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "8px" }}>
              <SaveButton
                onClick={() =>
                  save("picky", {
                    picky_assist_token: pickyToken,
                    picky_assist_application: pickyApp,
                    picky_assist_template_id: pickyTemplate,
                    picky_assist_media_url: pickyMedia,
                    picky_assist_language: pickyLang,
                  })
                }
                loading={saving === "picky"}
              />
            </div>
          </div>
          {saved === "picky" && (
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "12px", fontWeight: 600 }}>✓ Saved successfully</p>
          )}
        </SettingCard>

        {/* Contacts CSV Upload */}
        {!(typeof document !== "undefined" && document.cookie.includes("tenant=demo")) && (
        <SettingCard
          title="Guest Contacts Database"
          description={`Upload your consolidated CSV guest contacts list (${typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "oasis_grand.csv" : "kolam_gandhi.csv"}) to resolve caller names.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div 
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              className="group"
            >
              <input
                type="file"
                accept=".csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch(`${BASE}/api/contacts/upload`, { credentials: "include",
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.status === "success") {
                      alert(data.message);
                      fetchContacts();
                    } else {
                      alert(`Upload failed: ${data.message}`);
                    }
                  } catch (err: any) {
                    console.error("CSV upload failed:", err);
                    alert(`Upload failed: ${err.message}`);
                  }
                  setUploading(false);
                }}
                disabled={uploading}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 10
                }}
              />
              <div 
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  marginBottom: "10px",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.15s ease"
                }}
                className="group-hover:scale-105"
              >
                {uploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-900" />
                ) : (
                  <svg className="w-4 h-4 text-gray-955" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", margin: 0 }}>
                {uploading ? "Uploading and parsing contacts..." : "Upload new consolidated contacts CSV"}
              </p>
              <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", margin: 0 }}>
                Select a file in Contact Name, Phone Number columns format (e.g. {typeof document !== "undefined" && document.cookie.includes("tenant=demo") ? "oasis_grand.csv" : "kolam_gandhi.csv"})
              </p>
            </div>

            {/* Contacts Table & Search Preview */}
            <div style={{ marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                  Database Preview ({contactsTotal} contacts)
                </span>
                
                <input
                  type="text"
                  value={contactsSearch}
                  onChange={(e) => {
                    setContactsSearch(e.target.value);
                    setContactsPage(1);
                  }}
                  placeholder="Search contacts..."
                  className="kecie-input"
                  style={{
                    height: "32px",
                    width: "100%",
                    maxWidth: "200px"
                  }}
                />
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", backgroundColor: "#ffffff", maxHeight: "250px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                  <thead style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <tr>
                      <th style={{ padding: "10px 16px", fontWeight: 700 }}>Contact Name</th>
                      <th style={{ padding: "10px 16px", fontWeight: 700 }}>Phone Number</th>
                    </tr>
                  </thead>
                  <tbody style={{ backgroundColor: "#ffffff" }}>
                    {loadingContacts ? (
                      <tr>
                        <td colSpan={2} style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8" }}>
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-gray-400" />
                          Loading...
                        </td>
                      </tr>
                    ) : contacts.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontWeight: 500 }}>
                          No contacts found.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c: any) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-gray-50/40">
                          <td style={{ padding: "8px 16px", color: "#0f172a", fontWeight: 600 }}>{c.full_name}</td>
                          <td style={{ padding: "8px 16px", color: "#64748b", fontFamily: "monospace" }}>{c.phone}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {contactsTotal > contactsLimit && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#64748b", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <span>
                    Showing {Math.min(contactsTotal, (contactsPage - 1) * contactsLimit + 1)} to{" "}
                    {Math.min(contactsTotal, contactsPage * contactsLimit)} of {contactsTotal}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => setContactsPage((p) => Math.max(1, p - 1))}
                      disabled={contactsPage === 1}
                      className="kecie-btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px", height: "26px" }}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setContactsPage((p) => Math.min(Math.ceil(contactsTotal / contactsLimit), p + 1))}
                      disabled={contactsPage >= Math.ceil(contactsTotal / contactsLimit)}
                      className="kecie-btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "11px", height: "26px" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingCard>
        )}

        {/* Agent Directives — read-only reference */}
        <SettingCard
          title="Agent AI Directives"
          description="Core behavioural guidelines embedded in the conversational agent."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                icon: RefreshCw,
                color: "text-blue-500",
                colorHex: "#3b82f6",
                name: "Intent Split",
                desc: "Booking + no reservation → lead pipeline. General → log resolved.",
              },
              {
                icon: Clock,
                color: "text-blue-500",
                colorHex: "#3b82f6",
                name: "Recovery Trigger",
                desc: `Check PMS ${followupHours}h post-call. No booking → personalised WhatsApp.`,
              },
              {
                icon: ShieldAlert,
                color: "text-red-500",
                colorHex: "#ef4444",
                name: "Human Hand-off",
                desc: "Frustrated caller → flash alert + push to Needs Attention tab.",
              },
            ].map(({ icon: Icon, colorHex, name, desc }) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "start",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  borderLeft: `3px solid ${colorHex}`,
                  backgroundColor: "#f8fafc"
                }}
              >
                <Icon size={16} style={{ color: colorHex, flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", margin: 0 }}>{name}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", margin: 0, lineHeight: "1.4" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SettingCard>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "8px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              transition: "background-color 0.15s"
            }}
            className="hover:bg-white/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "24px", height: "24px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div
            style={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "85vh",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              backgroundColor: "#0f172a"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${BASE}/api/knowledge/files/images/${previewImage}`}
              alt={previewImage}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "12px"
              }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.5), transparent)", padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff", margin: 0 }}>{previewImage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
