import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE a specific log
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  const params = await context.params; // <-- resolve if it’s a Promise
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
