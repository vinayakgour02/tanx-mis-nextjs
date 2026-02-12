import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions";

export async function GET(
  request: Request,
  { params }: 
  Readonly<{
       params: { projectId: string }
   }>
) {
  try {
    const param = await params
    const { projectId } = param
    const { searchParams } = new URL(request.url)
    const interventionId = searchParams.get('interventionId')
    const subInterventionId = searchParams.get('subInterventionId')

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build where clause based on filters
    const whereClause: any = {
      projectId: projectId,
      organizationId: session.user.organizationId,
      // status: "ACTIVE",
    }

    if (interventionId) {
      whereClause.interventionId = interventionId
    }

    if (subInterventionId) {
      whereClause.subInterventionId = subInterventionId
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        unitOfMeasure: true,
        startDate: true,
        endDate: true,
        targetUnit: true,
        Intervention: {
          select: {
            id: true,
            name: true,
          }
        },
        subInterventionRel: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    )
  }
} 