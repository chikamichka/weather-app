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

interface Wind {
    speed: number;
    deg: number;
}

// Type for the current weather API response
interface CurrentWeatherData {
    weather: WeatherDetail[];
    main: WeatherMain;
    wind: Wind;
    name: string;
}

// Type for a single item in the 5-day forecast list
interface ForecastItem {
    dt: number;
    main: WeatherMain;
    weather: WeatherDetail[];
}

// Type for the raw 5-day forecast API response
interface RawForecastData {
    list: ForecastItem[];
}

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OPENWEATHER_API_KEY;

async function fetchOpenWeatherData<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Ignore JSON parsing errors for non-JSON responses
        }
        throw new Error(errorMessage);
    }
    
    return response.json();
}

export async function GET(request: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: API key not set.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    let currentUrl: string;
    let forecastUrl: string;

    if (lat && lon) {
        currentUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (location) {
        currentUrl = `${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=metric`;
        forecastUrl = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=metric`;
    } else {
        return NextResponse.json({ error: 'Missing location or coordinate parameters.' }, { status: 400 });
    }

    try {
        const [currentData, rawForecastData] = await Promise.all([
            fetchOpenWeatherData<CurrentWeatherData>(currentUrl),
            fetchOpenWeatherData<RawForecastData>(forecastUrl),
        ]);

        const dailyForecasts: { [key: string]: ForecastItem } = {};
        for (const item of rawForecastData.list) {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = item;
            }
        }
        
        const processedForecast = Object.values(dailyForecasts).slice(0, 5);

        return NextResponse.json({
            current: currentData,
            forecast: processedForecast
        });

    } catch (error: unknown) {
    console.error('Weather API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ error: `Could not retrieve weather data. ${errorMessage}` }, { status: 500 });
}
}