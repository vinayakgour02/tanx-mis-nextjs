import { authOptions } from '@/utils/authOptions'
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { id } = await params;

    await prisma.activity.delete({
      where: { id },
    });

    // Capture request metadata for audit log
    const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
    const realIp = request.headers.get('x-real-ip') ?? '';
    const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
    const userAgent = request.headers.get('user-agent') || undefined;

    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id ?? undefined,
        action: 'CREATE',
        resource: 'Activity',
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });


    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
} 


