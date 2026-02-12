import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Verify user is ngo_admin
  if ((session.user as any).role !== 'ngo_admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // Get organization ID from membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return new NextResponse("No active organization membership found", { status: 404 });
    }

    // Fetch recent activities
    const activities = await prisma.activity.findMany({
      where: {
        project: {
          organizationId: membership.organizationId,
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        status: true,
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
      take: 5,
    });

    // Transform the data to match the frontend interface
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.name,
      date: activity.startDate?.toISOString() || '',
      type: 'project',
      status: activity.status.toLowerCase() as 'completed' | 'upcoming' | 'in_progress',
      projectName: activity.project.name,
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("[DASHBOARD_ACTIVITIES]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 