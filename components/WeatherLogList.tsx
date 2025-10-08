"use client";

import { useState } from 'react';
import { JsonValue } from '@prisma/client/runtime/library';
import VideoHighlights from './VideoHighlights'; // Import the new component

// Define the type for a single WeatherLog object
export interface WeatherLog {
  id: string;
  createdAt: string;
  location: string;
  startDate: string;
  endDate: string;
  latitude: number;
  longitude: number;
  weatherData: JsonValue;
}

interface WeatherLogListProps {
  logs: WeatherLog[];
  onDelete: (id: string) => void;
}

export default function WeatherLogList({ logs, onDelete }: WeatherLogListProps) {
  // New state to track which log's videos are open
  const [activeVideoLogId, setActiveVideoLogId] = useState<string | null>(null);

  const toggleVideos = (logId: string) => {
    setActiveVideoLogId(currentId => (currentId === logId ? null : logId));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">No logs saved yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-300">Saved Logs</h2>
        <div className="flex gap-2">
            <a href="/api/export?format=json" download="weather_logs.json" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition">Export JSON</a>
            <a href="/api/export?format=csv" download="weather_logs.csv" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition">Export CSV</a>
        </div>
      </div>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-gray-700/60 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xl font-bold">{log.location}</p>
                <p className="text-sm text-gray-400">
                  {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                </p>
                {/* MODIFIED: Link container */}
                <div className="mt-2 flex gap-4 text-blue-400 text-xs">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    View on Map
                  </a>
                  {/* NEW: Show Videos button */}
                  <button onClick={() => toggleVideos(log.id)} className="hover:underline">
                    {activeVideoLogId === log.id ? 'Hide Videos' : 'Show Videos'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <button disabled className="text-sm bg-yellow-600/50 text-white/50 px-3 py-1 rounded-md cursor-not-allowed">Edit</button>
                <button onClick={() => onDelete(log.id)} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition">Delete</button>
              </div>
            </div>
            {/* NEW: Conditionally render VideoHighlights component */}
            {activeVideoLogId === log.id && <VideoHighlights location={log.location} />}
          </div>
        ))}
      </div>
    </div>
  );
}