import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const requests = await prisma.subscriptionRequest.findMany({
      where: { organizationId: params.id },
      include: { plan: true },
      orderBy: { requestedAt: "desc" },
      take: 5,
    })

    return NextResponse.json(
      requests.map((r) => ({
        id: r.id,
        planName: r.plan.name,
        status: r.status,
        requestedAt: r.requestedAt,
      })),
    )
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}
