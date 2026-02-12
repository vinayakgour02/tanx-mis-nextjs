import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[projectId] - Get a specific project
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        programs: {
          include: {
            interventions: {
              include: {
                SubIntervention: true,
              },
            },
          },
        },
        objectives: true,
        indicators: true,
        funding: {
          include: {
            donor: true,
          },
        },
        team: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                title: true,
                department: true,
              }
            }
          }
        },
      },
    });


    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if user has access to this project's organization
    // const user = await prisma.user.findFirst({
    //   where: { email: session.user.email! },
    //   include: {
    //     memberships: true,
    //   },
    // });

    // if (!user?.memberships.some(m => m.organizationId === project.organizationId)) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    return NextResponse.json(project);
  } catch (error) {
    console.error('[PROJECT_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/projects/[projectId] - Update a project
// export async function PATCH(
//   req: Request,
//   { params }: { params: Promise<{ projectId: string }> }
// ) {
//   try {
//     const { projectId } = await params;
//     const session = await getServerSession();
//     if (!session?.user) {
//       return new NextResponse('Unauthorized', { status: 401 });
//     }

//     const json = await req.json();

//     // Get user's organization
//     const user = await prisma.user.findFirst({
//       where: { email: session.user.email! },
//       include: {
//         memberships: true,
//       },
//     });

//     if (!user?.memberships[0]) {
//       return new NextResponse('Organization not found', { status: 404 });
//     }

//     const organizationId = user.memberships[0].organizationId;

//     // Verify project exists and belongs to user's organization
//     const project = await prisma.project.findFirst({
//       where: { 
//         id: projectId,
//         organizationId 
//       },
//     });

//     if (!project) {
//       return new NextResponse('Project not found', { status: 404 });
//     }

//     // Update project and related data in a transaction
//     const updatedProject = await prisma.$transaction(async (tx) => {
//       // Delete existing relations if new data is provided
//       if (json.objectives) {
//         await tx.objective.deleteMany({
//           where: { projectId },
//         });
//       }

//       if (json.indicators) {
//         await tx.indicator.deleteMany({
//           where: { projectId },
//         });
//       }

//       if (json.funding) {
//         await tx.projectFunding.deleteMany({
//           where: { projectId },
//         });
//       }

//       if (json.team) {
//         await tx.projectTeamMember.deleteMany({
//           where: { projectId },
//         });

//         // Verify all users exist and belong to the organization
//         const userIds = json.team.map((member: any) => member.userId);
//         const validUsers = await tx.user.findMany({
//           where: {
//             id: { in: userIds },
//             memberships: {
//               some: {
//                 organizationId,
//                 isActive: true,
//               },
//             },
//           },
//           select: { id: true, firstName: true, lastName: true },
//         });

//         const validUserIds = new Set(validUsers.map(u => u.id));

//         // Create new team members
//         if (validUsers.length > 0) {
//           await tx.projectTeamMember.createMany({
//             data: json.team
//               .filter((member: any) => validUserIds.has(member.userId))
//               .map((member: any) => ({
//                 projectId,
//                 userId: member.userId,
//                 role: member.role,
//               })),
//           });
//         }
//       }

//       // Update the project and create new relations
//       return tx.project.update({
//         where: { id: projectId },
//         data: {
//           name: json.name,
//           description: json.description,
//           theme: json.theme,
//           status: json.status,
//           startDate: json.startDate,
//           endDate: json.endDate,
//           totalBudget: json.totalBudget,
//           currency: json.currency,
//           directBeneficiaries: json.directBeneficiaries,
//           indirectBeneficiaries: json.indirectBeneficiaries,
//           programId: json.programId,
//           objectives: json.objectives ? {
//             create: json.objectives.map((obj: any) => ({
//               level: obj.level,
//               description: obj.description,
//               orderIndex: obj.orderIndex,
//               code: obj.code,
//             })),
//           } : undefined,
//           indicators: json.indicators ? {
//             create: json.indicators.map((ind: any) => ({
//               organizationId,
//               name: ind.name,
//               type: ind.type,
//               level: ind.level,
//               definition: ind.definition,
//               rationale: ind.rationale,
//               dataSource: ind.dataSource,
//               frequency: ind.frequency,
//               unitOfMeasure: ind.unitOfMeasure,
//               disaggregateBy: ind.disaggregateBy,
//               baselineDate: ind.baselineDate,
//               baselineValue: ind.baselineValue,
//               target: ind.target,
//             })),
//           } : undefined,
//           funding: json.funding ? {
//             create: json.funding.map((fund: any) => ({
//               donorId: fund.donorId,
//               amount: fund.amount,
//               currency: fund.currency,
//               year: fund.year,
//             })),
//           } : undefined,
//         },
//         include: {
//           program: true,
//           objectives: true,
//           indicators: true,
//           funding: {
//             include: {
//               donor: true,
//             },
//           },
//           team: true,
//         },
//       });
//     });


//     try{
//       // Capture request metadata for audit log
//       const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
//       const realIp = req.headers.get('x-real-ip') ?? '';
//       const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
//       const userAgent = req.headers.get('user-agent') || undefined;

//       await prisma.auditLog.create({
//         data: {
//           organizationId: session?.user?.organizationId || '',
//           userId: session?.user?.id ?? undefined,
//           action: 'Update',
//           resource: 'Project',
//           resourceId: updatedProject.id,
//           ipAddress,
//           userAgent,
//           timestamp: new Date(),
//         },
//       });
//    }catch(error){
//      console.error("Error Indicator Log")
//    }

//     return NextResponse.json(updatedProject);
//   } catch (error) {
//     console.error('[PROJECT_PATCH]', error);
//     return new NextResponse('Internal Error', { status: 500 });
//   }
// }

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if user has access to this project's organization
    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: true,
      },
    });

    if (!user?.memberships.some(m => m.organizationId === project.organizationId)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });


    try {
      // Capture request metadata for audit log
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'Delete',
          resource: 'Project',
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error Indicator Log")
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[PROJECT_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 