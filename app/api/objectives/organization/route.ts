import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/utils/authOptions';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get organization ID from membership
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!membership) {
      return new NextResponse('No active organization membership found', { status: 404 });
    }

    const organizationId = (session.user as any).organizationId as string | undefined;
    if (!organizationId) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    // Fetch objectives where projectId and programId are both null
    const objectives = await prisma.objective.findMany({
      where: {
        organizationId,
        projectId: null,
        programId: null,
      },
      include: {
        indicators: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('[OBJECTIVES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
