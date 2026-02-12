// app/api/dashboard/project-performance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function GET() {
    const session = await getServerSession(authOptions)
    try {
        const projects = await prisma.project.findMany({
            where: {
                organizationId: session?.user.organizationId
            },
            select: {
                id: true,
                name: true,
                activities: {
                    where: { type: "Training" },
                    select: {
                        targetUnit: true,
                        reports: {
                            select: {
                                unitReported: true,
                            },
                        },
                    },
                },
            },
        });

        // Aggregate data
        const data = projects.map((project) => {
            const totalTarget =
                project.activities.reduce(
                    (sum, act) => sum + (act.targetUnit || 0),
                    0
                ) || 0;

            const totalReported =
                project.activities.reduce(
                    (sum, act) =>
                        sum +
                        act.reports.reduce(
                            (rSum, rep) => rSum + (rep.unitReported || 0),
                            0
                        ),
                    0
                ) || 0;

            return {
                projectId: project.id,
                projectName: project.name,
                target: totalTarget,
                reported: totalReported,
            };
        });

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Error fetching project performance:", error);
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
