import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { authOptions } from '@/utils/authOptions'

// POST /api/team - Create a new team member
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const json = await req.json();
        const { email, firstName, lastName, roleType, role, permissions } = json;
        const organizationId = session.user.organizationId;
        // Validation
        if (!email || !firstName || !lastName || !roleType || !role || !organizationId) {
            return NextResponse.json(
                { error: 'Validation error', message: 'Required fields are missing' },
                { status: 400 }
            );
        }

        if (!['ngoRole', 'donorRole'].includes(roleType)) {
            return NextResponse.json(
                { error: 'Validation error', message: 'Only ngoRole and donorRole are allowed' },
                { status: 400 }
            );
        }

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        let isNewUser = false;

        if (!user) {
            const passwordHash = await bcrypt.hash('tanx123', 10);
            user = await prisma.user.create({
                data: { email, firstName, lastName, passwordHash, status: 'ACTIVE', organizationId:  organizationId},
            });
            isNewUser = true;
        }

        // Check if already a member of this org
        const existingMembership = await prisma.membership.findUnique({
            where: { userId_organizationId: { userId: user.id, organizationId } },
        });

        if (existingMembership) {
            return NextResponse.json(
                { error: 'Conflict', message: 'User is already a team member' },
                { status: 409 }
            );
        }

        // Create membership and permissions in a transaction
        const membership = await prisma.$transaction(async (tx) => {
            const membership = await tx.membership.create({
                data: {
                    userId: user.id,
                    organizationId,
                    [roleType]: role,
                    permissions: {
                        createMany: {
                            data: (permissions || []).map((p: any) => ({
                                resource: p.resource,
                                action: p.action,
                            })),
                        },
                    },
                },
                include: { user: true, permissions: true },
            });
            return membership;
        });

        return NextResponse.json(membership);
    } catch (error) {
        console.error('[TEAM_MEMBERS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
