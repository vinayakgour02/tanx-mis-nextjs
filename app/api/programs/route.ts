import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/programs - Get all programs for the organization
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

    const programs = await prisma.program.findMany({
      where: { organizationId: user.memberships[0].organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('[PROGRAMS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/programs - Create a new program
export async function POST(req: Request) {
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

    const json = await req.json();

    const program = await prisma.program.create({
      data: {
        organizationId: user.memberships[0].organizationId,
        name: json.name,
        description: json.description,
        objectives: json.objectives,
        startDate: json.startDate ? new Date(json.startDate) : null,
        endDate: json.endDate ? new Date(json.endDate) : null,
        budget: json.budget,
        status: json.status || 'DRAFT',
        priority: json.priority || 'MEDIUM',
        sector: json.sector,
        theme: json.theme,
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
          resource: 'Program',
          resourceId: program.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(program);
  } catch (error) {
    console.error('[PROGRAMS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 