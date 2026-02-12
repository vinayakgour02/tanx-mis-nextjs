import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/utils/authOptions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get organization ID from membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return new NextResponse('No active organization membership found', { status: 404 });
    }

    // Build where clause based on projectId filter
    const organizationId = (session.user as any).organizationId as string | undefined;
    if (!organizationId) {
      return new NextResponse('Organization not found', { status: 404 });
    }
    const whereClause = projectId 
      ? {
          projectId,
          project: {
            organizationId,
          },
        }
      : {
          OR: [
            { organizationId },
            {
              project: {
                organizationId,
              },
            },
            {
              program: {
                organizationId,
              },
            },
          ],
        };

    // Fetch objectives with their indicators
    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        indicators: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('[OBJECTIVES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const organizationId = (session.user as any).organizationId as string | undefined;
    if (!organizationId) {
      return new NextResponse('Organization not found', { status: 404 });
    }
 
    const body = await request.json();
    const { projectId, code, level, description, orderIndex } = body;
 
    // Validate required fields
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }
 
    if (!level || !description) {
      return new NextResponse('Level and description are required', { status: 400 });
    }
 
    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
    });
 
    if (!project) {
      return new NextResponse('Project not found or access denied', { status: 404 });
    }
 
    // Get the next order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const lastObjective = await prisma.objective.findFirst({
        where: { projectId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      finalOrderIndex = (lastObjective?.orderIndex ?? -1) + 1;
    }
 
    // Generate code if not provided
    let finalCode = code;
    if (!finalCode) {
      const projectCode = project.code || 'PROJ';
      const objectiveCount = await prisma.objective.count({
        where: { projectId },
      });
      finalCode = `${projectCode}-OBJ-${(objectiveCount + 1).toString().padStart(3, '0')}`;
    }
 
    // Create the objective
    const objective = await prisma.objective.create({
      data: {
        projectId,
        code: finalCode,
        level,
        description,
        orderIndex: finalOrderIndex,
      },
      include: {
        indicators: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'CREATE',
          resource: 'Objective',
          resourceId: objective.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }
 
    return NextResponse.json(objective);
  } catch (error) {
    console.error('[OBJECTIVES_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 