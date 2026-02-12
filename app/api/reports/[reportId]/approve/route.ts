import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { reportId } = await params

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return new NextResponse("Error approving report", { status: 500 })
  }
}
