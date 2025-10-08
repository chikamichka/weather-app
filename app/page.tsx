"use client";

import { useState, useEffect, useRef } from 'react';
import CurrentWeather, { type CurrentWeatherProps } from '../components/CurrentWeather';
import Forecast, { type ForecastProps } from '../components/Forecast';
import LogManager from '../components/LogManager'; // Import the new manager

// Define the expected type for the primary weather data container
interface WeatherData {
  current: CurrentWeatherProps['data'];
  forecast: ForecastProps['data'];
}

// Define the expected type for a single suggestion item
interface Suggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export default function Home() {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // All useEffects and handlers for the live weather search remain unchanged...
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
    // Automatically fetch weather after selection
    handleFetchWeather(undefined, cityName);
  };

  const handleFetchWeather = async (e?: React.FormEvent, loc?: string) => {
    e?.preventDefault();
    const targetLocation = loc || location;

    if (!targetLocation) {
      setError("Please enter a location.");
      return;
    }

    setLoading(true);
    setWeatherData(null);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(targetLocation)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data.');
      }

      setWeatherData(data);

      const trimmedLocation = targetLocation.trim();
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
    // ... this function remains unchanged
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

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400">Weather Dashboard</h1>
          <p className="text-gray-400 mt-2">Live forecasts and your personal weather logbook.</p>
        </header>

        {/* --- Live Weather Search Section --- */}
        <section id="live-weather" className="mb-12">
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
                placeholder="Search a city for live weather..."
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
                        <div key={`${item}-${i}`} onClick={() => handleSelectSuggestion(item)} className="p-3 hover:bg-blue-500/20 cursor-pointer transition text-sm">
                          <span className="text-gray-200">{item}</span>
                        </div>
                      ))}
                    </>
                  ) : null }
                </div>
              )}
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition shadow-md disabled:bg-gray-500" disabled={loading || !location}>
              {loading ? 'Searching...' : 'Get Weather'}
            </button>
          </form>
          <div className="text-center">
            <button onClick={handleGeoLocation} className="text-blue-400 hover:text-blue-300 transition text-sm disabled:text-gray-500" disabled={loading}>
              Or use my current location
            </button>
          </div>
          
          {loading && <p className="text-center text-lg text-blue-400 mt-4">Loading Weather Data...</p>}
          {error && (
            <p className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-700">
              {error}
            </p>
          )}

          {weatherData && (
            <div className="space-y-8 mt-6">
              <CurrentWeather data={weatherData.current} />
              <Forecast data={weatherData.forecast} />
            </div>
          )}
        </section>

        <hr className="my-12 border-gray-700/50" />

        {/* --- Log Management Section --- */}
        <LogManager />

      </div>
    </main>
  );
}