import { NextRequest, NextResponse } from 'next/server';

// Define the expected structure for a single location item from the Geo API
interface GeoItem {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string; // State is optional
    // We only include properties used or needed for structure
}

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Keeping 'q' as the parameter name to match your original code
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  
  if (!API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: OpenWeatherMap API key not set.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${GEO_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
    
    if (!res.ok) {
        // Attempt to read the error message from the response body if available
        const errorData = await res.json().catch(() => ({ message: 'Unknown Geo API error' }));
        throw new Error(errorData.message || 'Failed to fetch location data');
    }
    
    // FIX: Explicitly type the data as an array of GeoItem
    const data: GeoItem[] = await res.json(); 

    return NextResponse.json(data);
    
  } catch (error: unknown) { // FIX: Change 'any' to 'unknown'
    console.error('Geocode API Error:', error);
    // FIX: Check if the error is an instance of the Error class for safe access to 'message'
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during geocoding.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
