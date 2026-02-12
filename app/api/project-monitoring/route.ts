import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch indicators for the specific project
    const indicators = await prisma.indicator.findMany({
      where: {
        organizationId: session.user.organizationId,
        projectId: projectId,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        program: {
          select: {
            name: true,
          },
        },
        objective: {
          select: {
            description: true,
          },
        },
      },
    });

    // Calculate achieved targets from reports
    const monitoringData = await Promise.all(
      indicators.map(async (indicator) => {
        // Get total target value (parse from string)
        let targetValue = 0;
        if (indicator.target) {
          try {
            targetValue = parseFloat(indicator.target) || 0;
          } catch (e) {
            targetValue = 0;
          }
        }

        // Calculate achieved value from reports
        const reports = await prisma.report.findMany({
          where: {
            organizationId: session.user.organizationId,
            activity: {
              indicatorId: indicator.id,
            },
          },
        });

        // Sum up all reported values
        let achievedValue = 0;
        reports.forEach((report) => {
          if (report.unitReported) {
            achievedValue += report.unitReported;
          }
        });

        // Calculate RAG rating
        let ragRating = "gray"; // Default for no target/progress
        if (targetValue > 0) {
          const percentage = (achievedValue / targetValue) * 100;
          if (percentage >= 75) {
            ragRating = "green";
          } else if (percentage >= 25) {
            ragRating = "amber";
          } else {
            ragRating = "red";
          }
        }

        return {
          id: indicator.id,
          name: indicator.name,
          type: indicator.type,
          target: targetValue,
          achieved: achievedValue,
          ragRating: ragRating,
          level: indicator.level,
        };
      })
    );

    return NextResponse.json(monitoringData);
  } catch (error) {
    console.error("Error fetching project monitoring data:", error);
    return NextResponse.json(
      { error: "Failed to fetch project monitoring data" },
      { status: 500 }
    );
  }
}