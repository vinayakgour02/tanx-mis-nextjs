import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/gramPanchayats - Get all gram panchayats for the organization, optionally filtered by block
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId');

    const whereClause: any = {
      organizationId: session.user.organizationId,
    };

    if (blockId) {
      whereClause.blockId = blockId;
    }

    const gramPanchayats = await prisma.gramPanchayat.findMany({
      where: whereClause,
      include: {
        block: {
          select: {
            name: true,
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
          },
        },
        _count: {
          select: {
            village: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(gramPanchayats);
  } catch (error) {
    console.error('[GRAM_PANCHAYATS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/gramPanchayats - Create a new gram panchayat
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { name, blockId } = json;

    if (!name || !blockId) {
      return new NextResponse('Gram Panchayat name and block ID are required', { status: 400 });
    }

    // Verify block exists and belongs to the organization
    const block = await prisma.block.findFirst({
      where: {
        id: blockId,
        organizationId: session.user.organizationId,
      },
    });

    if (!block) {
      return new NextResponse('Block not found', { status: 404 });
    }

    // Check if gram panchayat already exists for this block and organization
    const existingGramPanchayat = await prisma.gramPanchayat.findFirst({
      where: {
        name: name,
        blockId: blockId,
        organizationId: session.user.organizationId,
      },
    });

    if (existingGramPanchayat) {
      return new NextResponse('Gram Panchayat already exists in this block', { status: 400 });
    }

    const gramPanchayat = await prisma.gramPanchayat.create({
      data: {
        name: name,
        blockId: blockId,
        organizationId: session.user.organizationId,
      },
      include: {
        block: {
          select: {
            name: true,
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
          },
        },
        _count: {
          select: {
            village: true,
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
          resource: 'GramPanchayat',
          resourceId: gramPanchayat.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating audit log", error);
    }

    return NextResponse.json(gramPanchayat);
  } catch (error) {
    console.error('[GRAM_PANCHAYATS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}