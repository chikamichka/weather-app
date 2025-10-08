import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE a specific log
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } // <-- must be exact shape
) {
  const id = params.id;
  try {
    await prisma.weatherLog.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete log ${id}:`, error);
    return NextResponse.json(
      { error: 'Log not found or failed to delete.' },
      { status: 404 }
    );
  }
}

// UPDATE a specific log (Example: only location & dates)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const { location, startDate, endDate } = await request.json();

    const updatedLog = await prisma.weatherLog.update({
      where: { id },
      data: {
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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
