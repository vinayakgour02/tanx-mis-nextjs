import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/org-dashboard/plan-progress/filters - Get filtered options based on selections
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = session.user.organizationId;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const programId = searchParams.get('programId');

    const result: any = {};

    // If programId is provided, filter projects by that program
    if (programId) {
      // Get projects that belong to the selected program
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
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      
      result.projects = programProjects;
      
      // If projectId is also provided, filter objectives by that project
      // Otherwise, get objectives from all projects under the selected program
      let objectiveWhere: any = {
        organizationId,
      };
      
      if (projectId) {
        // Show objectives only from the selected project
        objectiveWhere.projectId = projectId;
      } else {
        // Show objectives from all projects under the selected program
        objectiveWhere.projectId = {
          in: programProjects.map(project => project.id)
        };
      }
      
      const programObjectives = await prisma.objective.findMany({
        where: {
          ...objectiveWhere,
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
      
      result.objectives = programObjectives;
    } else {
      // If no program selected, return all projects and objectives for the organization
      const allProjects = await prisma.project.findMany({
        where: {
          organizationId,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      
      result.projects = allProjects;
      
      // Get all objectives for the organization (not tied to specific projects or programs) that have activities
      const allObjectives = await prisma.objective.findMany({
        where: {
          organizationId,
          projectId: null,
          programId: null,
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
      
      result.objectives = allObjectives;
    }

    // Donors are not filtered by program/project in this implementation
    const donors = await prisma.donor.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    result.donors = donors;

    // Programs are not filtered
    const programs = await prisma.program.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    result.programs = programs;

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PLAN_PROGRESS_FILTERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}