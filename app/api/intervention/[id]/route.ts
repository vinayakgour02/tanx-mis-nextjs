import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

// DELETE Intervention by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // First delete related SubInterventions (if needed)
    await prisma.subIntervention.deleteMany({
      where: { interventionId: id },
    });

    // Then delete the Intervention itself
    const deletedIntervention = await prisma.intervention.delete({
      where: { id },
    });

    return NextResponse.json(deletedIntervention, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting intervention:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Await params
    const { id } = await context.params;

    const body = await req.json();
    const { name, objectiveId, programId, subInterventions } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Intervention ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const subInterventionData = Array.isArray(subInterventions)
      ? subInterventions
      : [];

    // 1️⃣ Update main intervention
    await prisma.intervention.update({
      where: { id },
      data: {
        name,
        objectiveId,
        programs: { connect: { id: programId } },
      },
    });

    // 2️⃣ Delete existing sub-interventions
    await prisma.subIntervention.deleteMany({
      where: { interventionId: id },
    });

    // 3️⃣ Flatten sub-interventions
    const createSubInterventions = subInterventionData.flatMap((si: any) => {
      if (si.indicators?.length) {
        return si.indicators.map((ind: any) => ({
          name: si.name,
          description: si.description ?? null,
          indicatorId: ind.id,
          interventionId: id,
        }));
      }

      return [
        {
          name: si.name,
          description: si.description ?? null,
          interventionId: id,
        },
      ];
    });

    // 4️⃣ Create new sub-interventions
    if (createSubInterventions.length) {
      await prisma.subIntervention.createMany({
        data: createSubInterventions,
      });
    }

    // 5️⃣ Refetch updated intervention
    const updatedIntervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        programs: true,
        SubIntervention: {
          include: { Indicator: true },
        },
      },
    });

    return NextResponse.json(updatedIntervention, { status: 200 });
  } catch (error) {
    console.error("Error updating intervention:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
