"use client";

import { useState, useEffect, useCallback } from "react";
import LogForm from "./LogForm";
import WeatherLogList, { type WeatherLog } from "./WeatherLogList";

interface LogManagerProps {
  saveLabel?: string;
}

export default function LogManager({ saveLabel = "Saved Weather Logs" }: LogManagerProps) {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Failed to fetch logs.");
      const data: WeatherLog[] = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteLog = async (id: string) => {
    // Optimistic UI update
    setLogs((prev) => prev.filter((log) => log.id !== id));
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log on the server.");
    } catch (err) {
      console.error(err);
      fetchLogs(); // Refetch to stay in sync
    }
  };

  const handleEditLog = (log: WeatherLog) => {
    console.log("Edit log clicked:", log);
    // Future: open modal or inline edit form
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <section id="logs" className="space-y-8">
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-600 dark:text-blue-400 drop-shadow-sm">
        {saveLabel}
      </h2>

      {/* Form */}
      <div className="bg-blue-50 dark:bg-gray-800/50 p-6 rounded-lg shadow-lg transition-colors">
        <LogForm onLogCreated={fetchLogs} />
      </div>

      {/* Logs */}
      {isLoading ? (
        <p className="text-center text-gray-600 dark:text-gray-300 italic">
          Loading saved weather logs...
        </p>
      ) : (
        <WeatherLogList logs={logs} onDelete={handleDeleteLog} onEdit={handleEditLog} />
      )}
    </section>
  );
}
