"use client";

import { useState, useEffect } from "react";
import LogForm from "./LogForm";
import WeatherLogList, { type WeatherLog } from "./WeatherLogList";

export default function LogManager() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error("Failed to fetch logs.");
      const data: WeatherLog[] = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
      // Here you could set an error state to show in the UI
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteLog = async (id: string) => {
    // Optimistic UI update: remove the log from the list immediately
    setLogs(currentLogs => currentLogs.filter(log => log.id !== id));
    
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        // If the API call fails, revert the change by refetching
        throw new Error('Failed to delete log on the server.');
      }
    } catch (err) {
      console.error(err);
      fetchLogs(); // Refetch to get the correct state from the server
    }
  };

  return (
    <section id="logs" className="space-y-8">
      <LogForm onLogCreated={fetchLogs} />
      {isLoading ? (
        <p className="text-center text-gray-400">Loading saved logs...</p>
      ) : (
        <WeatherLogList logs={logs} onDelete={handleDeleteLog} />
      )}
    </section>
  );
}