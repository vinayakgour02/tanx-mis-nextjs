import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/authOptions'
import { getActiveSubscription } from '@/lib/subscription';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { status } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json("Unauthorized Access!", { status: 401 });
    }

    // 🔑 use shared function instead of duplicating query
    const activeSubscription = await getActiveSubscription(session.user.organizationId);

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'Your organization does not have an active subscription.' },
        { status: 403 }
      );
    }

    // Validate status
    const validStatuses = ['DRAFT', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Restrict ACTIVE projects based on plan
    if (status === 'ACTIVE') {
      const activeProjectsCount = await prisma.project.count({
        where: {
          organizationId: session.user.organizationId,
          status: 'ACTIVE',
        },
      });

      if (
        activeSubscription.plan.projectsAllowed !== null &&
        activeProjectsCount >= activeSubscription.plan.projectsAllowed
      ) {
        return NextResponse.json(
          {
            error: `Your plan allows only ${activeSubscription.plan.projectsAllowed} active projects. Please upgrade your subscription.`,
          },
          { status: 403 }
        );
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status },
    });

    // audit log
    try {
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
      const realIp = request.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = request.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'UPDATE',
          resource: 'Project_status_changed',
          resourceId: projectId,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error writing audit log:", error);
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project status:', error);
    return NextResponse.json(
      { error: 'Failed to update project status' },
      { status: 500 }
    );
  }
}
