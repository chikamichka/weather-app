"use client";

import { useState } from "react";
import { JsonValue } from "@prisma/client/runtime/library";
import VideoHighlights from "./VideoHighlights";
import { FiMap, FiVideo, FiTrash2, FiEdit } from "react-icons/fi";

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
  onEdit: (log: WeatherLog) => void;
}

export default function WeatherLogList({ logs, onDelete, onEdit }: WeatherLogListProps) {
  const [activeVideoLogId, setActiveVideoLogId] = useState<string | null>(null);

  const toggleVideos = (logId: string) => {
    setActiveVideoLogId((currentId) => (currentId === logId ? null : logId));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center p-6 bg-blue-50 dark:bg-gray-800/50 rounded-lg shadow-lg transition-colors">
        <p className="text-gray-700 dark:text-gray-200">You have no saved logs.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Use the form above to save your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg transition-colors">
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-blue-100 dark:bg-gray-900/60 p-4 rounded-lg transition-shadow hover:shadow-lg"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {log.location}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(log.startDate).toLocaleDateString()} -{" "}
                  {new Date(log.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Saved on: {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
                <a
                  href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 rounded-md transition text-black dark:text-white"
                  title="View on Map"
                >
                  <FiMap />
                </a>
                <button
                  onClick={() => toggleVideos(log.id)}
                  className={`p-2 rounded-md transition ${
                    activeVideoLogId === log.id
                      ? "bg-purple-600 text-white"
                      : "bg-purple-200 hover:bg-purple-400 dark:bg-gray-700 dark:hover:bg-purple-600 text-black dark:text-white"
                  }`}
                  title="Show Videos"
                >
                  <FiVideo />
                </button>
                <button
                  onClick={() => onEdit(log)}
                  className="p-2 bg-blue-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 rounded-md transition text-black dark:text-white"
                  title="Edit Log"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => onDelete(log.id)}
                  className="p-2 bg-red-200 dark:bg-gray-700 hover:bg-red-400 dark:hover:bg-red-500 rounded-md transition text-black dark:text-white"
                  title="Delete Log"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            {activeVideoLogId === log.id && (
              <div className="mt-4 border-t border-blue-200 dark:border-gray-700 pt-4">
                <VideoHighlights location={log.location} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
