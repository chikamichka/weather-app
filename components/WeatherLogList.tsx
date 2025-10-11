"use client";

import { useState } from "react";
import { JsonValue } from "@prisma/client/runtime/library";
import VideoHighlights from "./VideoHighlights";
import { FiMap, FiVideo, FiTrash2, FiEdit, FiDownload, FiChevronDown, FiChevronUp } from "react-icons/fi";
import jsPDF from "jspdf";

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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleVideos = (logId: string) => {
    setActiveVideoLogId((currentId) => (currentId === logId ? null : logId));
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogId((currentId) => (currentId === logId ? null : logId));
  };

  const exportJSON = (log: WeatherLog) => {
    const dataStr = JSON.stringify(log, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weather-log-${log.location}-${log.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (log: WeatherLog) => {
    const weatherData = log.weatherData as any;
    const rows = [
      ["Location", "Start Date", "End Date", "Latitude", "Longitude"],
      [log.location, log.startDate, log.endDate, log.latitude.toString(), log.longitude.toString()],
      [],
      ["Date", "Temp (°C)", "Description", "Humidity (%)", "Wind Speed (m/s)"],
    ];

    if (weatherData?.list) {
      weatherData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        rows.push([
          date,
          item.main?.temp?.toString() || "N/A",
          item.weather?.[0]?.description || "N/A",
          item.main?.humidity?.toString() || "N/A",
          item.wind?.speed?.toString() || "N/A",
        ]);
      });
    }

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weather-log-${log.location}-${log.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (log: WeatherLog) => {
    const doc = new jsPDF();
    const weatherData = log.weatherData as any;

    doc.setFontSize(18);
    doc.text(`Weather Log: ${log.location}`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date Range: ${new Date(log.startDate).toLocaleDateString()} - ${new Date(log.endDate).toLocaleDateString()}`, 20, 35);
    doc.text(`Coordinates: ${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`, 20, 45);
    doc.text(`Saved: ${new Date(log.createdAt).toLocaleString()}`, 20, 55);

    let yPos = 70;
    doc.setFontSize(14);
    doc.text("Weather Forecast:", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    if (weatherData?.list) {
      weatherData.list.slice(0, 10).forEach((item: any, index: number) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        const temp = item.main?.temp ? `${Math.round(item.main.temp)}°C` : "N/A";
        const desc = item.weather?.[0]?.description || "N/A";
        const humidity = item.main?.humidity ? `${item.main.humidity}%` : "N/A";
        
        doc.text(`${date}: ${temp}, ${desc}, Humidity: ${humidity}`, 20, yPos);
        yPos += 8;
        
        if (yPos > 270 && index < weatherData.list.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    doc.save(`weather-log-${log.location}-${log.id}.pdf`);
  };

  const getWeatherDays = (weatherData: JsonValue) => {
    const data = weatherData as any;
    if (!data?.list) return [];
    
    const dailyData: { [key: string]: any } = {};
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = item;
      }
    });
    
    return Object.entries(dailyData).map(([date, item]) => ({ date, item }));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-slate-700">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">No saved logs yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create your first weather log using the form above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const weatherDays = getWeatherDays(log.weatherData);
        const isExpanded = expandedLogId === log.id;
        
        return (
          <div
            key={log.id}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-slate-700 transition-all hover:shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📍</span>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-purple-400 dark:to-pink-400">
                    {log.location}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span>📅</span>
                  {new Date(log.startDate).toLocaleDateString()} - {new Date(log.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  💾 Saved: {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-2 self-start sm:self-center flex-shrink-0 flex-wrap">
                <a
                  href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 rounded-lg transition-all text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800"
                  title="View on Map"
                >
                  <FiMap size={18} />
                </a>
                <button
                  onClick={() => toggleVideos(log.id)}
                  className={`p-2.5 rounded-lg transition-all border-2 ${
                    activeVideoLogId === log.id
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                  }`}
                  title="Show Videos"
                >
                  <FiVideo size={18} />
                </button>
                <button
                  onClick={() => onEdit(log)}
                  className="p-2.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-lg transition-all text-blue-700 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800"
                  title="Edit Log"
                >
                  <FiEdit size={18} />
                </button>
                <button
                  onClick={() => onDelete(log.id)}
                  className="p-2.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-all text-red-700 dark:text-red-400 border-2 border-red-200 dark:border-red-800"
                  title="Delete Log"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            {/* Weather Data Section */}
            <div className="mt-6 pt-6 border-t-2 border-indigo-200 dark:border-slate-700">
              <button
                onClick={() => toggleExpand(log.id)}
                className="flex items-center gap-2 text-indigo-600 dark:text-purple-400 font-bold hover:underline transition-all"
              >
                {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                {isExpanded ? "Hide" : "Show"} Weather Data ({weatherDays.length} days available)
              </button>

              {isExpanded && weatherDays.length > 0 && (
                <div className="mt-4">
                  <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-400 dark:scrollbar-thumb-purple-600 scrollbar-track-indigo-100 dark:scrollbar-track-slate-800">
                      <div className="flex gap-4 min-w-max pb-2">
                        {weatherDays.map(({ date, item }, index) => (
                          <div
                            key={index}
                            className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg min-w-[220px] flex-shrink-0 border-2 border-indigo-100 dark:border-slate-700 hover:shadow-xl transition-all transform hover:scale-105"
                          >
                            <p className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 pb-2 border-b-2 border-indigo-200 dark:border-slate-600">
                              {date}
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <span className="text-xl">🌡️</span>
                                <span className="font-semibold text-orange-700 dark:text-orange-400">
                                  {item.main?.temp ? `${Math.round(item.main.temp)}°C` : "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                                <span className="text-xl">☁️</span>
                                <span className="text-sky-700 dark:text-sky-400 capitalize">
                                  {item.weather?.[0]?.description || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-xl">💧</span>
                                <span className="text-blue-700 dark:text-blue-400">
                                  {item.main?.humidity || "N/A"}% humidity
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                                <span className="text-xl">💨</span>
                                <span className="text-teal-700 dark:text-teal-400">
                                  {item.wind?.speed ? `${item.wind.speed.toFixed(1)} m/s` : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <button
                      onClick={() => exportJSON(log)}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                    >
                      <FiDownload size={18} /> Export JSON
                    </button>
                    <button
                      onClick={() => exportCSV(log)}
                      className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                    >
                      <FiDownload size={18} /> Export CSV
                    </button>
                    <button
                      onClick={() => exportPDF(log)}
                      className="px-5 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                    >
                      <FiDownload size={18} /> Export PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeVideoLogId === log.id && (
              <div className="mt-6 pt-6 border-t-2 border-indigo-200 dark:border-slate-700">
                <VideoHighlights location={log.location} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}