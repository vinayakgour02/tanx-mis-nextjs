import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrganizationType, SubscriptionType } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Basic validation
    if (!data.name || !data.type || !data.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        type: data.type as OrganizationType,
        slug,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        state: data.state,
        country: data.country,
      },
    })

      // Find subscription plan by enum type
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { type: data.subscriptionPlan as SubscriptionType },
    })

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 },
      )
    }

      // Create subscription request
    await prisma.subscriptionRequest.create({
      data: {
        organizationId: organization.id,
        planId: plan.id,
        status: "PENDING", // default enum value
      },
    })


    try{
      // Capture request metadata for audit log
      const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
      const realIp = req.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = req.headers.get('user-agent') || undefined;
  
      await prisma.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: organization.headName,
          action: 'Registration',
          resource: 'Organzatiom',
          resourceId: organization.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
   }catch(error){
     console.error("Error Indicator Log")
   }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Organization registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register organization' },
      { status: 500 }
    )
  }
}

// GET all organizations
export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// PATCH update organization status
export async function PATCH(request: Request) {
  try {
    const { id, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update organization status' },
      { status: 500 }
    );
  }
} 