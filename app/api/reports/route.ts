import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {

    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's organization from membership
    const member = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (!member) {
      return new NextResponse("No active organization membership", { status: 403 })
    }

    const isAdmin = session.user.role === "ngo_admin";
    // Fetch reports with related data
    const reports = await prisma.report.findMany({
      where: {
        organizationId: session.user.organizationId,
        ...(isAdmin
          ? {}
          : { creatorId: session.user.id }),
      },
      include: {
        project: {
          select: {
            name: true,
            code: true
          }
        },

        activity: {
          select: {
            name: true,
            code: true,
            Intervention: true,
            subInterventionRel: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        interventionArea: {
          select: {
            state: true,
            district: true,
            blockName: true,
            villageName: true,
            gramPanchayat: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    )
  }
}

// Existing POST route
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Create base report
    const report = await prisma.report.create({
      data: {
        organizationId: session.user.organizationId,
        programId: data.programId,
        projectId: data.projectId,
        activityId: data.activityId,
        interventionAreaId: data.interventionAreaId,
        levelofActivity: data.levelofActivity || "null", // Add this field with default
        creatorId: session.user.id,
        type: data.type,
        status: data.status || "DRAFT",
        reportingDate: new Date(data.reportingDate),
        reportingMonth: data.reportingMonth,
        reportingQuarter: data.reportingQuarter,
        reportingYear: data.reportingYear,
        landscape: data.location,
        gpsCoordinates: data.gpsCoordinates,
        unitType: data.unitType,
        unitReported: data.unitReported,
        numberOfPeople: data.numberOfPeople,
        hasLeverage: data.hasLeverage,
        leverageSources: Array.isArray(data.leverageSources) ? data.leverageSources.join(", ") : data.leverageSources || "No Leverage",
        leverageGovt: data.leverageGovt,
        leverageCsr: data.leverageCsr,
        leverageCommunity: data.leverageCommunity,

        // Handle attachments if any
        ...(data.attachments?.length > 0 && {
          attachments: {
            create: data.attachments.map((attachment: any) => ({
              description: attachment.type,
              url: attachment.url,
              size: 0,
              filename: attachment.filename,
              originalName: attachment.originalName,
            })),
          },
        }),

        // Handle training report
        ...(data.type === "Training" && {
          trainingReport: {
            create: {
              dateFrom: data.trainingDateFrom ? new Date(data.trainingDateFrom) : new Date(data.reportingDate),
              dateTo: data.trainingDateTo ? new Date(data.trainingDateTo) : new Date(data.reportingDate),
              // Only create participants if they exist and have required data
              ...(Array.isArray(data.participants) && data.participants.length > 0 && {
                participants: {
                  create: data.participants
                    .filter((participant: any) => participant.name && participant.age && participant.gender)
                    .map((participant: any) => ({
                      name: participant.name,
                      age: Number(participant.age),
                      gender: participant.gender,
                      education: participant.education || '',
                      socialGroup: participant.socialGroup || '',
                      designation: participant.designation || '',
                      organization: participant.organization || '',
                      mobile: participant.mobile || '',
                      email: participant.email || '',
                      isPwd: Boolean(participant.isPwd),
                      peopleBankId: participant.peopleBankId || null,
                    })),
                },
              }),
            },
          },
        }),

        // Handle infrastructure report
        ...(data.type === "Infrastructure" && {
          infrastructureReport: {
            create: {
              infrastructureName: data.infrastructureName,
              category: data.category,
              locations: data.location,
              workType: data.workType,
              dprApproved: data.dprApproved,
              approvedDesignFollowed: data.approvedDesignFollowed,
              designChangeDetails: data.designChangeDetails,
              sanctionBudget: data.sanctionBudget,
              expensesIncurred: data.expensesIncurred,
              workDescription: data.workDescription,
              benefits: data.benefits,
              preConstructionPhotos: JSON.stringify(data.preConstructionPhotos || []),
              duringConstructionPhotos: JSON.stringify(data.duringConstructionPhotos || []),
              postConstructionPhotos: JSON.stringify(data.postConstructionPhotos || []),
              infrastructureUniqueId: `INF-${Date.now()}`,
            },
          },
        }),

        // Handle household report with benefits
        ...(data.type === "Household" && {
          householdReport: {
            create: {
              beneficiaryName: data.beneficiaryName,
              age: data.age,
              gender: data.gender,
              socialGroup: data.socialGroup,
              maleMembers: data.maleMembers,
              femaleMembers: data.femaleMembers,
              totalMembers: data.totalMembers,
              uniqueId: `HH-${Date.now()}`, // Auto-generate uniqueId
              // Only create benefits if they exist
              ...(Array.isArray(data.benefits) && data.benefits.length > 0 && {
                benefits: {
                  create: data.benefits.map((benefit: any) => ({
                    benefitType: {
                      create: {
                        name: benefit.name,
                        unitType: benefit.unitType,
                      },
                    },
                    reportedNumber: benefit.reportedNumber,
                  })),
                },
              }),
            },
          },
        }),
      },
      include: {
        householdReport: {
          include: {
            benefits: {
              include: {
                benefitType: true,
              },
            },
          },
        },
        trainingReport: {
          include: {
            participants: true,
          },
        },
        infrastructureReport: true,
        attachments: true,
      },
    });

    try {
      // Capture request metadata for audit log
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
      const realIp = request.headers.get('x-real-ip') ?? '';
      const ipAddress = (forwardedFor.split(',')[0]?.trim() || realIp || undefined);
      const userAgent = request.headers.get('user-agent') || undefined;

      await prisma.auditLog.create({
        data: {
          organizationId: session?.user?.organizationId || '',
          userId: session?.user?.id ?? undefined,
          action: 'CREATE',
          resource: 'Report',
          resourceId: report.id,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error Indicator Log")
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("[REPORTS_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
} 