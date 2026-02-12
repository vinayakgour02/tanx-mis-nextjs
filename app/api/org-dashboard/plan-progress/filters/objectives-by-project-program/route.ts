import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/org-dashboard/plan-progress/filters/objectives-by-project-program - Get objectives for a specific project under a program
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
    const projectId = searchParams.get('projectId');

    if (!programId || !projectId) {
      return NextResponse.json([]);
    }

    // Verify that the project belongs to the program
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        programs: {
          some: {
            id: programId
          }
        }
      }
    });
    console.log('project', project);

    if (!project) {
      return NextResponse.json([]);
    }

    // Get objectives from the selected project that have activities
    const objectives = await prisma.objective.findMany({
      where: {
        // organizationId,
        projectId: projectId,
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
    console.error('[OBJECTIVES_BY_PROJECT_PROGRAM_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}