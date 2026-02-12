import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { reportId } = await params
    const { comment } = await request.json()

    if (!comment || comment.trim() === "") {
      return new NextResponse("Comment required", { status: 400 })
    }

    // Create rejection entry
    await prisma.reportRejection.create({
      data: {
        reportId,
        rejectedById: session.user.id,
        comment,
      },
    })

    // Update report status
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "REJECTED",
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return new NextResponse("Error rejecting report", { status: 500 })
  }
}
