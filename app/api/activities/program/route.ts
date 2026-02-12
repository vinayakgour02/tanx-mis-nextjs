import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let whereClause: any = {
      program: {
        organizationId: session.user.organizationId
      }
    };

    // If programId is provided, filter by it
    if (programId) {
      whereClause.programId = programId;
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        objective: true,
        Intervention:{
          include:{
            SubIntervention: true
          }
        },
        indicator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
} 