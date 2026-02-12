import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/utils/authOptions'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;

    if (!organizationId) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const projects = await prisma.project.findMany({
  where: {
    organizationId,
  },
  select: {
    id: true,
    name: true,
    code: true,
    description: true,
    status: true,
    startDate: true,
    endDate: true,
    totalBudget: true,
    currency: true,
    activities:{
      include:{
        Intervention:{
          include:{
            SubIntervention: true
          }
        }
      }
    },
    programs: {
      select: {
        id: true,
        name: true,
        theme: true,
        sector: true,
        startDate: true,
        endDate: true,
      },
    },
  },
  orderBy: {
    name: 'asc',
  },
});


    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/projects - Create a new project
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
    const organizationId = user.memberships[0].organizationId;

    // Start a transaction to create project and team members
    const project = await prisma.$transaction(async (tx) => {
      // Create the project first
      const newProject = await tx.project.create({
        data: {
          organizationId,
          name: json.name,
          description: json.description,
          theme: json.theme,
          status: json.status,
          baseline: json.baseline,
          target: json.target,
          startDate: json.startDate,
          endDate: json.endDate,
          directBeneficiaries: json.directBeneficiaries,
          indirectBeneficiaries: json.indirectBeneficiaries,
          totalBudget: json.totalBudget,
          currency: json.currency,
          goal: json.goal,

          // ✅ Multiple program relation
          programs: {
            connect: json.programIds?.map((id: string) => ({ id })),
          },

          objectives: {
            create: json.objectives?.map((obj: any) => ({
              level: obj.level,
              description: obj.description,
              orderIndex: obj.orderIndex,
              code: obj.code,
            })),
          },
          indicators: {
            create: json.indicators?.map((ind: any) => ({
              organizationId,
              name: ind.name,
              type: ind.type,
              level: ind.level,
              definition: ind.definition,
              rationale: ind.rationale,
              dataSource: ind.dataSource,
              frequency: ind.frequency,
              unitOfMeasure: ind.unitOfMeasure,
              disaggregateBy: ind.disaggregateBy,
              baselineDate: ind.baselineDate,
              baselineValue: ind.baselineValue,
              target: ind.target,
            })),
          },
          funding: {
            create: json.funding?.map((fund: any) => ({
              donorId: fund.donorId,
              amount: fund.amount,
              currency: fund.currency,
              year: fund.year,
            })),
          },
        },
      });

      // Create team members if provided
      if (json.team?.length > 0) {
        const userIds = json.team.map((member: any) => member.userId);

        const validUsers = await tx.user.findMany({
          where: {
            id: { in: userIds },
            memberships: {
              some: {
                organizationId,
                isActive: true,
              },
            },
          },
        });

        const validUserIds = new Set(validUsers.map((u) => u.id));

        await tx.projectTeamMember.createMany({
          data: json.team
            .filter((member: any) => validUserIds.has(member.userId))
            .map((member: any) => ({
              projectId: newProject.id,
              userId: member.userId,
              role: member.role,
            })),
        });
      }

      return newProject;
    });

    try {
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = forwardedFor.split(',')[0]?.trim() || realIp || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'CREATE',
          resource: 'Project',
          resourceId: project.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error writing audit log');
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
