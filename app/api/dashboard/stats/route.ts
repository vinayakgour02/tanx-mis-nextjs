import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID from user's membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        organizationId: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No active organization membership found' },
        { status: 404 }
      );
    }

    // Get organization stats
    const [
      totalProjects,
      activeProjects,
      totalPrograms,
      upcomingActivities,
      teamMembers,
    ] = await Promise.all([
      // Total Projects
      prisma.project.count({
        where: {
          organizationId: membership.organizationId,
        },
      }),
      // Active Projects
      prisma.project.count({
        where: {
          organizationId: membership.organizationId,
          status: 'ACTIVE',
        },
      }),
      // Total Programs
      prisma.program.count({
        where: {
          organizationId: membership.organizationId,
        },
      }),
      // Upcoming Activities (next 7 days)
      prisma.activity.count({
        where: {
          project: {
            organizationId: membership.organizationId,
          },
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Team Members
      prisma.membership.count({
        where: {
          organizationId: membership.organizationId,
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalPrograms,
      upcomingActivities,
      teamMembers,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 