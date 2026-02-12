import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get("objectiveId");

    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }



    const indicators = await prisma.indicator.findMany({
      where: {
        objectiveId: objectiveId
      },
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
      orderBy: {
        name: 'asc',
      },
    });


    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Error fetching filtered indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered indicators" },
      { status: 500 }
    );
  }
}