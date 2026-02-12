import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json()
    const { plan } = body

    const orgId = params.id
    if (!orgId || !plan) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Find subscription plan
    const planData = await prisma.subscriptionPlan.findUnique({
      where: { type: plan },
    })

    if (!planData) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Create subscription request
    const request = await prisma.subscriptionRequest.create({
      data: {
        organizationId: orgId,
        planId: planData.id,
      },
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    )
  }
}
