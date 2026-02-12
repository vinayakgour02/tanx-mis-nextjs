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

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get unique interventions for activities in this project
    const activities = await prisma.activity.findMany({
      where: {
        projectId: projectId,
        organizationId: session.user.organizationId,
        interventionId: {
          not: null
        }
      },
      select: {
        Intervention: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    })

    // Extract unique interventions
    const interventionMap = new Map()
    activities.forEach(activity => {
      if (activity.Intervention) {
        interventionMap.set(activity.Intervention.id, activity.Intervention)
      }
    })

    const interventions = Array.from(interventionMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    return NextResponse.json(interventions)
  } catch (error) {
    console.error("Failed to fetch interventions:", error)
    return NextResponse.json(
      { error: "Failed to fetch interventions" },
      { status: 500 }
    )
  }
}