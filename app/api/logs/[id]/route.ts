import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE a specific log
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;

  try {
    await prisma.weatherLog.delete({ where: { id } });
    return NextResponse.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete log ${id}:`, error);
    return NextResponse.json(
      { error: 'Log not found or failed to delete.' },
      { status: 404 }
    );
  }
}

// UPDATE a specific log
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;

  try {
    const { location, startDate, endDate, weatherData } = await request.json();

    // Validation
    if (!location || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 });
    }

    const updatedLog = await prisma.weatherLog.update({
      where: { id },
      data: {
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        weatherData: weatherData || undefined, // Only update if provided
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error(`Failed to update log ${id}:`, error);
    return NextResponse.json(
      { error: 'Log not found or failed to update.' },
      { status: 404 }
    );
  }
}