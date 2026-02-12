import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/org-dashboard/plan-progress/filters/objectives-by-program - Get objectives for all projects under a program
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json([]);
    }

    // Get all projects under the selected program
    const programProjects = await prisma.project.findMany({
      where: {
        organizationId,
        programs: {
          some: {
            id: programId
          }
        }
      },
      select: {
        id: true
      }
    });

    const projectIds = programProjects.map(project => project.id);
    // Get objectives from all projects under the selected program that have activities
    const objectives = await prisma.objective.findMany({
      where: {
        // organizationId,
        projectId: {
          in: projectIds
        },
        activities: {
          some: {
            id: { not: undefined }
          }
        }
      },
      select: {
        id: true,
        description: true,
        code: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(objectives);
  } catch (error) {
    console.error('[OBJECTIVES_BY_PROGRAM_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}