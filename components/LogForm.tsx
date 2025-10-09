"use client";

import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiMapPin, FiCalendar, FiCheckCircle } from "react-icons/fi";

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
    fetchSuggestions(value);
    setShowDropdown(true);
  };

  const handleSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowDropdown(false);
    setSuggestions([]);
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

      setSuccessMessage("Log saved successfully!");
      setLocation("");
      onLogCreated();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 rounded-2xl shadow-lg transition-all duration-300 
      bg-blue-100/70 text-gray-800 
      dark:bg-gray-800/80 dark:text-gray-100"
    >
      {/* Removed "Add Weather Log" heading */}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Location Input */}
        <div className="relative" ref={dropdownRef}>
          <label
            htmlFor="location"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
          >
            Location
          </label>
          <div className="relative">
            <FiMapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              id="location"
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="e.g., Tokyo, Japan"
              className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              bg-white dark:bg-gray-700 dark:text-white 
              transition placeholder-gray-400"
              autoComplete="off"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute z-10 w-full mt-1 rounded-lg shadow-lg 
              border border-gray-300 dark:border-gray-700 
              bg-white dark:bg-gray-800 
              max-h-60 overflow-y-auto"
            >
              {suggestions.length > 0 ? (
                suggestions.map((s, i) => (
                  <div
                    key={`${s.lat}-${s.lon}-${i}`}
                    onClick={() => handleSelect(`${s.name}, ${s.country}`)}
                    className="p-3 hover:bg-blue-200/40 dark:hover:bg-gray-700 cursor-pointer text-sm"
                  >
                    {s.name}
                    {s.state ? `, ${s.state}` : ""},{" "}
                    <span className="text-gray-400 dark:text-gray-300">{s.country}</span>
                  </div>
                ))
              ) : history.length > 0 && location.length < 2 ? (
                <>
                  <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    Recent Locations
                  </div>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelect(h)}
                      className="p-3 hover:bg-blue-200/40 dark:hover:bg-gray-700 cursor-pointer text-sm"
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="start-date"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
            >
              Start Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <DatePicker
                id="start-date"
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                bg-white dark:bg-gray-700 dark:text-white transition"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>

          <div className="flex-1">
            <label
              htmlFor="end-date"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
            >
              End Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <DatePicker
                id="end-date"
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                bg-white dark:bg-gray-700 dark:text-white transition"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-green-600 dark:text-green-400 text-sm text-center bg-green-100 dark:bg-green-900/30 p-2 rounded-md flex items-center justify-center gap-2">
            <FiCheckCircle /> {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 
          text-white p-3 rounded-lg font-semibold transition shadow-md 
          disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Log"}
        </button>
      </form>
    </div>
  );
}
