import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = context.params;
    const data = await request.json();

    const session = await getServerSession(authOptions);
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.organizationIndicator.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.organizationIndicator.update({
      where: { id },
      data: {
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
        objectiveId: data.objectiveId ?? null,
      },
    });

    
    try{
      // Capture request metadata for audit log
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
      const realIp = request.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = request.headers.get('user-agent') || undefined;
  
      await prisma.auditLog.create({
        data: {
          organizationId: session?.user.organizationId || '',
          userId: session?.user.id ?? undefined,
          action: 'Update',
          resource: 'Indicator',
          resourceId: updated.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
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