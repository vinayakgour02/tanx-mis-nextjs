export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

// Helper to extract Cloudinary publicId (including folder path) from a secure_url
function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1) return null;
    // parts after 'upload' typically look like: ['v1699999999', 'tanx-mis', 'organization-docs', 'filename.ext']
    const afterUpload = parts.slice(uploadIndex + 1);
    // remove version if present (starts with 'v' followed by digits)
    const withoutVersion = afterUpload[0]?.match(/^v\d+$/)
      ? afterUpload.slice(1)
      : afterUpload;
    if (withoutVersion.length === 0) return null;
    const last = withoutVersion[withoutVersion.length - 1];
    const lastWithoutExt = last.replace(/\.[^.]+$/, '');
    const path = [...withoutVersion.slice(0, -1), lastWithoutExt].join('/');
    return path || null;
  } catch {
    return null;
  }
}

// GET /api/organizations/profile
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    })

    if (!user?.memberships[0]?.organization) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    const organizationId = user.memberships[0].organizationId

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscriptions: {
          orderBy: { startDate: "desc" },
          include: { plan: true },
        },
      },
    })

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 })
    }

    // Get latest active subscription
    const now = new Date()
    const latestActive = organization.subscriptions.find(
      (s) => s.isActive && s.endDate > now
    )

    // Fallback to latest subscription even if expired
    const latestSubscription =
      latestActive || organization.subscriptions[0] || null

    return NextResponse.json({
      ...organization,
      subscriptionPlan: latestSubscription?.plan ?? null,
      subscription: latestSubscription ?? null,
    })
  } catch (error) {
    console.error("[ORGANIZATION_PROFILE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// PUT /api/organizations/profile
export async function PUT(req: Request) {
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

    const formData = await req.formData();
    const organization = user.memberships[0].organization;

    const updates: any = {};

    // Process form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        try {
          // Delete old file if exists
          const oldFileUrl = organization[key as keyof typeof organization] as string;
          const oldPublicId = extractCloudinaryPublicId(oldFileUrl);
          if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
          }

          // Upload new file
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const folder = key === 'logo' ? 'organization-logos' : 'organization-docs';
          const { url } = await uploadToCloudinary(
            {
              buffer,
              mimetype: value.type,
            },
            folder
          );
          updates[key] = url;
        } catch (error) {
          console.error(`Error processing file ${key}:`, error);
          return new NextResponse(`Error processing file ${key}`, { status: 400 });
        }
      } else if (key.includes('Date') && value) {
        // Handle date fields
        updates[key] = new Date(value as string);
      } else {
        // Handle other fields
        updates[key] = value;
      }
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: updates,
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
          action: 'Update',
          resource: 'Orgranization-Profile',
          resourceId: organization.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error('[ORGANIZATION_PROFILE_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 