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

    // Get projects created in the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const projects = await prisma.project.findMany({
      where: {
        organizationId: membership.organizationId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group projects by month and status
    const monthlyData = projects.reduce((acc, project) => {
      const month = project.createdAt.toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = {
          total: 0,
          active: 0,
          completed: 0,
        };
      }

      acc[month].total += 1;
      if (project.status === 'ACTIVE') acc[month].active += 1;
      if (project.status === 'COMPLETED') acc[month].completed += 1;

      return acc;
    }, {} as Record<string, { total: number; active: number; completed: number; }>);

    // Convert to array format for the chart
    const trends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));

    return NextResponse.json(trends);
  } catch (error) {
    console.error("[PROJECT_TRENDS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 