"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiX, FiCalendar, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { WeatherLog } from "./WeatherLogList";

interface EditLogModalProps {
  log: WeatherLog;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditLogModal({ log, onClose, onUpdate }: EditLogModalProps) {
  const [startDate, setStartDate] = useState<Date | null>(new Date(log.startDate));
  const [endDate, setEndDate] = useState<Date | null>(new Date(log.endDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check date range on mount and when dates change
    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 5) {
        setWarning("⚠️ Weather forecast is limited to 5 days. Only the next 5 days of data will be saved.");
      } else {
        setWarning(null);
      }
    }
  }, [startDate, endDate]);

  const handleDateChange = (type: 'start' | 'end', date: Date | null) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError("Both dates are required.");
      return;
    }

    if (startDate >= endDate) {
      setError("End date must be after start date.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Step 1: Get coordinates from geocoding
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(log.location)}`);
      const geoData = await geoRes.json();

      if (!geoRes.ok || !geoData || geoData.length === 0) {
        throw new Error('Could not find location.');
      }

      const { lat, lon } = geoData[0];

      // Step 2: Fetch weather data using your API route
      const weatherRes = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const weatherData = await weatherRes.json();

      if (!weatherRes.ok) {
        throw new Error(weatherData.error || 'Failed to fetch weather data.');
      }

      // Step 3: Update the log with new dates and weather data
      const updateRes = await fetch(`/api/logs/${log.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: log.location,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          weatherData: weatherData.forecast ? { list: weatherData.forecast } : weatherData,
        }),
      });

      if (!updateRes.ok) {
        const body = await updateRes.json();
        throw new Error(body.error || "Failed to update log.");
      }

      setSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-indigo-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-purple-400 dark:to-pink-400">
            📝 Edit Weather Log
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiX size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Location Display */}
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-slate-700 rounded-xl">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Location</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-purple-400">{log.location}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date Pickers */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-start-date"
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block flex items-center gap-2"
              >
                <FiCalendar className="text-indigo-500 dark:text-indigo-400" />
                Start Date
              </label>
              <DatePicker
                id="edit-start-date"
                selected={startDate}
                onChange={(date) => handleDateChange('start', date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full p-3.5 border-2 border-indigo-200 dark:border-gray-600 rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                bg-white dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                dateFormat="yyyy/MM/dd"
              />
            </div>

            <div>
              <label
                htmlFor="edit-end-date"
                className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block flex items-center gap-2"
              >
                <FiCalendar className="text-indigo-500 dark:text-indigo-400" />
                End Date
              </label>
              <DatePicker
                id="edit-end-date"
                selected={endDate}
                onChange={(date) => handleDateChange('end', date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                className="w-full p-3.5 border-2 border-indigo-200 dark:border-gray-600 rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                bg-white dark:bg-gray-800 dark:text-white transition-all shadow-sm"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>

          {/* Warning Message */}
          {warning && (
            <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <p>{warning}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 text-red-700 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-2 border-red-200 dark:border-red-800">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" size={18} />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-3 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
              <FiCheckCircle className="flex-shrink-0" size={18} />
              <p>Log updated successfully! 🎉</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
              dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800
              text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl
              disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : success ? (
                "✓ Updated!"
              ) : (
                "💾 Update Log"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}