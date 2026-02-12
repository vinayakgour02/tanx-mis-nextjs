import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions";

export async function GET(
  request: Request,
  { params }: 
  Readonly<{
       params: { projectId: string, interventionId: string }
   }>
) {
  try {
    const param = await params
    const { projectId, interventionId } = param

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get unique sub-interventions for activities in this project with this intervention
    const activities = await prisma.activity.findMany({
      where: {
        projectId: projectId,
        interventionId: interventionId,
        organizationId: session.user.organizationId,
        subInterventionId: {
          not: null
        }
      },
      select: {
        subInterventionRel: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    })

    // Extract unique sub-interventions
    const subInterventionMap = new Map()
    activities.forEach(activity => {
      if (activity.subInterventionRel) {
        subInterventionMap.set(activity.subInterventionRel.id, activity.subInterventionRel)
      }
    })

    const subInterventions = Array.from(subInterventionMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    return NextResponse.json(subInterventions)
  } catch (error) {
    console.error("Failed to fetch sub-interventions:", error)
    return NextResponse.json(
      { error: "Failed to fetch sub-interventions" },
      { status: 500 }
    )
  }
}