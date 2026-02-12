import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';
import bcrypt from 'bcryptjs';

const createTeamMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  roleType: z.enum(['ngo', 'donor']),
  role: z.enum([
    'ngo_admin',
    'mel',
    'program_department',
    'project_manager_ngo',
    'me_officer',
    'field_agent',
    'donor_admin'
  ]),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string()
  })),
  password: z.string().min(6).optional()
});

const updateTeamMemberSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  roleType: z.enum(['ngo', 'donor']),
  role: z.enum([
    'ngo_admin',
    'mel',
    'program_department',
    'project_manager_ngo',
    'me_officer',
    'field_agent',
    'donor_admin'
  ]),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string()
  })),
  password: z.string().min(6).optional()
});

// Add schema for updating status
const updateStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
});

// GET /api/org/team - Get all team members for the organization
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
          include: {
            organization: true,
            permissions: true
          },
        },
      },
    });

    if (!user?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const organizationId = user.memberships[0].organizationId;

    const teamMembers = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            organizationId,
            isActive: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        memberships: {
          where: { organizationId },
          select: {
            ngoRole: true,
            donorRole: true,
            permissions: {
              select: {
                resource: true,
                action: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('[TEAM_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST /api/org/team - Create a new team member
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
    const validatedData = createTeamMemberSchema.parse(json);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400 }
      );
    }

    // Store the organization ID
    const organizationId = user.memberships[0].organizationId;

    // Determine password (custom or system generated firstname + 'tanx') and hash it
    const rawPassword = validatedData.password ?? `${validatedData.firstName.toLowerCase()}tanx`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create user with membership and permissions in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const createdUser = await tx.user.create({
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          passwordHash: hashedPassword,
        },
      });

      // Create membership with permissions
      await tx.membership.create({
        data: {
          userId: createdUser.id,
          organizationId,
          [validatedData.roleType === 'ngo' ? 'ngoRole' : 'donorRole']: validatedData.role,
          permissions: {
            createMany: {
              data: validatedData.permissions
            }
          }
        },
      });

      // Return user with memberships
      return tx.user.findUnique({
        where: { id: createdUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          status: true,
          memberships: {
            select: {
              ngoRole: true,
              donorRole: true,
              permissions: {
                select: {
                  resource: true,
                  action: true
                }
              }
            }
          }
        }
      });
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
          action: 'CREATE',
          resource: 'Team User',
          resourceId: newUser?.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error Indicator Log")
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('[TEAM_POST]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PUT /api/org/team - Update existing team member
export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authUser = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!authUser?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const organizationId = authUser.memberships[0].organizationId;

    const json = await req.json();
    const validatedData = updateTeamMemberSchema.parse(json);

    // Ensure the user being updated belongs to the same organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: validatedData.userId,
        organizationId
      },
      include: { permissions: true }
    });

    if (!membership) {
      return new NextResponse('Member not found in this organization', { status: 404 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // perform writes only
      await tx.user.update({
        where: { id: validatedData.userId },
        data: {
          email: validatedData.email,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          ...(validatedData.password
            ? { passwordHash: await bcrypt.hash(validatedData.password, 10) }
            : {}),
        },
      });

      // Update membership role and permissions

      await tx.membership.update({
        where: { id: membership.id },
        data: {
          ngoRole: validatedData.roleType === 'ngo' ? (validatedData.role as any) : null,
          donorRole: validatedData.roleType === 'donor' ? (validatedData.role as any) : null,
        },
      });

      // Replace permissions
      await tx.permission.deleteMany({ where: { membershipId: membership.id } });

      if (validatedData.permissions.length > 0) {
        await tx.permission.createMany({
          data: validatedData.permissions.map((p) => ({
            membershipId: membership.id,
            resource: p.resource,
            action: p.action,
          })),
        });
      }

      return membership.id; // return what you need
    });

    // fetch updated user *outside* the transaction
    const finalUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        memberships: {
          where: { organizationId },
          select: {
            ngoRole: true,
            donorRole: true,
            permissions: {
              select: { resource: true, action: true },
            },
          },
        },
      },
    });

    return NextResponse.json(finalUser);
  } catch (error) {
    console.error('[TEAM_PUT]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// PATCH /api/org/team - Update user status within the organization
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authUser = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!authUser?.memberships[0]?.organization) {
      return new NextResponse('Organization not found', { status: 404 });
    }

    const organizationId = authUser.memberships[0].organizationId;

    const json = await req.json();
    const { userId, status } = updateStatusSchema.parse(json);

    // Ensure the target user belongs to the same organization
    const membership = await prisma.membership.findFirst({
      where: { userId, organizationId },
    });

    if (!membership) {
      return new NextResponse('Member not found in this organization', { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        memberships: {
          where: { organizationId },
          select: {
            ngoRole: true,
            donorRole: true,
            permissions: { select: { resource: true, action: true } }
          }
        }
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[TEAM_PATCH]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// DELETE /api/org/team - Delete a team member
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    // Delete user and related data in a transaction
    await prisma.$transaction([
      // Delete permissions first due to foreign key constraints
      prisma.permission.deleteMany({
        where: {
          membership: {
            userId: userId
          }
        }
      }),
      // Delete memberships
      prisma.membership.deleteMany({
        where: {
          userId: userId
        }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: {
          id: userId
        }
      })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[TEAM_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 