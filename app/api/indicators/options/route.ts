import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = searchParams.get("type");
    const projectId = searchParams.get("projectId");
    const programId = searchParams.get("programId");
    const organizationId = session.user.organizationId;
    switch (type) {
      case "projects": {
        const projects = await prisma.project.findMany({
          where: { organizationId },
          select: { id: true, name: true, code: true },
        });
        return NextResponse.json(projects);
      }

      case "programs": {
        const programs = await prisma.program.findMany({
          where: { organizationId },
          select: { id: true, name: true },
        });
        return NextResponse.json(programs);
      }

      case "objectives": {
        // Fetch organization-level objectives if no projectId or programId
        let whereClause: any = {};

        if (programId) {
          whereClause = { programId };
        } else if (projectId) {
          whereClause = { projectId };
        } else {
          // Default: filter by organization
          whereClause = { organizationId };
        }


        const objectives = await prisma.objective.findMany({
          where: whereClause,
          select: {
            id: true,
            description: true,
            code: true,
          },
        });

        return NextResponse.json(objectives);
      }

      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching options:", error);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}
