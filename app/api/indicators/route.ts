import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const session = await getServerSession(authOptions);    

    // Create the indicator
    const indicator = await prisma.indicator.create({
      data: {
        organizationId: session?.user.organizationId,
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
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.programId && { programId: data.programId }),
        ...(data.objectiveId && { objectiveId: data.objectiveId }),
        ...(data.orgIndicatorId && { orgIndicatorId: data.orgIndicatorId }),
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
           action: 'CREATE',
           resource: 'Indicator',
           resourceId: indicator.id,
           ipAddress,
          timestamp: new Date(),
           userAgent,
         },
       });
    }catch(error){
      console.error("Error Indicator Log")
    }

    return NextResponse.json(indicator);
  } catch (error) {
    console.error("Error creating indicator:", error);
    return NextResponse.json(
      { error: "Failed to create indicator" },
      { status: 500 }
    );
  }
}

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

    // Build where clause based on projectId parameter
    let whereClause: any = {
      organizationId: session.user.organizationId,
    };

    if (projectId) {
      // Fetch indicators for a specific project
      whereClause.projectId = projectId;
    } else {
      // Fetch organization-level indicators (original behavior)
      whereClause.projectId = null;
      whereClause.programId = null;
    }


    const indicators = await prisma.indicator.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            name: true,
            code: true,
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
            code: true,
          },
        },
      },
    });
    
    return NextResponse.json(indicators);
  } catch (error) {
    console.error("Error fetching indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch indicators" },
      { status: 500 }
    );
  }
} 