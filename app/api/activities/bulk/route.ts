import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

interface BulkActivity {
    projectId: string
    objectiveId: string
    indicatorId?: string | null
    subInterventionId?: string | null
    name: string
    description?: string | null
    startDate?: string | null
    endDate?: string | null
    unitOfMeasure?: string | null
    targetUnit?: number | null
    costPerUnit?: number | null
    totalBudget?: number | null
    leverage?: number | null
    interventionId: string
    type: string
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const activities: BulkActivity[] = body.activities
        if (!Array.isArray(activities) || activities.length === 0) {
            return NextResponse.json(
                { error: "No activities provided" },
                { status: 400 }
            )
        }

        const session = await getServerSession(authOptions)
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const organizationId = session.user.organizationId
        const userId = session.user.id ?? undefined

        const successActivities = []
        const errors: { row: number; error: string }[] = []

        // Loop through activities and attempt to create each
        for (let i = 0; i < activities.length; i++) {
            const act = activities[i]

            // Validate required fields
            if (!act.projectId || !act.objectiveId || !act.name || !act.interventionId) {
                errors.push({ row: i + 2, error: "Missing required fields" })
                continue
            }

            try {
                const created = await prisma.activity.create({
                    data: {
                        projectId: act.projectId,
                        objectiveId: act.objectiveId,
                        indicatorId: act.indicatorId || null,
                        name: act.name,
                        description: act.description || null,
                        startDate: act.startDate ? new Date(act.startDate) : null,
                        endDate: act.endDate ? new Date(act.endDate) : null,
                        unitOfMeasure: act.unitOfMeasure || null,
                        targetUnit: act.targetUnit ?? null,
                        costPerUnit: act.costPerUnit ?? null,
                        totalBudget: act.totalBudget ?? null,
                        leverage: String(act.leverage) ?? null,
                        interventionId: act.interventionId,
                        subInterventionId: act.subInterventionId || null,
                        organizationId,
                        status: "PLANNED",
                        type: act.type || "DEFAULT", // ✅ add this line
                    },
                })


                // Audit log
                const forwardedFor = request.headers.get("x-forwarded-for") ?? ""
                const realIp = request.headers.get("x-real-ip") ?? ""
                const ipAddress = forwardedFor.split(",")[0]?.trim() || realIp || undefined
                const userAgent = request.headers.get("user-agent") || undefined

                await prisma.auditLog.create({
                    data: {
                        organizationId,
                        userId,
                        action: "CREATE",
                        resource: "Activity",
                        resourceId: created.id,
                        ipAddress,
                        userAgent,
                        timestamp: new Date(),
                    },
                })

                successActivities.push(created)
            } catch (err: any) {
                console.error(`Error creating activity at row ${i + 2}:`, err)
                errors.push({ row: i + 2, error: err.message || "Unknown error" })
            }
        }

        return NextResponse.json({
            successCount: successActivities.length,
            errors,
            created: successActivities,
        })
    } catch (error) {
        console.error("Bulk activity creation failed:", error)
        return NextResponse.json(
            { error: "Failed to create activities" },
            { status: 500 }
        )
    }
}
