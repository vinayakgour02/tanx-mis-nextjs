import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const programId = searchParams.get("programId");

    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build where clause based on parameters
    let whereClause: any = {
      organizationId: session.user.organizationId,
      programId: { not: null }, // Ensures only indicators linked to a program
    };

    // If specific programId is provided, filter by it
    if (programId) {
      whereClause.programId = programId;
    }

    const indicators = await prisma.indicator.findMany({
      where: whereClause,
      include: {
        project: {
          select: { name: true, code: true },
        },
        program: {
          select: { name: true },
        },
        objective: {
          select: { description: true, code: true },
        },
      },
    });

    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Error fetching program indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch program indicators" },
      { status: 500 }
    );
  }
}
