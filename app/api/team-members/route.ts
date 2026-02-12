import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/team-members - Get all team members for the organization
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

    const teamMembers = await prisma.projectTeamMember.findMany({
      where: { project: { organizationId: user.memberships[0].organizationId } }
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('[TEAM_MEMBERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/team-members - Create a new team member
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

    // Create a new project to associate the team member with
    // This is a temporary solution until we implement a better way to manage team members
    const project = await prisma.project.create({
      data: {
        organizationId: user.memberships[0].organizationId,
        name: 'Team Member Pool',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'DRAFT',
      },
    });

    const teamMember = await prisma.projectTeamMember.create({
      data: {
        projectId: project.id,
        userId: json.userId,
          role: json.role,
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
          resource: 'Team_Member',
          resourceId: teamMember.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('[TEAM_MEMBERS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 