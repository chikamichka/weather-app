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

// Determine theme on initial load
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

  // Apply theme globally
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  // Save search history
  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Close dropdown on outside click
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

  // Fetch city suggestions
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
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-gray-900"
      }`}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle Dark/Light Mode"
        className={`absolute top-4 right-4 z-50 p-2 rounded-full shadow-md transition duration-300 ${
          theme === "dark"
            ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
            : "bg-blue-200 text-blue-600 hover:bg-blue-300"
        }`}
      >
        {theme === "dark" ? <FiSun size={22} /> : <FiMoon size={22} />}
      </button>

      <div className="w-full max-w-3xl">
        {/* Header */}
        <header className="text-center mb-10">
          <h1
            className={`text-5xl font-bold drop-shadow-lg ${
              theme === "dark" ? "text-yellow-300" : "text-blue-600"
            }`}
          >
            Weather Dashboard
          </h1>
          <p className="mt-2 opacity-80">
            Explore live forecasts & manage your personal weather logs.
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
                placeholder="Enter a city, zip code, or landmark..."
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-150 ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 focus:ring-yellow-400 text-white"
                    : "bg-white border-gray-300 focus:ring-blue-500 text-gray-800"
                }`}
              />
              {showDropdown && (
                <div
                  className={`absolute z-20 w-full rounded-xl mt-1 shadow-lg max-h-64 overflow-y-auto ${
                    theme === "dark"
                      ? "bg-gray-800 border border-gray-700"
                      : "bg-white border border-gray-300"
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
                        className={`p-3 text-sm cursor-pointer transition ${
                          theme === "dark"
                            ? "hover:bg-yellow-400/20"
                            : "hover:bg-blue-100"
                        }`}
                      >
                        <span className="font-semibold">
                          {s.name}
                          {s.state ? `, ${s.state}` : ""}
                        </span>
                        <span className="ml-2 opacity-70">{s.country}</span>
                      </div>
                    ))
                  ) : searchHistory.length > 0 ? (
                    <>
                      <div className="p-3 text-xs font-semibold opacity-60 uppercase border-b">
                        Recent Searches
                      </div>
                      {searchHistory.map((item, i) => (
                        <div
                          key={`${item}-${i}`}
                          onClick={() => handleSelectSuggestion(item)}
                          className={`p-3 text-sm cursor-pointer transition ${
                            theme === "dark"
                              ? "hover:bg-yellow-400/10"
                              : "hover:bg-blue-100"
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
              className={`p-3 rounded-lg font-semibold shadow-md transition ${
                loading
                  ? "bg-gray-400 text-white"
                  : theme === "dark"
                  ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? "Searching..." : "Get Weather"}
            </button>
          </form>
          <div className="text-center mt-3">
            <button
              onClick={handleGeoLocation}
              disabled={loading}
              className={`text-sm transition ${
                theme === "dark"
                  ? "text-yellow-400 hover:text-yellow-300"
                  : "text-blue-600 hover:text-blue-500"
              }`}
            >
              Or use my current location
            </button>
          </div>
        </section>

        {/* Weather Display */}
        {loading && (
          <p
            className={`text-center text-lg mt-4 animate-pulse ${
              theme === "dark" ? "text-yellow-300" : "text-blue-600"
            }`}
          >
            Loading Weather Data...
          </p>
        )}
        {error && (
          <p
            className={`mt-4 text-center p-3 rounded-lg border ${
              theme === "dark"
                ? "text-red-400 bg-red-900/40 border-red-700"
                : "text-red-600 bg-red-100 border-red-300"
            }`}
          >
            {error}
          </p>
        )}
        {weatherData && (
          <div className="grid gap-8 mt-6">
            <div
              className={`p-6 rounded-xl shadow-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <CurrentWeather data={weatherData.current} />
            </div>
            <div
              className={`p-6 rounded-xl shadow-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <Forecast data={weatherData.forecast} />
            </div>
          </div>
        )}

        <hr className="my-12 opacity-50" />

        {/* Log Manager */}
        <div
          className={`p-6 rounded-xl shadow-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <LogManager />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center opacity-70 text-sm">
          Developed by <strong>Boukhelkhal Imene</strong>.
        </footer>
      </div>
    </main>
  );
}