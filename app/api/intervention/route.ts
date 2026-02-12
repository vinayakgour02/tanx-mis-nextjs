// app/api/intervention/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

// CREATE Intervention + optional SubInterventions
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, objectiveId, programId, subInterventions } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const subInterventionData: any[] = Array.isArray(subInterventions) ? subInterventions : [];

    // Flatten subInterventions to create one SubIntervention per indicator
    const createSubInterventions = subInterventionData.flatMap((si: any) => {
      if (si.indicators && si.indicators.length > 0) {
        return si.indicators.map((ind: any) => ({
          name: si.name,
          description: si.description ?? null,
          indicatorId: ind.id,
        }));
      } else {
        return [{ name: si.name, description: si.description ?? null }];
      }
    });
    const organizationId = session.user.organizationId; // Moved this line inside the function

    const intervention = await prisma.intervention.create({
      data: {
        name,
        objectiveId,
        organizationId,
        programs: {
          connect: { id: programId },
        },
        SubIntervention: createSubInterventions.length
          ? {
              create: createSubInterventions,
            }
          : undefined,
      },
      include: {
        programs: true,
        SubIntervention: {
          include: { Indicator: true },
        },
      },
    });

    return NextResponse.json(intervention, { status: 201 });
  } catch (error: any) {
    console.error("Error creating intervention:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}



// GET all Interventions with relations
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const interventions = await prisma.intervention.findMany({
          where:{
            organizationId: session.user.organizationId,
          },
            include: {
                programs: true,
                SubIntervention: {
                  include:{
                    Indicator: true
                  }
                },
                objective: true,
                indicator: true,
            },
        });

        return NextResponse.json(interventions);
    } catch (error: any) {
        console.error("Error fetching interventions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
