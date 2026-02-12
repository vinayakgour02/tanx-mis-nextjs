import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const session = await getServerSession(authOptions);

        // Create the indicator
        const indicator = await prisma.organizationIndicator.create({
            data: {
                organizationId: session?.user.organizationId,
                name: data.name,
                type: data.type,
                level: data.level,
                definition: data.definition,
                rationale: data.rationale,
                dataSource: data.dataSource,
                frequency: data.frequency,
                unitOfMeasure: data.unitOfMeasure,
                disaggregateBy: data.disaggregateBy,
                baselineValue: data.baselineValue,
                target: data.target,
                ...(data.objectiveId && { objectiveId: data.objectiveId }),
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
                    organizationId: session?.user.organizationId || '',
                    userId: session?.user.id ?? undefined,
                    action: 'CREATE',
                    resource: 'Indicator',
                    resourceId: indicator.id,
                    ipAddress,
                    timestamp: new Date(),
                    userAgent,
                },
            });
        } catch (error) {
            console.error("Error Indicator Log")
        }

        return NextResponse.json(indicator);
    } catch (error) {
        console.error("Error creating indicator:", error);
        return NextResponse.json(
            { error: "Failed to create indicator" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const session = await getServerSession(authOptions);

        if (!session?.user.organizationId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const indicators = await prisma.organizationIndicator.findMany({
            where: {
                organizationId: session.user.organizationId,
            },
            include: {
                objective: true,
                program: true,
                organization: true,
            },
        })

        return NextResponse.json(indicators);
    } catch (error) {
        console.error("Error fetching indicators:", error);
        return NextResponse.json(
            { error: "Failed to fetch indicators" },
            { status: 500 }
        );
    }
} 