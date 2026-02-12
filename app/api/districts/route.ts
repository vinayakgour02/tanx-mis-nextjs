import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/districts - Get all districts for the organization, optionally filtered by state
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stateId = searchParams.get('stateId');

    const whereClause: any = {
      organizationId: session.user.organizationId,
    };

    if (stateId) {
      whereClause.stateId = stateId;
    }

    const districts = await prisma.district.findMany({
      where: whereClause,
      include: {
        state: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            block: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(districts);
  } catch (error) {
    console.error('[DISTRICTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/districts - Create a new district
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { name, stateId } = json;

    if (!name || !stateId) {
      return new NextResponse('District name and state ID are required', { status: 400 });
    }

    // Verify state exists and belongs to the organization
    const state = await prisma.state.findFirst({
      where: {
        id: stateId,
        organizationId: session.user.organizationId,
      },
    });

    if (!state) {
      return new NextResponse('State not found', { status: 404 });
    }

    // Check if district already exists for this state and organization
    const existingDistrict = await prisma.district.findFirst({
      where: {
        name: name,
        stateId: stateId,
        organizationId: session.user.organizationId,
      },
    });

    if (existingDistrict) {
      return new NextResponse('District already exists in this state', { status: 400 });
    }

    const district = await prisma.district.create({
      data: {
        name: name,
        stateId: stateId,
        organizationId: session.user.organizationId,
      },
      include: {
        state: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            block: true,
          },
        },
      },
    });

    // Audit log
    try {
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: 'CREATE',
          resource: 'District',
          resourceId: district.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating audit log", error);
    }

    return NextResponse.json(district);
  } catch (error) {
    console.error('[DISTRICTS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}