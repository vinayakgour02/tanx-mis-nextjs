import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const createdPlans = [];

    for (const item of body) {
      const { 
        projectId,
        activityId,
        interventionAreaId,
        monthlyTargets,
        planYearStart,
        planYearEnd
      } = item;

      if (!projectId || !activityId || !interventionAreaId || !monthlyTargets || !planYearStart || !planYearEnd) {
        continue; // skip invalid items
      }

      // Build location from intervention area
      let finalLocation = '';
      if (interventionAreaId) {
        const area = await prisma.interventionArea.findUnique({
          where: { id: interventionAreaId },
          select: {
            villageName: true,
            gramPanchayat: true,
            blockName: true,
            district: true,
            state: true,
          },
        });
        if (area) {
          finalLocation = `${area.villageName}, ${area.gramPanchayat}, ${area.blockName}, ${area.district}, ${area.state}`;
        }
      }

      const organizationId = session.user.organizationId;

      const plan = await prisma.plan.create({
        data: {
          projectId,
          activityId,
          organizationId,
          interventionAreaId,
          monthlyTargets,
          startMonth: planYearStart,
          endMonth: planYearEnd,
          location: finalLocation,
          status: "PLANNED",
        },
      });

      // Audit log
      try {
        const forwardedFor = request.headers.get("x-forwarded-for") ?? '';
        const realIp = request.headers.get("x-real-ip") ?? '';
        const ipAddress = (forwardedFor.split(",")[0]?.trim() || realIp || undefined);
        const userAgent = request.headers.get("user-agent") || undefined;

        await prisma.auditLog.create({
          data: {
            organizationId: session.user.organizationId || '',
            userId: session.user.id,
            action: "CREATE",
            resource: "Plan",
            resourceId: plan.id,
            ipAddress,
            userAgent,
            timestamp: new Date(),
          },
        });
      } catch (err) {
        console.error("Audit log error", err);
      }

      createdPlans.push(plan);
    }

    return NextResponse.json(createdPlans);
  } catch (error) {
    console.error("Failed to create plans:", error);
    return NextResponse.json({ error: "Failed to create plans" }, { status: 500 });
  }
}

export async function GET() {
  
  try {
     const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const organizationId = session.user.organizationId;

    const plans = await prisma.plan.findMany({
      where:{
        organizationId
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        activity: {
          select: {
            name: true,
          },
        },
        interventionArea: {
          select: {
            villageName: true,
            blockName: true,
            district: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
} 