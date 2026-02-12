import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/utils/authOptions'

// GET /api/donors - Get all donors for the organization
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const donors = await prisma.donor.findMany({
      where: { organizationId: user.memberships[0].organizationId },
      orderBy: { name: 'asc' },
    });
    

    return NextResponse.json(donors);
  } catch (error) {
    console.error('[DONORS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/donors - Create a new donor
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!user?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const json = await req.json();

    const donor = await prisma.donor.create({
      data: {
        organizationId: user.memberships[0].organizationId,
        name: json.name,
        type: json.type,
        code: json.code,
        description: json.description,
      },
    });

      // Capture request metadata for audit log
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;
  
      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id ?? undefined,
          action: 'CREATE',
          resource: 'Donor',
          resourceId: donor.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
  

    return NextResponse.json(donor);
  } catch (error) {
    console.error('[DONORS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 