import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      objectiveId,
      indicatorId,
      name,
      description,
      interventionId,
      subInterventionId,
      startDate,
      endDate,
      unitOfMeasure,
      targetUnit,
      costPerUnit,
      totalBudget,
      leverage,
      activityType, // ✅ array of program IDs
      levelofIntervention
    } = body;

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Find the intervention (must exist)
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true, activityType: true },
    });

    if (!intervention) {
      return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
    }

    // ✅ Create activity
    const activity = await prisma.activity.create({
      data: {
        name,
        description,
        type: activityType,
        levelofIntervention,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "PLANNED",
        unitOfMeasure,
        targetUnit,
        costPerUnit,
        totalBudget,
        leverage,

        // ✅ Relations (CONNECT)
        project: projectId
          ? { connect: { id: projectId } }
          : undefined,

        objective: objectiveId
          ? { connect: { id: objectiveId } }
          : undefined,

        indicator: indicatorId
          ? { connect: { id: indicatorId } }
          : undefined,

        Organization: {
          connect: { id: session.user.organizationId },
        },

        Intervention: interventionId
          ? { connect: { id: interventionId } }
          : undefined,

        subInterventionRel: subInterventionId
          ? { connect: { id: subInterventionId } }
          : undefined,
      },
    });


    // Audit log
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const realIp = request.headers.get("x-real-ip") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || realIp || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id ?? undefined,
        action: "CREATE",
        resource: "Activity",
        resourceId: activity.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: {
        project: {
          organizationId: session.user.organizationId
        }
      },
      include: {
        objective: true,
        indicator: true,
        Intervention: true,

        subInterventionRel: true,
        project: {
          select: {
            name: true,
            organizationId: true
          }
        }
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      activityId,
      projectId,
      objectiveId,
      indicatorId,
      name,
      description,
      interventionId,
      subInterventionId,
      startDate,
      endDate,
      LevelOfIntervention,
      unitOfMeasure,
      targetUnit,
      costPerUnit,
      totalBudget,
      leverage,
      programIds, // ✅ array of program IDs
    } = body;

    if (!activityId) {
      return NextResponse.json({ error: "Activity ID is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Get intervention type
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true, activityType: true },
    });

    if (!intervention) {
      return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
    }

    // ✅ Update activity
    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        projectId,
        objectiveId,
        indicatorId,
        name,
        description,
        type: intervention.activityType ?? "",// ✅ overwrite with intervention type
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        unitOfMeasure,
        LevelOfIntervention,
        targetUnit,
        costPerUnit,
        totalBudget,
        leverage,
        interventionId,
        subInterventionId,
        programs: programIds
          ? {
            set: programIds.map((id: string) => ({ id })), // ✅ reset and connect new programs
          }
          : undefined,
      },
    });

    // Audit log
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const realIp = request.headers.get("x-real-ip") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || realIp || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id ?? undefined,
        action: "UPDATE",
        resource: "Activity",
        resourceId: activity.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}
