"use client";

import { useState, useEffect, useRef } from 'react';
import CurrentWeather from '../components/CurrentWeather';
import Forecast from '../components/Forecast';

// Define the expected type for the primary weather data container
interface WeatherData {
  current: any; // Keeping 'any' here as current weather object is complex
  forecast: any[]; // Keeping 'any' here as forecast array items are complex
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
  
  // FIX: Explicitly type suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]); 
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  // Save when changed
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

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) return setSuggestions([]);
    try {
      // Assuming your /api/geocode endpoint uses 'q' as the query parameter
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions.');
      
      // FIX: Explicitly type the incoming data
      const data: Suggestion[] = await res.json(); 
      setSuggestions(data);
    } catch (e: unknown) { // FIX: Use 'unknown' for catch parameter
      console.error("Error fetching suggestions:", e);
      setSuggestions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    fetchSuggestions(value);
    setShowDropdown(true); // Ensure dropdown is shown when typing
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
      // Note: We are using 'location' parameter which triggers geocoding logic in the backend
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      const data = await response.json();
      
      if (!response.ok) {
        // Handle API error structure
        throw new Error(data.error || 'Failed to fetch weather data.');
      }

      setWeatherData(data);

      // Add to search history if new
      const trimmedLocation = location.trim();
      if (!searchHistory.some(h => h.toLowerCase() === trimmedLocation.toLowerCase())) {
        setSearchHistory((prev) => [trimmedLocation, ...prev].slice(0, 5));
      }
      
    } catch (err: unknown) { // FIX: Use 'unknown' for catch parameter
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during weather fetch.';
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
        // Update location field for user feedback
        setLocation(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
        
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
          // Add coordinates to history
          setSearchHistory((prev) => [`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, ...prev].slice(0, 5));

        } catch (err: unknown) { // FIX: Use 'unknown' for catch parameter
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during geolocation fetch.';
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }, 
      (error) => { // FIX: Explicitly type error (or let TS infer GeolocationPositionError)
        console.error("Geolocation Error:", error.message);
        setError("Unable to retrieve your location. Please ensure location services are enabled.");
      });
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-6 text-blue-400">Weather App</h1>
        
        {/* Author Info */}
        <div className="text-center mb-8 text-gray-400">
          <p>Created by: chikamichka</p>
        </div>

        <form onSubmit={handleFetchWeather} className="relative flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow" ref={dropdownRef}>
            <input
              ref={inputRef}
              type="text"
              value={location}
              onChange={handleChange}
              onFocus={() => {
                  setShowDropdown(true);
                  // Refetch suggestions if input has content and dropdown is shown
                  if (location.length >= 2) fetchSuggestions(location); 
              }}
              placeholder="Enter City, Zip Code, or Coordinates"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            />

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-20 w-full bg-gray-800 border border-gray-700 rounded-xl mt-1 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {/* FIX: Ensure `s` is typed as Suggestion */}
                {suggestions.length > 0 ? (
                  suggestions.map((s: Suggestion, i) => (
                    <div
                      key={i}
                      // FIX: Safe access of s.state and correct concatenation
                      onClick={() => handleSelectSuggestion(`${s.name}${s.state ? `, ${s.state}` : ''}, ${s.country}`)}
                      className="p-3 hover:bg-blue-500/20 cursor-pointer transition text-sm"
                    >
                      <span className="font-semibold">{s.name}</span>
                      {s.state ? `, ${s.state}` : ''} <span className="text-gray-400">({s.country})</span>
                    </div>
                  ))
                ) : location.length < 2 && searchHistory.length > 0 ? (
                  // Show history when input is short or empty
                  <>
                    <div className="p-3 text-gray-400 text-xs font-semibold border-b border-gray-700 uppercase">Recent Searches</div>
                    {searchHistory.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-3 hover:bg-blue-500/20 cursor-pointer transition text-sm"
                      >
                        <span className="text-gray-200">{item}</span>
                      </div>
                    ))}
                  </>
                ) : location.length >= 2 && loading ? (
                    <div className="p-3 text-gray-400 text-sm text-center">Searching...</div>
                ) : (
                  <div className="p-3 text-gray-400 text-sm text-center">Type at least 2 letters for suggestions.</div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition shadow-md disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Get Weather'}
          </button>
        </form>

        <div className="text-center mb-8">
          <button
            onClick={handleGeoLocation}
            className="text-blue-400 hover:text-blue-300 transition text-sm"
            disabled={loading}
          >
            Or use my current location
          </button>
        </div>

        {loading && <p className="text-center text-lg text-blue-400">Loading Weather Data...</p>}
        {error && (
          <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-700">
            {error}
          </p>
        )}

        {weatherData && (
          <div className="space-y-8 mt-6">
            <CurrentWeather data={weatherData.current} />
            <Forecast data={weatherData.forecast} />
          </div>
        )}
      </div>
    </main>
  );
}