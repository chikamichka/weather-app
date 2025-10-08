import { NextRequest, NextResponse } from 'next/server';

interface GeoItem {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
}

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  
  if (!API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: API key not set.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${GEO_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`);
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch location data' }));
        throw new Error(errorData.message);
    }
    
    const data: GeoItem[] = await res.json(); 

    return NextResponse.json(data);
    
  } catch (error: unknown) {
    console.error('Geocode API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}