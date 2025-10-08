"use client";

import { useState } from 'react';
import { JsonValue } from '@prisma/client/runtime/library';
import VideoHighlights from './VideoHighlights';
import { FiMap, FiVideo, FiTrash2, FiEdit } from 'react-icons/fi';

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
  const [activeVideoLogId, setActiveVideoLogId] = useState<string | null>(null);

  const toggleVideos = (logId: string) => {
    setActiveVideoLogId(currentId => (currentId === logId ? null : logId));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">You have no saved logs.</p>
        <p className="text-sm text-gray-500 mt-1">Use the form above to save your first one!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold text-blue-300 mb-2 sm:mb-0">Saved Logs</h2>
        <div className="flex gap-2">
          <a href="/api/export?format=json" download="weather_logs.json" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition flex items-center gap-2">Export JSON</a>
          <a href="/api/export?format=csv" download="weather_logs.csv" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition flex items-center gap-2">Export CSV</a>
        </div>
      </div>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-gray-900/50 p-4 rounded-lg transition-shadow hover:shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <p className="text-xl font-bold">{log.location}</p>
                <p className="text-sm text-gray-400">
                  {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Saved on: {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
                <a href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-700 hover:bg-blue-600 rounded-md transition" title="View on Map"><FiMap /></a>
                <button onClick={() => toggleVideos(log.id)} className={`p-2 bg-gray-700 hover:bg-purple-600 rounded-md transition ${activeVideoLogId === log.id ? 'bg-purple-600 text-white' : ''}`} title="Show Videos"><FiVideo /></button>
                <button disabled className="p-2 bg-gray-700 rounded-md text-gray-500 cursor-not-allowed" title="Edit (coming soon)"><FiEdit /></button>
                <button onClick={() => onDelete(log.id)} className="p-2 bg-gray-700 hover:bg-red-600 rounded-md transition" title="Delete Log"><FiTrash2 /></button>
              </div>
            </div>
            {activeVideoLogId === log.id && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                <VideoHighlights location={log.location} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}