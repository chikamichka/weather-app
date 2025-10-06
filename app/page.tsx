"use client";

import { useState, useEffect, useRef } from 'react';
import CurrentWeather from '../components/CurrentWeather';
import Forecast from '../components/Forecast';

interface WeatherData {
  current: any;
  forecast: any[];
}

export default function Home() {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
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
      const res = await fetch(`/api/geocode?q=${query}`);
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    fetchSuggestions(value);
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

    try {
      const response = await fetch(`/api/weather?location=${location}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch weather data.');

      setWeatherData(data);

      // Add to search history if new
      if (!searchHistory.includes(location)) {
        setSearchHistory((prev) => [location, ...prev].slice(0, 5));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLoading(true);
        setWeatherData(null);
        setError(null);
        try {
          const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to fetch weather data.');
          setWeatherData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }, 
      () => setError("Unable to retrieve your location."));
    } else {
      setError("Geolocation not supported.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-6">Weather App</h1>
        
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
              onFocus={() => setShowDropdown(true)}
              placeholder="Enter City, Zip Code, or Coordinates"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-20 w-full bg-gray-800 border border-gray-700 rounded-xl mt-1 shadow-lg overflow-hidden">
                {suggestions.length > 0 ? (
                  suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleSelectSuggestion(`${s.name}, ${s.country}`)}
                      className="p-2 hover:bg-gray-700 cursor-pointer transition"
                    >
                      <span className="font-semibold">{s.name}</span>
                      {s.state ? `, ${s.state}` : ''} <span className="text-gray-400">({s.country})</span>
                    </div>
                  ))
                ) : searchHistory.length > 0 ? (
                  <>
                    <div className="p-2 text-gray-400 text-sm border-b border-gray-700">Recent Searches</div>
                    {searchHistory.map((item, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-2 hover:bg-gray-700 cursor-pointer transition"
                      >
                        <span className="text-gray-200">{item}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-2 text-gray-400 text-sm text-center">No suggestions</div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-md font-semibold transition"
          >
            Get Weather
          </button>
        </form>

        <div className="text-center mb-8">
          <button
            onClick={handleGeoLocation}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Or use my current location
          </button>
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && (
          <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">
            {error}
          </p>
        )}

        {weatherData && (
          <div className="space-y-8">
            <CurrentWeather data={weatherData.current} />
            <Forecast data={weatherData.forecast} />
          </div>
        )}
      </div>
    </main>
  );
}
