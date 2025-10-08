import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// READ all logs
export async function GET() {
  try {
    const logs = await prisma.weatherLog.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// CREATE a new log
export async function POST(request: Request) {
  try {
    const { location, startDate, endDate } = await request.json();

    // 1. Basic Validation
    if (!location || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 });
    }

    // 2. Geocode location to get coordinates
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`);
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return NextResponse.json({ error: 'Could not find location.' }, { status: 404 });
    }
    const { lat, lon } = geoData[0];

    // 3. Fetch weather data for the coordinates
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok) {
        return NextResponse.json({ error: weatherData.message || 'Failed to fetch weather data.' }, { status: 500 });
    }

    // 4. Save to database
    const newLog = await prisma.weatherLog.create({
      data: {
        location: location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        latitude: lat,
        longitude: lon,
        weatherData: weatherData, // Store the raw JSON
      },
    });

    return NextResponse.json(newLog, { status: 201 });

  } catch (error) {
    console.error('Failed to create log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}