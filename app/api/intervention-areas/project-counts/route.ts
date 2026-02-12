import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/intervention-areas/project-counts - Get project counts by state and district
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get project counts by state
    const stateProjectCounts = await prisma.state.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        InterventionArea: {
          select: {
            projectId: true,
          },
          where: {
            projectId: { not: null }
          }
        }
      }
    });

    // Process state data to get unique project counts
    const stateCounts = stateProjectCounts.map(state => {
      const projectIds = new Set(state.InterventionArea.map(area => area.projectId));
      return {
        id: state.id,
        name: state.name,
        projectCount: projectIds.size
      };
    });

    // Get project counts by district
    const districtProjectCounts = await prisma.district.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        stateId: true,
        InterventionArea: {
          select: {
            projectId: true,
          },
          where: {
            projectId: { not: null }
          }
        }
      }
    });

    // Process district data to get unique project counts
    const districtCounts = districtProjectCounts.map(district => {
      const projectIds = new Set(district.InterventionArea.map(area => area.projectId));
      return {
        id: district.id,
        name: district.name,
        stateId: district.stateId,
        projectCount: projectIds.size
      };
    });

    return NextResponse.json({
      states: stateCounts,
      districts: districtCounts
    });
  } catch (error) {
    console.error('[INTERVENTION_AREA_PROJECT_COUNTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}