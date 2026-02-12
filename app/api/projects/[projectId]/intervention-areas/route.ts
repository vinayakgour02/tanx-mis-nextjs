import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: 
  Readonly<{
       params: { projectId: string }
   }>
) {

  const param = await params

  try {
    const interventionAreas = await prisma.interventionArea.findMany({
      where: {
        projectId: param.projectId,
      },
      select: {
        id: true,
        stateId: true,
        districtId: true,
        blockId: true,
        gramPanchayatId: true,
        villageId: true,
        villageName: {
          select: {
            id: true,
            name: true,
          },
        },
        gramPanchayat: {
          select: {
            id: true,
            name: true,
          },
        },
        blockName: {
          select: {
            id: true,
            name: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        serialNumber: 'asc',
      },
    });

    return NextResponse.json(interventionAreas);
  } catch (error) {
    console.error('Failed to fetch intervention areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intervention areas' },
      { status: 500 }
    );
  }
} 