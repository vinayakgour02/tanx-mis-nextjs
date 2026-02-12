import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/blocks - Get all blocks for the organization, optionally filtered by district
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');

    const whereClause: any = {
      organizationId: session.user.organizationId,
    };

    if (districtId) {
      whereClause.districtId = districtId;
    }

    const blocks = await prisma.block.findMany({
      where: whereClause,
      include: {
        district: {
          select: {
            name: true,
            state: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            grampanchaya: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(blocks);
  } catch (error) {
    console.error('[BLOCKS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/blocks - Create a new block
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { name, districtId, areaType } = json;

    if (!name || !districtId || !areaType) {
      return new NextResponse('Block name, district ID, and area type are required', { status: 400 });
    }

    // Verify district exists and belongs to the organization
    const district = await prisma.district.findFirst({
      where: {
        id: districtId,
        organizationId: session.user.organizationId,
      },
    });

    if (!district) {
      return new NextResponse('District not found', { status: 404 });
    }

    // Check if block already exists for this district and organization
    const existingBlock = await prisma.block.findFirst({
      where: {
        name: name,
        districtId: districtId,
        organizationId: session.user.organizationId,
      },
    });

    if (existingBlock) {
      return new NextResponse('Block already exists in this district', { status: 400 });
    }

    const block = await prisma.block.create({
      data: {
        name: name,
        districtId: districtId,
        areaType: areaType,
        organizationId: session.user.organizationId,
      },
      include: {
        district: {
          select: {
            name: true,
            state: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            grampanchaya: true,
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
          resource: 'Block',
          resourceId: block.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating audit log", error);
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error('[BLOCKS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}