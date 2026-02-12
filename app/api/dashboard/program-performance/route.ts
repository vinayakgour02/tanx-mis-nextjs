import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {

    // Fetch only programs that have at least one Training report
    const programs = await prisma.program.findMany({
      where: {
        organizationId: session.user.organizationId,
        reports: {
          some: {
            type: "Training",
          },
        },
      },
      select: {
        id: true,
        name: true,
        reports: {
          where: { type: "Training" }, // only include Training reports
          select: {
            unitReported: true,
            activity: {
              select: {
                targetUnit: true,
              },
            },
          },
        },
      },
    });


    // Aggregate target and reported per program
    const data = programs.map((program) => {
      const totalTarget = program.reports.reduce(
        (sum, report) => sum + (report.activity?.targetUnit || 0),
        0
      );

      const totalReported = program.reports.reduce(
        (sum, report) => sum + (report.unitReported || 0),
        0
      );

      return {
        programId: program.id,
        programName: program.name,
        target: totalTarget,
        reported: totalReported,
      };
    });


    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching program performance:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
