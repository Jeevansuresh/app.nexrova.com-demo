
"use client";

import { useState } from "react";
import { BASE } from "@/lib/api";
import { RefreshCw } from "lucide-react";

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const triggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage("Connecting to server...");

    try {
      const apiUrl = BASE;
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      setSyncMessage("Sync triggered! Refreshing soon...");

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncMessage("Sync failed. Check connection.");
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={triggerSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 cursor-pointer
          ${
            isSyncing
              ? "bg-indigo-50 text-indigo-400 border-indigo-200 opacity-70 cursor-not-allowed"
              : "bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
          }`}
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync Now"}
      </button>
      {syncMessage && (
        <span className="text-xs text-slate-500 animate-pulse">
          {syncMessage}
        </span>
      )}
    </div>
  );
}
