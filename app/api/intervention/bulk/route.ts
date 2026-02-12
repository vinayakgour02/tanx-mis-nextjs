import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { interventions } = body;

    if (!Array.isArray(interventions) || interventions.length === 0) {
      return NextResponse.json({ error: "No interventions provided" }, { status: 400 });
    }

    const results = [];
    const errors: any[] = [];

    // 1. Collect all unique objectiveId + programId combinations
    const objectiveProgramMap: Record<string, string[]> = {};
    for (const item of interventions) {
      if (!objectiveProgramMap[item.objectiveId]) objectiveProgramMap[item.objectiveId] = [];
      if (!objectiveProgramMap[item.objectiveId].includes(item.programId)) {
        objectiveProgramMap[item.objectiveId].push(item.programId);
      }
    }

    // 2. Fetch all existing interventions for these objectives+programs
    const existingInterventions = await prisma.intervention.findMany({
      where: {
        OR: Object.entries(objectiveProgramMap).flatMap(([objectiveId, programIds]) =>
          programIds.map(programId => ({
            objectiveId,
            programs: { some: { id: programId } },
          }))
        ),
      },
      include: { SubIntervention: true, programs: true },
    });

    // 3. Build lookup maps
    const interventionMap: Record<string, any> = {}; // key = objectiveId + programId + name
    existingInterventions.forEach(i => {
      i.programs.forEach(p => {
        const key = `${i.objectiveId}_${p.id}_${i.name}`;
        interventionMap[key] = i;
      });
    });

    for (const [index, item] of interventions.entries()) {
      try {
        const { name, objectiveId, programId, subInterventions } = item;
        const key = `${objectiveId}_${programId}_${name}`;

        let interventionId: string;

        // 4. Check if intervention exists
        let intervention = interventionMap[key];
        if (!intervention) {
          // Create new intervention
          intervention = await prisma.intervention.create({
            data: {
              name,
              objectiveId,
              organizationId: session.user.organizationId || undefined,
              programs: { connect: { id: programId } },
            },
            include: { SubIntervention: true },
          });
          interventionMap[key] = intervention;
        }
        interventionId = intervention.id;

        // 5. Handle sub-interventions
        const existingSubNames = new Set(intervention.SubIntervention.map((si: any) => si.name));

        for (const si of subInterventions || []) {
          if (existingSubNames.has(si.name)) continue; // skip duplicate

          if (si.indicators?.length > 0) {
            for (const ind of si.indicators) {
              const indicatorExists = await prisma.indicator.findUnique({ where: { id: ind.id } });
              if (!indicatorExists) {
                errors.push({ row: index + 2, reason: `Indicator ${ind.id} does not exist` });
                continue;
              }
              await prisma.subIntervention.create({
                data: {
                  name: si.name,
                  interventionId,
                  indicatorId: ind.id,
                },
              });
            }
          } else {
            await prisma.subIntervention.create({
              data: {
                name: si.name,
                interventionId,
              },
            });
          }
        }

        results.push({ name, interventionId });
      } catch (err: any) {
        console.error("Failed to process row:", item, err);
        errors.push({ row: index + 2, reason: err.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      message: "Bulk upload finished",
      successCount: results.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
