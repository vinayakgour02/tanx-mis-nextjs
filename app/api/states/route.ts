import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

// GET /api/states - Get all states for the organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const states = await prisma.state.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: {
            district: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(states);
  } catch (error) {
    console.error('[STATES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/states - Create a new state
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const { name } = json;

    if (!name) {
      return new NextResponse('State name is required', { status: 400 });
    }

    // Check if state already exists for this organization
    const existingState = await prisma.state.findFirst({
      where: {
        name: name,
        organizationId: session.user.organizationId,
      },
    });

    if (existingState) {
      return new NextResponse('State already exists', { status: 400 });
    }

    const state = await prisma.state.create({
      data: {
        name: name,
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: {
            district: true,
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
          resource: 'State',
          resourceId: state.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error creating audit log", error);
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('[STATES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}