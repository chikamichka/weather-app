"use client";

import { useState, useEffect, useRef } from 'react';
import CurrentWeather, { type CurrentWeatherProps } from '../components/CurrentWeather';
import Forecast, { type ForecastProps } from '../components/Forecast';
import LogForm from '../components/LogForm';
import WeatherLogList, { type WeatherLog } from '../components/WeatherLogList';

// Define the expected type for the primary weather data container
interface WeatherData {
  current: CurrentWeatherProps['data'];
  forecast: ForecastProps['data'];
}

// Define the expected type for a single suggestion item from the /api/geocode route
interface Suggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string; // Optional field
}

export default function Home() {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // New state for weather logs
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- EXISTING useEffects (no changes needed here) ---

  // Load search history on initial render
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save search history when it changes
  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  // Hide dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- NEW: Fetch logs on initial render ---
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
        const res = await fetch('/api/logs');
        if (!res.ok) throw new Error("Failed to fetch logs.");
        const data: WeatherLog[] = await res.json();
        setLogs(data);
    } catch (err) {
        console.error(err);
    } finally {
        setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- EXISTING handlers (no changes needed here) ---
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions.');
      
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
    } catch (e: unknown) {
      console.error("Error fetching suggestions:", e);
      setSuggestions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    fetchSuggestions(value);
    setShowDropdown(true);
  };

  const handleSelectSuggestion = (cityName: string) => {
    setLocation(cityName);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleFetchWeather = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location) {
      setError("Please enter a location.");
      return;
    }

    setLoading(true);
    setWeatherData(null);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data.');
      }

      setWeatherData(data);

      const trimmedLocation = location.trim();
      if (!searchHistory.some(h => h.toLowerCase() === trimmedLocation.toLowerCase())) {
        setSearchHistory((prev) => [trimmedLocation, ...prev].slice(0, 5));
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };
  
  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const locationString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        setLocation(locationString);
        
        setLoading(true);
        setWeatherData(null);
        setError(null);
        
        try {
          const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data.');
          }
          
          setWeatherData(data);
          if (!searchHistory.includes(locationString)) {
            setSearchHistory((prev) => [locationString, ...prev].slice(0, 5));
          }

        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }, 
      (error: GeolocationPositionError) => {
        console.error("Geolocation Error:", error.message);
        setError("Unable to retrieve your location. Please ensure location services are enabled.");
      });
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };


  // --- NEW: Handlers for CRUD operations ---
  const handleDeleteLog = async (id: string) => {
    // Optimistic UI update
    setLogs(currentLogs => currentLogs.filter(log => log.id !== id));
    
    try {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        // If deletion fails, refetch to revert the UI
        throw new Error('Failed to delete.');
      }
    } catch (err) {
      console.error(err);
      fetchLogs(); // Refetch to get the correct state
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-6 text-blue-400">Weather Dashboard</h1>
        
        <div className="text-center mb-8 text-gray-400">
          <p>Created by: chikamichka</p>
        </div>

        {/* --- EXISTING Weather Search Form (no changes) --- */}
        <form onSubmit={handleFetchWeather} className="relative flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow" ref={dropdownRef}>
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleChange}
              onFocus={() => {
                  setShowDropdown(true);
                  if (location.length >= 2) fetchSuggestions(location); 
              }}
              placeholder="Enter City, Zip Code, or Coordinates"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            />
            {showDropdown && (
              <div className="absolute z-20 w-full bg-gray-800 border border-gray-700 rounded-xl mt-1 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((s, i) => (
                    <div
                      key={`${s.lat}-${s.lon}-${i}`}
                      onClick={() => handleSelectSuggestion(`${s.name}${s.state ? `, ${s.state}` : ''}, ${s.country}`)}
                      className="p-3 hover:bg-blue-500/20 cursor-pointer transition text-sm"
                    >
                      <span className="font-semibold">{s.name}</span>
                      {s.state ? `, ${s.state}` : ''} <span className="text-gray-400">({s.country})</span>
                    </div>
                  ))
                ) : location.length < 2 && searchHistory.length > 0 ? (
                  <>
                    <div className="p-3 text-gray-400 text-xs font-semibold border-b border-gray-700 uppercase">Recent Searches</div>
                    {searchHistory.map((item, i) => (
                      <div
                        key={`${item}-${i}`}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-3 hover:bg-blue-500/20 cursor-pointer transition text-sm"
                      >
                        <span className="text-gray-200">{item}</span>
                      </div>
                    ))}
                  </>
                ) : location.length >= 2 && suggestions.length === 0 ? (
                    <div className="p-3 text-gray-400 text-sm text-center">No suggestions found.</div>
                ) : (
                  <div className="p-3 text-gray-400 text-sm text-center">Type at least 2 characters for suggestions.</div>
                )}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition shadow-md disabled:bg-gray-500"
            disabled={loading || !location}
          >
            {loading ? 'Searching...' : 'Get Weather'}
          </button>
        </form>
        <div className="text-center mb-8">
          <button
            onClick={handleGeoLocation}
            className="text-blue-400 hover:text-blue-300 transition text-sm disabled:text-gray-500"
            disabled={loading}
          >
            Or use my current location
          </button>
        </div>
        {/* --- End of Search Form --- */}
        
        {loading && <p className="text-center text-lg text-blue-400">Loading Weather Data...</p>}
        {error && (
          <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-700">
            {error}
          </p>
        )}

        {weatherData && (
          <div className="space-y-8 mt-6 mb-8">
            <CurrentWeather data={weatherData.current} />
            <Forecast data={weatherData.forecast} />
          </div>
        )}

        {/* --- NEW Log Management Section --- */}
        <div className="space-y-8 mt-10">
            <LogForm onLogCreated={fetchLogs} />
            {logsLoading ? (
                <p className="text-center text-gray-400">Loading logs...</p>
            ) : (
                <WeatherLogList logs={logs} onDelete={handleDeleteLog} />
            )}
        </div>
      </div>
    </main>
  );
}