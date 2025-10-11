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
    setLogs((prev) => prev.filter((log) => log.id !== id));
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete log on the server.");
    } catch (err) {
      console.error(err);
      fetchLogs();
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <section id="logs" className="space-y-10">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-purple-400 dark:to-pink-400 mb-3">
          📊 {saveLabel}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Create, manage, and export your personalized weather logs
        </p>
      </div>

      {/* Form */}
      <LogForm onLogCreated={fetchLogs} />

      {/* Logs */}
      {isLoading ? (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-indigo-500 dark:border-purple-500"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">
            Loading your weather logs...
          </p>
        </div>
      ) : (
        <WeatherLogList 
          logs={logs} 
          onDelete={handleDeleteLog} 
          onRefresh={fetchLogs}
        />
      )}
    </section>
  );
}