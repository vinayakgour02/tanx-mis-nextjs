import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const REQUIRED_FIELDS = [
  'name',
  'type',
  'email',
  'phone',
  'address',
  'registrationNumber',
  'registrationDate',
  'panNumber',
];

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email!,
      },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const organization = user.memberships[0].organization;

    // Calculate profile completion
    const missingFields = REQUIRED_FIELDS.filter(field => !organization[field as keyof typeof organization]);
    const completionPercentage = Math.round(((REQUIRED_FIELDS.length - missingFields.length) / REQUIRED_FIELDS.length) * 100);

    // Get other stats
    const [projectCount, programCount, activityCount] = await Promise.all([
      prisma.project.count({
        where: { organizationId: organization.id },
      }),
      prisma.program.count({
        where: { organizationId: organization.id },
      }),
      prisma.activity.findMany({
        where: {
          project: {
            organizationId: organization.id,
          },
        },
      }).then(activities => activities.length),
    ]);

    return NextResponse.json({
      projectCount,
      programCount,
      activityCount,
      profileCompletion: {
        percentage: completionPercentage,
        missingFields,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD_STATS]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 