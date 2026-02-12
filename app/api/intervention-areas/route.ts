import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/intervention-areas - Get intervention areas for a project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    const interventionAreas = await prisma.interventionArea.findMany({
      where: {
        projectId,
      },
      include: {
        state: {
          select: {
            name: true,
          },
        },
        district: {
          select: {
            name: true,
          },
        },
        blockName: {
          select: {
            name: true,
          },
        },
        gramPanchayat: {
          select: {
            name: true,
          },
        },
        villageName: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        serialNumber: 'asc',
      },
    });

    return NextResponse.json(interventionAreas);
  } catch (error) {
    console.error('[INTERVENTION_AREAS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/intervention-areas - Create a new intervention area
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const session = await getServerSession(authOptions)
    // Get the latest serial number for the project
    const latestArea = await prisma.interventionArea.findFirst({
      where: {
        projectId: json.projectId,
      },
      orderBy: {
        serialNumber: 'desc',
      },
    });

    const newSerialNumber = (latestArea?.serialNumber || 0) + 1;

    const interventionArea = await prisma.interventionArea.create({
      data: {
        ...json,
        serialNumber: newSerialNumber,
        date: new Date(),
      },
      include: {
        state: {
          select: {
            name: true,
          },
        },
        district: {
          select: {
            name: true,
          },
        },
        blockName: {
          select: {
            name: true,
          },
        },
        gramPanchayat: {
          select: {
            name: true,
          },
        },
        villageName: {
          select: {
            name: true,
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
          action: 'CREATE',
          resource: 'Intervention-area',
          resourceId: interventionArea.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(interventionArea);
  } catch (error) {
    console.error('[INTERVENTION_AREAS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/intervention-areas - Delete an intervention area
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Intervention area ID is required', { status: 400 });
    }

    // Check if intervention area exists
    const existingArea = await prisma.interventionArea.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!existingArea) {
      return new NextResponse('Intervention area not found', { status: 404 });
    }

    // Check if user has permission (same organization)
    if (existingArea.project?.organizationId !== session.user.organizationId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete the intervention area
    await prisma.interventionArea.delete({
      where: { id },
    });

    // Audit log
    try {
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId || '',
          userId: session.user.id,
          action: 'DELETE',
          resource: 'Intervention-area',
          resourceId: id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating audit log', error);
    }

    return new NextResponse('Intervention area deleted successfully', { status: 200 });
  } catch (error) {
    console.error('[INTERVENTION_AREAS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 