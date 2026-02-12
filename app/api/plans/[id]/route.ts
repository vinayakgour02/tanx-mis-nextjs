import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'


export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ REQUIRED in Next 15

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID missing from route params" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { interventionAreaId, monthlyTargets } = body;

    if (!interventionAreaId || !monthlyTargets) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
        finalLocation = [
          area.villageName?.name,
          area.gramPanchayat?.name,
          area.blockName?.name,
          area.district?.name,
          area.state?.name
        ].filter(Boolean).join(', ');
      }
    }

    const organizationId = session.user.organizationId;

    // Verify the plan belongs to the user's organization
    const existingPlan = await prisma.plan.findFirst({
      where: {
        id,
        organizationId
      }
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        interventionAreaId,
        monthlyTargets,
        location: finalLocation,
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
      }
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
          action: "UPDATE",
          resource: "Plan",
          resourceId: updatedPlan.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error("Audit log error", err);
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Failed to update plan:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    const plan = await prisma.plan.findFirst({
      where: {
        id,
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
      }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}