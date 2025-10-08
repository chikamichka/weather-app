import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format'); // 'json' or 'csv'

  try {
    const logs = await prisma.weatherLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Flatten the data for CSV export
      const flattenedData = logs.map(log => ({
        id: log.id,
        location: log.location,
        latitude: log.latitude,
        longitude: log.longitude,
        startDate: log.startDate.toISOString(),
        endDate: log.endDate.toISOString(),
        createdAt: log.createdAt.toISOString(),
        weatherData: JSON.stringify(log.weatherData) // Keep JSON as a string
      }));

      const csv = Papa.unparse(flattenedData);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="weather_logs.csv"',
        },
      });
    }

    // Default to JSON
    const jsonString = JSON.stringify(logs, null, 2);
    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="weather_logs.json"',
      },
    });

  } catch (error) {
    console.error('Failed to export data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}