"use client";

import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiMapPin, FiCalendar, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

interface Suggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

interface LogFormProps {
  onLogCreated: () => void;
}

export default function LogForm({ onLogCreated }: LogFormProps) {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("logSearchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    setError(null);
    setWarning(null);
    fetchSuggestions(value);
    setShowDropdown(true);
  };

  const handleSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | null) => {
    if (type === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setWarning(null);
    setError(null);

    // Check date range warning
    if (date && (type === 'start' ? endDate : startDate)) {
      const start = type === 'start' ? date : startDate;
      const end = type === 'end' ? date : endDate;
      if (start && end) {
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 5) {
          setWarning(`⚠️ Weather forecast is limited to 5 days. Only the next 5 days of data will be saved.`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !startDate || !endDate) {
      setError("All fields are required.");
      return;
    }
    if (startDate >= endDate) {
      setError("The end date must be after the start date.");
      return;
    }

    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > 5) {
      setWarning("Note: Weather forecast data is limited to 5 days. Only the next 5 days will be saved.");
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, startDate, endDate }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save log.");
      }

      const newHistory = [location, ...history.filter((h) => h.toLowerCase() !== location.toLowerCase())].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("logSearchHistory", JSON.stringify(newHistory));

      setSuccessMessage("Weather log saved successfully! 🎉");
      setLocation("");
      setWarning(null);
      onLogCreated();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-indigo-100 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Location Input */}
        <div className="relative" ref={dropdownRef}>
          <label
            htmlFor="location"
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block flex items-center gap-2"
          >
            <FiMapPin className="text-indigo-500 dark:text-indigo-400" />
            Location
          </label>
          <div className="relative">
            <input
              id="location"
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="e.g., Paris, Tokyo, New York..."
              className="w-full p-3.5 pl-4 border-2 border-indigo-200 dark:border-gray-600 rounded-xl 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white dark:bg-gray-800 dark:text-white 
              transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              autoComplete="off"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-2 rounded-xl shadow-2xl border-2 border-indigo-100 dark:border-gray-600 bg-white dark:bg-gray-800 max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((s, i) => (
                  <div
                    key={`${s.lat}-${s.lon}-${i}`}
                    onClick={() => handleSelect(`${s.name}, ${s.country}`)}
                    className="p-3.5 hover:bg-indigo-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {s.name}
                      {s.state ? `, ${s.state}` : ""}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">{s.country}</span>
                  </div>
                ))
              ) : history.length > 0 && location.length < 2 ? (
                <>
                  <div className="p-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    📍 Recent Locations
                  </div>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelect(h)}
                      className="p-3.5 hover:bg-indigo-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      {h}
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block flex items-center gap-2"
            >
              <FiCalendar className="text-indigo-500 dark:text-indigo-400" />
              Start Date
            </label>
            <DatePicker
              id="start-date"
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
              htmlFor="end-date"
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block flex items-center gap-2"
            >
              <FiCalendar className="text-indigo-500 dark:text-indigo-400" />
              End Date
            </label>
            <DatePicker
              id="end-date"
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
        {successMessage && (
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border-2 border-green-200 dark:border-green-800">
            <FiCheckCircle className="flex-shrink-0" size={18} />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
          dark:from-indigo-600 dark:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800
          text-white p-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl
          disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none
          transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            "💾 Save Weather Log"
          )}
        </button>
      </form>
    </div>
  );
}