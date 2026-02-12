import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/utils/authOptions';

// GET /api/objectives/[id] - Get a specific objective
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const objective = await prisma.objective.findFirst({
      where: {
        id,
        OR: [
          { organizationId: membership.organizationId },
          {
            project: {
              organizationId: membership.organizationId,
            },
          },
          {
            program: {
              organizationId: membership.organizationId,
            },
          },
        ],
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

    if (!objective) {
      return new NextResponse('Objective not found', { status: 404 });
    }

    return NextResponse.json(objective);
  } catch (error) {
    console.error('[OBJECTIVE_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/objectives/[id] - Update a specific objective
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await req.json();
    const { code, level, description, orderIndex } = body;

    // Validate required fields
    if (!level || !description) {
      return new NextResponse('Level and description are required', { status: 400 });
    }

    // Check if objective exists and user has access
    const existingObjective = await prisma.objective.findFirst({
      where: {
        id,
        OR: [
          { organizationId: membership.organizationId },
          {
            project: {
              organizationId: membership.organizationId,
            },
          },
          {
            program: {
              organizationId: membership.organizationId,
            },
          },
        ],
      },
    });

    if (!existingObjective) {
      return new NextResponse('Objective not found or access denied', { status: 404 });
    }

    // Update the objective
    const updatedObjective = await prisma.objective.update({
      where: { id },
      data: {
        code,
        level,
        description,
        orderIndex,
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
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;
  
      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'Update',
          resource: 'Objective',
          resourceId: updatedObjective.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(updatedObjective);
  } catch (error) {
    console.error('[OBJECTIVE_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/objectives/[id] - Delete a specific objective
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if objective exists and user has access
    const existingObjective = await prisma.objective.findFirst({
      where: {
        id,
        OR: [
          { organizationId: membership.organizationId },
          {
            project: {
              organizationId: membership.organizationId,
            },
          },
          {
            program: {
              organizationId: membership.organizationId,
            },
          },
        ],
      },
    });

    if (!existingObjective) {
      return new NextResponse('Objective not found or access denied', { status: 404 });
    }

    // Delete the objective (cascade will handle related records)
    await prisma.objective.delete({
      where: { id },
    });

    try{
      // Capture request metadata for audit log
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;
  
      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'Delete',
          resource: 'objective',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[OBJECTIVE_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 