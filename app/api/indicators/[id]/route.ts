import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // ✅ FIX
    const data = await request.json();

    const session = await getServerSession(authOptions);
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.indicator.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: any = {
      name: data.name,
      type: data.type,
      level: data.level,
      definition: data.definition,
      rationale: data.rationale,
      dataSource: data.dataSource,
      frequency: data.frequency,
      unitOfMeasure: data.unitOfMeasure,
      disaggregateBy: data.disaggregateBy,
      baselineValue: data.baselineValue,
      target: data.target,
    };

    if ("projectId" in data) updateData.projectId = data.projectId;
    if ("programId" in data) updateData.programId = data.programId;
    if ("objectiveId" in data) updateData.objectiveId = data.objectiveId;
    if ("orgIndicatorId" in data) updateData.orgIndicatorId = data.orgIndicatorId;

    const updated = await prisma.indicator.update({
      where: { id },
      data: updateData,
    });

    // Audit log (safe)
    try {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: session?.user.id ?? undefined,
          action: "UPDATE",
          resource: "Indicator",
          resourceId: updated.id,
          ipAddress:
            request.headers.get("x-forwarded-for")?.split(",")[0] ??
            request.headers.get("x-real-ip") ??
            undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          timestamp: new Date(),
        },
      });
    } catch {
      console.error("Error Indicator Log");
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating indicator:", error);
    return NextResponse.json(
      { error: "Failed to update indicator" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params; // ✅ FIX

    const session = await getServerSession(authOptions);
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure indicator belongs to org
    const existing = await prisma.indicator.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Indicator not found" },
        { status: 404 }
      );
    }

    await prisma.indicator.delete({
      where: { id },
    });

    // Audit log (non-blocking)
    try {
      const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
      const realIp = request.headers.get("x-real-ip") ?? "";
      const ipAddress =
        forwardedFor.split(",")[0]?.trim() || realIp || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: session?.user.id ?? undefined,
          action: "DELETE",
          resource: "Indicator",
          resourceId: id,
          ipAddress,
          userAgent: request.headers.get("user-agent") ?? undefined,
          timestamp: new Date(),
        },
      });
    } catch {
      console.error("Error creating audit log");
    }

    return NextResponse.json({
      message: "Indicator deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting indicator:", error);
    return NextResponse.json(
      { error: "Failed to delete indicator" },
      { status: 500 }
    );
  }
}
