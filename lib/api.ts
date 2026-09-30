export const BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const tenant = getCookie("tenant") || "kolam";
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    // Forward the HttpOnly auth_token JWT cookie on every request
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenant,
      ...options?.headers
    },
  });
  // 401 means session expired or never logged in â€” send to login page
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Stats {
  total_calls: number;
  booking_inquiries: number;
  general_inquiries: number;
  ai_conversion_rate: number;
  revenue_generated: number;
  active_followup_pipeline: number;
  escalated_count: number;
  recurring_callers: number;
}

export interface Lead {
  s_no: number;
  name: string | null;
  phone: string;
  rooms: number | null;
  dates: string | null;
  followup_summary: string | null;
  confirmation_status: string;
  inquiry_type: string;
  followup_stage: string;
  is_escalated: number;
  revenue_value: number;
  call_date: string | null;
  created_at_iso?: string | null;
  custom_followup_message?: string | null;
  call_transcript?: string | null;
}

export interface TrendPoint {
  date: string;
  booking: number;
  general: number;
}

export interface FunnelData {
  total_calls: number;
  booking_inquiries: number;
  initiated_followups: number;
  confirmed_bookings: number;
}

export interface AppSettings {
  escalation_number: string;
  followup_interval_hours: number;
  sync_status: string;
  booking_images?: string[];
  followup_tiers?: string[];
  picky_assist_enabled?: boolean;
  picky_assist_token?: string;
  picky_assist_application?: number;
  picky_assist_template_id?: string;
  picky_assist_media_url?: string;
  picky_assist_language?: string;
}

export const api = {
  stats: () => req<{ status: string; stats: Stats }>("/api/stats"),
  data: (filter = "all") =>
    req<{ status: string; data: Lead[]; count: number }>(`/api/data?filter=${filter}`),
  trend: () => req<{ status: string; data: TrendPoint[] }>("/api/trend"),
  funnel: () => req<{ status: string; funnel: FunnelData }>("/api/funnel"),
  feed: () => req<{ status: string; calls: Lead[] }>("/api/feed"),
  settings: {
    get: () => req<{ status: string; settings: AppSettings }>("/api/settings"),
    update: (body: Partial<AppSettings>) =>
      req("/api/settings", { method: "PATCH", body: JSON.stringify(body) }),
    listImages: () => req<{ status: string; images: string[]; folders?: string[] }>("/api/settings/images"),
    deleteImage: (filename: string) =>
      req(`/api/settings/images/${encodeURIComponent(filename)}`, { method: "DELETE" }),
    createFolder: (foldername: string) =>
      req("/api/settings/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: foldername }),
      }),
    deleteFolder: (foldername: string) =>
      req(`/api/settings/folders/${encodeURIComponent(foldername)}`, { method: "DELETE" }),
  },
  calls: {
    book: (id: number) => req(`/api/calls/${id}/book`, { method: "PATCH" }),
    trigger: (id: number) => req(`/api/calls/${id}/trigger`, { method: "POST" }),
    updateCustomMessage: (id: number, message: string) =>
      req(`/api/calls/${id}/custom_message`, {
        method: "PATCH",
        body: JSON.stringify({ custom_followup_message: message }),
      }),
  },
  knowledge: {
    get: () => req<{ status: string; content: string }>("/api/knowledge"),
    update: (content: string) =>
      req<{ status: string; message: string }>("/api/knowledge", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    listFiles: async () => {
      try {
        const res = await promptsReq<any>("/api/knowledge/files");
        if (Array.isArray(res)) {
          return { status: "success", files: res };
        }
        if (res && typeof res === "object") {
          const files = res.files || res.prompts || res.data || [];
          return { status: "success", files };
        }
        return { status: "success", files: [] };
      } catch (err) {
        console.error("Error in listFiles:", err);
        return { status: "error", message: String(err), files: [] };
      }
    },
    getFile: async (filename: string) => {
      try {
        const res = await promptsReq<any>(`/api/knowledge/files/${filename}`);
        if (typeof res === "string") {
          return { status: "success", filename, content: res };
        }
        if (res && typeof res === "object") {
          const content = res.content !== undefined ? res.content : (res.prompt || res.text || JSON.stringify(res));
          return { status: "success", filename, content };
        }
        return { status: "success", filename, content: "" };
      } catch (err) {
        console.error("Error in getFile:", err);
        return { status: "error", message: String(err), filename, content: "" };
      }
    },
    updateFile: async (filename: string, content: string) => {
      try {
        await promptsReq<any>(`/api/knowledge/files/${filename}`, {
          method: "POST",
          body: JSON.stringify({ content, prompt: content, text: content }),
        });
        return { status: "success", message: "File updated successfully" };
      } catch (err) {
        console.error("Error in updateFile:", err);
        return { status: "error", message: String(err) };
      }
    },
  },
  followupImage: {
    update: async (filename: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      // credentials:include required â€” this raw fetch() bypasses req() so must be patched separately
      const res = await fetch(`${BASE}/api/knowledge/files/images/${filename}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error(`Followup image upload failed: ${res.status}`);
      return await res.json();
    }
  },
  transcription: {
    /**
     * Upload an audio file for a lead and get back the Azure STT + o3-mini transcript.
     * @param sNo  - Lead s_no (primary key)
     * @param file - Audio File object (m4a, mp3, wav, ogg, â€¦)
     */
    uploadAudio: async (
      sNo: number,
      file: File
    ): Promise<{
      status: string;
      message?: string;
      transcript?: string;
      raw_text?: string;
      detected_language?: string;
      segments?: { start: number; end: number; text: string; language: string }[];
    }> => {
      const tenant = getCookie("tenant") || "kolam";
      const formData = new FormData();
      formData.append("file", file);
      // credentials:include required â€” this raw fetch() bypasses req() so must be patched separately
      const res = await fetch(`${BASE}/api/leads/${sNo}/upload-audio`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Tenant-Id": tenant },
        body: formData,
      });
      if (!res.ok) throw new Error(`Audio upload failed: ${res.status}`);
      return res.json();
    },
  },
  followups: {
    list: () => req<{
      status: string;
      sent: any[];
      missing_number: any[];
      pending: any[];
    }>("/api/followups"),
    updatePhone: (id: number, phone: string) =>
      req<{ status: string; message: string }>(`/api/followups/${id}/phone`, {
        method: "PUT",
        body: JSON.stringify({ phone }),
      }),
    sendAllFailed: () =>
      req<{ status: string; sent_count: number; failed_count: number; message?: string }>(
        "/api/followups/send_all_failed",
        { method: "POST" }
      ),
  },
};

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

let promptsBase = process.env.NEXT_PUBLIC_PROMPTS_API_URL || (isLocal ? "http://127.0.0.1:9018" : BASE);
if (typeof window !== "undefined" && window.location.protocol === "https:" && promptsBase.startsWith("http://")) {
  promptsBase = promptsBase.replace("http://", "https://");
}
export const PROMPTS_BASE = promptsBase;
async function promptsReq<T>(path: string, options?: RequestInit): Promise<T> {
  // We no longer use a separate remote Prompts API. The FastAPI backend now handles all Knowledge Base files natively.
  // Convert remote path /api/prompts/... to local backend path /api/knowledge/files/...
  let fallbackPath = path.replace(/^\/api\/prompts/, "/api/knowledge/files");
  if (fallbackPath === "/api/knowledge/files/") {
    fallbackPath = "/api/knowledge/files";
  }
  return req<T>(fallbackPath, options);
}


