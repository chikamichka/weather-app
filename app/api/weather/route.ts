import { NextRequest, NextResponse } from 'next/server';

// --- Type definitions for OpenWeatherMap API ---

interface WeatherMain {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
}

interface WeatherDetail {
    id: number;
    main: string;
    description: string;
    icon: string;
}

interface ForecastItem {
    dt: number;
    main: WeatherMain;
    weather: WeatherDetail[];
    // Include other properties you might use from a forecast item (e.g., wind, visibility, etc.)
}

interface RawForecastData {
    list: ForecastItem[];
    // Add other fields from the top level (e.g., city info)
}

// Define the base URL for the OpenWeatherMap API
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
// Retrieve the API key from environment variables
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Helper function to handle fetching data from OpenWeatherMap
// We use Promise<any> here since the return shape (current vs. forecast) is variable.
async function fetchOpenWeatherData(url: string): Promise<any> {
    const response = await fetch(url);

    if (!response.ok) {
        let errorMessage = `Failed to fetch data from OpenWeatherMap. Status: ${response.status}`;
        try {
            // FIX: Explicitly type the error data as unknown and handle safely
            const errorData: unknown = await response.json();
            if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
                errorMessage = (errorData as { message: string }).message;
            }
        } catch (e: unknown) { // FIX: Use 'unknown' for catch parameter
            // Ignore JSON parsing error if response is not JSON
        }
        throw new Error(errorMessage);
    }
    
    return response.json();
}

/**
 * Handles GET requests to /api/weather.
 * This function securely calls the OpenWeatherMap API.
 * It supports fetching by location name/zip OR by latitude/longitude.
 */
export async function GET(request: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: OpenWeatherMap API key not set.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    let currentUrl: string;
    let forecastUrl: string;

    // 1. Determine the query type (location name/zip OR coordinates)
    if (lat && lon) {
        // Case 1: Search by Coordinates
        currentUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (location) {
        // Case 2: Search by Location Name/Zip Code
        currentUrl = `${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=metric`;
    } else {
        return NextResponse.json({ error: 'Missing location, latitude, or longitude parameters.' }, { status: 400 });
    }

    try {
        // 2. Fetch both current weather and 5-day forecast concurrently
        // FIX: Explicitly type the result array to prevent 'any' errors
        const [currentData, rawForecastData]: [any, RawForecastData] = await Promise.all([
            fetchOpenWeatherData(currentUrl),
            fetchOpenWeatherData(forecastUrl),
        ]);

        // 3. Process the raw 3-hour forecast data to get one entry per day
        // FIX: Explicitly type 'item' as ForecastItem in filter function
        const dailyForecast = rawForecastData.list.filter((item: ForecastItem, index: number) => {
            // Only keep one entry per day, roughly around noon
            const date = new Date(item.dt * 1000);
            return date.getHours() === 12 || (index === 0 && new Date(rawForecastData.list[0].dt * 1000).getDay() !== date.getDay());
        }).slice(0, 5); // Ensure we only get 5 days max

        // 4. Return the combined, cleaned data to the frontend
        return NextResponse.json({
            current: currentData,
            forecast: dailyForecast
        });

    } catch (error: unknown) { // FIX: Use 'unknown' for catch parameter
        console.error('Weather API Error:', error);
        // FIX: Check if the error is an instance of the Error class for safe access to 'message'
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred on the server.';
        return NextResponse.json({ error: `Could not retrieve weather data. Details: ${errorMessage}` }, { status: 500 });
    }
}
