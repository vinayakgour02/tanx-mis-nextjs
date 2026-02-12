import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/villages - Get all villages for the organization, optionally filtered by gram panchayat
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const gramPanchayatId = searchParams.get('gramPanchayatId');

    const whereClause: any = {};

    if (gramPanchayatId) {
      whereClause.gramPanchayatId = gramPanchayatId;
    }

    // For villages, we need to filter by organization through the hierarchy
    const villages = await prisma.village.findMany({
      where: {
        ...whereClause,
        gramPanchayat: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        gramPanchayat: {
          select: {
            name: true,
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
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(villages);
  } catch (error) {
    console.error('[VILLAGES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/villages - Create a new village
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { name, gramPanchayatId } = json;

    if (!name || !gramPanchayatId) {
      return new NextResponse('Village name and gram panchayat ID are required', { status: 400 });
    }

    // Verify gram panchayat exists and belongs to the organization
    const gramPanchayat = await prisma.gramPanchayat.findFirst({
      where: {
        id: gramPanchayatId,
        organizationId: session.user.organizationId,
      },
    });

    if (!gramPanchayat) {
      return new NextResponse('Gram Panchayat not found', { status: 404 });
    }

    // Check if village already exists for this gram panchayat
    const existingVillage = await prisma.village.findFirst({
      where: {
        name: name,
        gramPanchayatId: gramPanchayatId,
      },
    });

    if (existingVillage) {
      return new NextResponse('Village already exists in this gram panchayat', { status: 400 });
    }

    const village = await prisma.village.create({
      data: {
        name: name,
        gramPanchayatId: gramPanchayatId,
        organizationId: session.user.organizationId,
      },
      include: {
        gramPanchayat: {
          select: {
            name: true,
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
          resource: 'Village',
          resourceId: village.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating audit log", error);
    }

    return NextResponse.json(village);
  } catch (error) {
    console.error('[VILLAGES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}