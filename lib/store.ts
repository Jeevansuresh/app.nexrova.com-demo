import { create } from "zustand";
import { Stats, Lead, TrendPoint, FunnelData, AppSettings } from "@/lib/api";
import { DatePreset } from "@/lib/dateUtils";

interface Store {
  stats: Stats | null;
  leads: Lead[];
  trend: TrendPoint[];
  funnel: FunnelData | null;
  settings: AppSettings | null;
  selectedLeadId: number | null;
  wsStatus: "connected" | "disconnected" | "connecting";
  datePreset: DatePreset;
  customStartDate: string | null;
  customEndDate: string | null;
  
  setStats: (s: Stats) => void;
  setLeads: (l: Lead[]) => void;
  setTrend: (t: TrendPoint[]) => void;
  setFunnel: (f: FunnelData) => void;
  setSettings: (s: AppSettings) => void;
  setSelectedLeadId: (id: number | null) => void;
  setWsStatus: (s: "connected" | "disconnected" | "connecting") => void;
  setDateFilter: (preset: DatePreset, start: string | null, end: string | null) => void;
}

export const useStore = create<Store>((set) => ({
  stats: null,
  leads: [],
  trend: [],
  funnel: null,
  settings: null,
  selectedLeadId: null,
  wsStatus: "disconnected",
  datePreset: "today",
  customStartDate: null,
  customEndDate: null,
  
  setStats: (stats) => set({ stats }),
  setLeads: (leads) => {
    const processedLeads = leads.map((l) => {
      if (l.created_at_iso) {
        try {
          const dateObj = new Date(l.created_at_iso);
          if (!isNaN(dateObj.getTime())) {
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            const dd = String(dateObj.getDate()).padStart(2, "0");
            l.call_date = `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {
          console.error("Failed to parse created_at_iso:", e);
        }
      }
      return l;
    });
    set({ leads: processedLeads });
  },
  setTrend: (trend) => set({ trend }),
  setFunnel: (funnel) => set({ funnel }),
  setSettings: (settings) => set({ settings }),
  setSelectedLeadId: (selectedLeadId) => set({ selectedLeadId }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setDateFilter: (datePreset, customStartDate, customEndDate) => set({ datePreset, customStartDate, customEndDate }),
}));
