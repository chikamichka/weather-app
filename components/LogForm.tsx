"use client";
import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiMapPin, FiCalendar, FiCheckCircle } from 'react-icons/fi';

// Define the type for a single suggestion item
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
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d;
  });

  // State for autocompletion and history
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // State for user feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("logSearchHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Handle clicks outside the dropdown to close it
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
    setError(null); // Clear error on new input
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
      setError('All fields are required.');
      return;
    }
    if (startDate >= endDate) {
      setError('The end date must be after the start date.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, startDate, endDate }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save log.');
      }
      
      // Update search history
      const newHistory = [location, ...history.filter(h => h.toLowerCase() !== location.toLowerCase())].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem("logSearchHistory", JSON.stringify(newHistory));

      setSuccessMessage('Log saved successfully!');
      setLocation(''); // Clear form
      onLogCreated();
      
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-blue-300">Save a New Weather Log</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="relative" ref={dropdownRef}>
          <label htmlFor="location" className="text-sm font-medium text-gray-400 mb-1 block">Location</label>
          <div className="relative">
            <FiMapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
            <input
              id="location"
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleLocationChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="e.g., Tokyo, Japan"
              className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {suggestions.length > 0 ? suggestions.map((s, i) => (
                <div key={`${s.lat}-${s.lon}-${i}`} onClick={() => handleSelect(`${s.name}, ${s.country}`)} className="p-3 hover:bg-blue-500/20 cursor-pointer text-sm">
                  {s.name}{s.state ? `, ${s.state}` : ''}, <span className="text-gray-400">{s.country}</span>
                </div>
              )) : history.length > 0 && location.length < 2 ? (
                <>
                  <div className="p-2 text-xs text-gray-400 border-b border-gray-700">Recent Locations</div>
                  {history.map((h, i) => (
                    <div key={i} onClick={() => handleSelect(h)} className="p-3 hover:bg-blue-500/20 cursor-pointer text-sm">{h}</div>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="start-date" className="text-sm font-medium text-gray-400 mb-1 block">Start Date</label>
            <div className="relative">
              <FiCalendar className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
              <DatePicker
                id="start-date"
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>
          <div className="flex-1">
            <label htmlFor="end-date" className="text-sm font-medium text-gray-400 mb-1 block">End Date</label>
            <div className="relative">
              <FiCalendar className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
              <DatePicker
                id="end-date"
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>
        </div>
        
        {error && <p className="text-red-400 text-sm text-center bg-red-900/50 p-2 rounded-md">{error}</p>}
        {successMessage && <p className="text-green-400 text-sm text-center bg-green-900/50 p-2 rounded-md flex items-center justify-center gap-2"><FiCheckCircle /> {successMessage}</p>}
        
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed">
          {loading ? 'Saving...' : 'Save Log'}
        </button>
      </form>
    </div>
  );
}