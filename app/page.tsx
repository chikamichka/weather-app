"use client";

import { useState, useEffect, useRef } from "react";
import CurrentWeather, { type CurrentWeatherProps } from "../components/CurrentWeather";
import Forecast, { type ForecastProps } from "../components/Forecast";
import LogManager from "../components/LogManager";
import { FiSun, FiMoon } from "react-icons/fi";

interface WeatherData {
  current: CurrentWeatherProps["data"];
  forecast: ForecastProps["data"];
}

interface Suggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

const getInitialTheme = () => {
  if (typeof window !== "undefined" && localStorage.getItem("theme")) {
    return localStorage.getItem("theme") as "light" | "dark";
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

export default function Home() {
  const [location, setLocation] = useState<string>("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

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
      if (!res.ok) throw new Error("Failed to fetch suggestions.");
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
    } catch (e) {
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
      const response = await fetch(
        `/api/weather?location=${encodeURIComponent(targetLocation)}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch weather data.");
      setWeatherData(data);

      const trimmedLocation = targetLocation.trim();
      if (!searchHistory.some((h) => h.toLowerCase() === trimmedLocation.toLowerCase())) {
        setSearchHistory((prev) => [trimmedLocation, ...prev].slice(0, 5));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const locString = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          setLocation(locString);
          setLoading(true);
          setWeatherData(null);
          setError(null);
          try {
            const response = await fetch(
              `/api/weather?lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (!response.ok)
              throw new Error(data.error || "Failed to fetch weather data.");
            setWeatherData(data);
            if (!searchHistory.includes(locString)) {
              setSearchHistory((prev) => [locString, ...prev].slice(0, 5));
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation Error:", error.message);
          setError("Unable to retrieve your location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  return (
    <main
      className={`min-h-screen flex flex-col items-center p-4 sm:p-8 transition-colors duration-500 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
      }`}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle Dark/Light Mode"
        className={`absolute top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
          theme === "dark"
            ? "bg-slate-800 text-amber-400 hover:bg-slate-700 border-2 border-slate-700"
            : "bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200"
        }`}
      >
        {theme === "dark" ? <FiSun size={24} /> : <FiMoon size={24} />}
      </button>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1
            className={`text-5xl sm:text-6xl font-extrabold drop-shadow-2xl mb-3 ${
              theme === "dark"
                ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"
            }`}
          >
            ⛅ Weather Dashboard
          </h1>
          <p className={`text-lg ${theme === "dark" ? "text-purple-200" : "text-indigo-700"}`}>
            Explore live forecasts & manage your personal weather logs
          </p>
        </header>

        {/* Search Section */}
        <section className="mb-12">
          <form
            onSubmit={handleFetchWeather}
            className="relative flex flex-col sm:flex-row gap-3"
          >
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
                placeholder="🔍 Search city, zip code, or landmark..."
                className={`w-full p-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all duration-200 shadow-lg ${
                  theme === "dark"
                    ? "bg-slate-800 border-slate-700 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                    : "bg-white border-indigo-200 focus:ring-indigo-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                }`}
              />
              {showDropdown && (
                <div
                  className={`absolute z-20 w-full rounded-xl mt-2 shadow-2xl max-h-64 overflow-y-auto border-2 ${
                    theme === "dark"
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-indigo-100"
                  }`}
                >
                  {suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <div
                        key={`${s.lat}-${s.lon}-${i}`}
                        onClick={() =>
                          handleSelectSuggestion(
                            `${s.name}${s.state ? `, ${s.state}` : ""}, ${s.country}`
                          )
                        }
                        className={`p-4 text-sm cursor-pointer transition-colors border-b last:border-b-0 ${
                          theme === "dark"
                            ? "hover:bg-purple-900/30 border-slate-700"
                            : "hover:bg-indigo-50 border-indigo-100"
                        }`}
                      >
                        <span className="font-semibold">
                          {s.name}
                          {s.state ? `, ${s.state}` : ""}
                        </span>
                        <span className={`ml-2 ${theme === "dark" ? "text-slate-400" : "text-gray-500"}`}>
                          {s.country}
                        </span>
                      </div>
                    ))
                  ) : searchHistory.length > 0 ? (
                    <>
                      <div className={`p-3 text-xs font-semibold uppercase border-b ${
                        theme === "dark" 
                          ? "text-slate-400 border-slate-700 bg-slate-900" 
                          : "text-gray-500 border-indigo-100 bg-indigo-50"
                      }`}>
                        📍 Recent Searches
                      </div>
                      {searchHistory.map((item, i) => (
                        <div
                          key={`${item}-${i}`}
                          onClick={() => handleSelectSuggestion(item)}
                          className={`p-4 text-sm cursor-pointer transition-colors border-b last:border-b-0 ${
                            theme === "dark"
                              ? "hover:bg-purple-900/20 border-slate-700"
                              : "hover:bg-indigo-50 border-indigo-100"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </>
                  ) : null}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : theme === "dark"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              }`}
            >
              {loading ? "🔄 Searching..." : "🌤️ Get Weather"}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={handleGeoLocation}
              disabled={loading}
              className={`text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "text-purple-400 hover:text-purple-300"
                  : "text-indigo-600 hover:text-indigo-500"
              }`}
            >
              📍 Or use my current location
            </button>
          </div>
        </section>

        {/* Weather Display */}
        {loading && (
          <div className="text-center my-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-purple-500"></div>
            <p className={`mt-4 text-lg font-medium ${
              theme === "dark" ? "text-purple-300" : "text-indigo-600"
            }`}>
              Loading Weather Data...
            </p>
          </div>
        )}
        {error && (
          <div
            className={`mt-6 text-center p-4 rounded-xl border-2 ${
              theme === "dark"
                ? "text-red-400 bg-red-900/30 border-red-800"
                : "text-red-700 bg-red-50 border-red-300"
            }`}
          >
            ⚠️ {error}
          </div>
        )}
        {weatherData && (
          <div className="grid gap-6 mt-8">
            <div
              className={`p-6 rounded-2xl shadow-xl border-2 ${
                theme === "dark"
                  ? "bg-slate-800/50 backdrop-blur border-slate-700"
                  : "bg-white/80 backdrop-blur border-indigo-100"
              }`}
            >
              <CurrentWeather data={weatherData.current} />
            </div>
            <div
              className={`p-6 rounded-2xl shadow-xl border-2 ${
                theme === "dark"
                  ? "bg-slate-800/50 backdrop-blur border-slate-700"
                  : "bg-white/80 backdrop-blur border-indigo-100"
              }`}
            >
              <Forecast data={weatherData.forecast} />
            </div>
          </div>
        )}

        <hr className={`my-16 border-t-2 ${
          theme === "dark" ? "border-slate-700" : "border-indigo-200"
        }`} />

        {/* Log Manager */}
        <div
          className={`p-8 rounded-2xl shadow-xl border-2 ${
            theme === "dark"
              ? "bg-slate-800/50 backdrop-blur border-slate-700"
              : "bg-white/80 backdrop-blur border-indigo-100"
          }`}
        >
          <LogManager />
        </div>

        {/* Footer */}
        <footer className={`mt-16 text-center text-sm ${
          theme === "dark" ? "text-purple-300" : "text-indigo-600"
        }`}>
          <p className="font-medium">
            ✨ Developed with passion by <strong>Boukhelkhal Imene</strong> ✨ 
          </p>
          <p className={`mt-2 text-xs ${
            theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}>
            Powered by OpenWeatherMap API
          </p>
        </footer>
      </div>
    </main>
  );
}