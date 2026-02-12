import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: Readonly<{ params: Promise<{ reportId: string }> }>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { reportId } = await params

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        program: {
          select: {
            name: true,
          },
        },
        activity: {
          select: {
            name: true,
            unitOfMeasure: true,
            Intervention: true,
            subInterventionRel: true,
            type: true,
          },
        },
        interventionArea: {
          select: {
            villageName: true,
            blockName: true,
            district: true,
            state: true,
            gramPanchayat: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
        trainingReport: {
          include: {
            participants: true,
          },
        },
        infrastructureReport: true,
        householdReport: {
          include: {
            benefits: {
              include: {
                benefitType: true,
              },
            },
          },
        },
      },
    })

    if (!report) {
      return new NextResponse("Report not found", { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("[REPORT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// PUT /api/reports/[reportId] - Update a report
export async function PUT(
  request: Request,
  { params }: Readonly<{ params: Promise<{ reportId: string }> }>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { reportId } = await params
    const data = await request.json()

    // Check if the report exists and belongs to the user's organization
    const existingReport = await prisma.report.findFirst({
      where: {
        id: reportId,
        organizationId: session.user.organizationId,
      },
    })

    if (!existingReport) {
      return new NextResponse("Report not found", { status: 404 })
    }

    // Update the report
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        type: data.type,
        status: data.status,
        reportingDate: data.reportingDate ? new Date(data.reportingDate) : undefined,
        reportingMonth: data.reportingMonth,
        reportingQuarter: data.reportingQuarter,
        reportingYear: data.reportingYear,
        landscape: data.location,
        gpsCoordinates: data.gpsCoordinates,
        unitReported: data.unitReported,
        numberOfPeople: data.numberOfPeople,
        hasLeverage: data.hasLeverage,
        leverageSources: Array.isArray(data.leverageSources) ? data.leverageSources.join(", ") : data.leverageSources,
        leverageGovt: data.leverageGovt,
        leverageCsr: data.leverageCsr,
        leverageCommunity: data.leverageCommunity,
        levelofActivity: data.levelofActivity, // Add this field
      },
      include: {
        project: { select: { name: true } },
        activity: { select: { name: true, type: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
    })

    // Handle attachments update if provided
    if (data.attachments && Array.isArray(data.attachments)) {
      // Delete existing attachments
      await prisma.attachment.deleteMany({
        where: { reportId },
      })

      // Create new attachments
      if (data.attachments.length > 0) {
        await prisma.attachment.createMany({
          data: data.attachments.map((attachment: any) => ({
            reportId,
            type: attachment.type,
            url: attachment.url,
            filename: attachment.filename,
            originalName: attachment.originalName,
          })),
        })
      }
    }

    // Handle training participants update
    if (data.participants && updatedReport.type === "Training") {
      // Delete existing participants
      await prisma.trainingParticipant.deleteMany({
        where: { 
          trainingReport: {
            reportId,
          },
        },
      })

      // Create new participants if provided
      if (data.participants.length > 0) {
        const trainingReport = await prisma.trainingReport.findFirst({
          where: { reportId },
        })

        if (trainingReport) {
          await prisma.trainingParticipant.createMany({
            data: data.participants.map((participant: any) => ({
              trainingReportId: trainingReport.id,
              name: participant.name,
              age: participant.age,
              gender: participant.gender,
              education: participant.education,
              socialGroup: participant.socialGroup,
              designation: participant.designation,
              organization: participant.organization,
              mobile: participant.mobile,
              email: participant.email,
              isPwd: participant.isPwd || false,
              peopleBankId: participant.peopleBankId || null,
            })),
          })
        }
      }
    }

    // Create audit log
    try {
      const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
      const realIp = request.headers.get('x-real-ip') ?? ''
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined)
      const userAgent = request.headers.get('user-agent') || undefined

      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId || '',
          userId: session.user.id ?? undefined,
          action: 'UPDATE',
          resource: 'Report',
          resourceId: reportId,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error creating audit log", error)
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("[REPORT_PUT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// DELETE /api/reports/[reportId] - Delete a report
export async function DELETE(
  request: Request,
  { params }: Readonly<{ params: Promise<{ reportId: string }> }>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { reportId } = await params

    // Check if the report exists and belongs to the user's organization
    const existingReport = await prisma.report.findFirst({
      where: {
        id: reportId,
        organizationId: session.user.organizationId,
      },
    })

    if (!existingReport) {
      return new NextResponse("Report not found", { status: 404 })
    }

    // Delete the report (cascade will handle related records)
    await prisma.report.delete({
      where: { id: reportId },
    })

    // Create audit log
    try {
      const forwardedFor = request.headers.get('x-forwarded-for') ?? ''
      const realIp = request.headers.get('x-real-ip') ?? ''
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined)
      const userAgent = request.headers.get('user-agent') || undefined

      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId || '',
          userId: session.user.id ?? undefined,
          action: 'DELETE',
          resource: 'Report',
          resourceId: reportId,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error("Error creating audit log", error)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[REPORT_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 