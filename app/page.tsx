// Use client-side features like hooks
"use client";

import { useState } from 'react';
import CurrentWeather from '../components/CurrentWeather';
import Forecast from '../components/Forecast';

// Define the structure of the weather data we expect
// This helps TypeScript catch errors
interface WeatherData {
  current: any;
  forecast: any[];
}

export default function Home() {
  const [location, setLocation] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchWeather = async (e?: React.FormEvent) => {
    // Prevent the form from refreshing the page
    e?.preventDefault();
    if (!location) {
      setError("Please enter a location.");
      return;
    }

    setLoading(true);
    setWeatherData(null);
    setError(null);

    try {
      // We call our OWN API endpoint, not the weather service directly
      const response = await fetch(`/api/weather?location=${location}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data.');
      }
      
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // Update the input field for user feedback
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        // You would ideally have a separate API endpoint for coords
        // but for simplicity, we'll reuse the location one.
        // The backend will need to differentiate between a name and coords.
        
        // Trigger the fetch after setting location
        // Note: We're calling the API route directly here for immediate feedback
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
      (error) => {
        setError("Unable to retrieve your location. Please grant permission or enter a location manually.");
      });
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };


  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-6">Weather App</h1>
        
        {/* Your Info Section */}
        <div className="text-center mb-8 text-gray-400">
          <p>Created by: chikamichka </p> 
          {/* You can make the info button a modal later */}
        </div>

        <form onSubmit={handleFetchWeather} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter City, Zip Code, or Coordinates"
            className="flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-3 rounded-md font-semibold transition">
            Get Weather
          </button>
        </form>
        
        <div className="text-center mb-8">
            <button onClick={handleGeoLocation} className="text-blue-400 hover:text-blue-300 transition">
                Or use my current location
            </button>
        </div>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}

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