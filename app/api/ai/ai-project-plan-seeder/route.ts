import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const { 
            organizationId, 
            planYearStart, 
            planYearEnd, 
            targetDistributionStrategy = 'even',
            includeOnlyActiveProjects = true 
        } = await req.json();

        if (!organizationId || !planYearStart || !planYearEnd) {
            return NextResponse.json({ 
                error: "organizationId, planYearStart, and planYearEnd are required" 
            }, { status: 400 });
        }

        const planStart = new Date(planYearStart);
        const planEnd = new Date(planYearEnd);

        if (planStart >= planEnd) {
            return NextResponse.json({ 
                error: "planYearStart must be before planYearEnd" 
            }, { status: 400 });
        }

        // 1️⃣ Fetch projects for the organization
        const projectFilter: any = { organizationId };
        if (includeOnlyActiveProjects) {
            projectFilter.status = 'ACTIVE';
        }

        const projects = await prisma.project.findMany({
            where: projectFilter,
            include: {
                activities: {
                    where: {
                        // Only include activities that have some overlap with the plan year
                        AND: [
                            { startDate: { lte: planEnd } },
                            { endDate: { gte: planStart } }
                        ]
                    }
                },
                interventionAreas: true,
                objectives: true
            }
        });

        if (!projects.length) {
            return NextResponse.json({ error: "No eligible projects found for this organization" }, { status: 404 });
        }

        console.log(`Found ${projects.length} projects for organization ${organizationId}`);

        const createdPlans: any[] = [];
        const skippedActivities: any[] = [];

        // 2️⃣ Process each project
        for (const project of projects) {
            try {
                if (!project.activities.length) {
                    console.warn(`Skipping project ${project.name} - no overlapping activities found`);
                    continue;
                }

                if (!project.interventionAreas.length) {
                    console.warn(`Skipping project ${project.name} - no intervention areas found`);
                    continue;
                }

                // Check which activities already have plans for this period
                const existingPlans = await prisma.plan.findMany({
                    where: {
                        projectId: project.id,
                        AND: [
                            { startMonth: { lte: planEnd } },
                            { endMonth: { gte: planStart } }
                        ]
                    },
                    select: { activityId: true }
                });

                const existingActivityIds = new Set(existingPlans.map(p => p.activityId));
                const availableActivities = project.activities.filter(
                    activity => !existingActivityIds.has(activity.id)
                );

                if (!availableActivities.length) {
                    console.warn(`Skipping project ${project.name} - all activities already have plans for this period`);
                    continue;
                }

                // 3️⃣ Generate plan data using AI for each activity
                for (const activity of availableActivities) {
                    try {
                        // Calculate the intersection of activity dates with plan year
                        const activityStart = new Date(activity.startDate!);
                        const activityEnd = new Date(activity.endDate!);
                        
                        const intersectionStart = activityStart > planStart ? activityStart : planStart;
                        const intersectionEnd = activityEnd < planEnd ? activityEnd : planEnd;

                        if (intersectionStart >= intersectionEnd) {
                            skippedActivities.push({
                                projectName: project.name,
                                activityName: activity.name,
                                reason: 'No date overlap with plan year'
                            });
                            continue;
                        }

                        // Generate months for the intersection period
                        const months: string[] = [];
                        const current = new Date(intersectionStart.getFullYear(), intersectionStart.getMonth(), 1);
                        const endMonth = new Date(intersectionEnd.getFullYear(), intersectionEnd.getMonth(), 1);

                        while (current <= endMonth) {
                            months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
                            current.setMonth(current.getMonth() + 1);
                        }

                        if (months.length === 0) {
                            skippedActivities.push({
                                projectName: project.name,
                                activityName: activity.name,
                                reason: 'No months in intersection period'
                            });
                            continue;
                        }

                        // 4️⃣ Use AI to generate intelligent monthly targets
                        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
                        const aiPrompt = `
Generate realistic monthly targets for the following activity:

ACTIVITY: "${activity.name}"
DESCRIPTION: "${activity.description || 'No description provided'}"
TYPE: "${activity.type}"
UNIT OF MEASURE: "${activity.unitOfMeasure}"
TOTAL TARGET: ${activity.targetUnit}
DURATION: ${months.length} months (${months[0]} to ${months[months.length - 1]})
DISTRIBUTION STRATEGY: ${targetDistributionStrategy}

PROJECT CONTEXT:
- Project: "${project.name}"
- Theme: "${project.theme}"
- Budget: ${project.totalBudget} ${project.currency}

MONTHS TO PLAN: ${months.join(', ')}

DISTRIBUTION STRATEGIES:
- even: Equal targets across all months
- weighted: Higher targets in middle months, lower at start/end
- frontloaded: Higher targets in early months, decreasing over time
- backloaded: Lower targets initially, increasing toward end

IMPORTANT: Return ONLY a valid JSON object with no additional text, comments, or markdown formatting.

Generate monthly targets that:
1. Sum up to approximately the total target (${activity.targetUnit})
2. Are realistic positive integers (no decimals, no negatives)
3. Follow the specified distribution strategy
4. Consider the activity type and nature

Return format:
{
  "monthlyTargets": {
    "${months[0]}": number,
    "${months[1] || months[0]}": number,
    ...
  },
  "totalDistributed": number,
  "strategy": "${targetDistributionStrategy}",
  "reasoning": "Brief explanation of the distribution logic"
}`;

                        const result = await model.generateContent({
                            contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
                            generationConfig: { responseMimeType: "application/json" },
                        });

                        let aiResponse: any = {};
                        try {
                            const responseText = result.response.text();
                            console.log(`AI response for activity ${activity.name}:`, responseText.substring(0, 200));
                            
                            const cleanedResponse = responseText
                                .replace(/```json\s*/g, '')
                                .replace(/```\s*/g, '')
                                .trim();
                            
                            aiResponse = JSON.parse(cleanedResponse);
                            
                            if (!aiResponse.monthlyTargets || typeof aiResponse.monthlyTargets !== 'object') {
                                throw new Error("Invalid monthlyTargets structure");
                            }
                        } catch (e) {
                            console.error(`Failed to parse AI response for activity ${activity.name}:`, e);
                            // Fallback to even distribution
                            const evenTarget = Math.floor((activity.targetUnit || 0) / months.length);
                            const remainder = (activity.targetUnit || 0) % months.length;
                            
                            aiResponse.monthlyTargets = {};
                            months.forEach((month, index) => {
                                aiResponse.monthlyTargets[month] = evenTarget + (index < remainder ? 1 : 0);
                            });
                            aiResponse.strategy = 'even_fallback';
                            aiResponse.reasoning = 'AI response failed, used even distribution fallback';
                        }

                        // 5️⃣ Select intervention area (use first available for now)
                        const interventionArea = project.interventionAreas[0];
                        
                        // Build location string
                        let location = '';
                        if (interventionArea) {
                            const area = await prisma.interventionArea.findUnique({
                                where: { id: interventionArea.id },
                                select: {
                                    villageName: true,
                                    gramPanchayat: true,
                                    blockName: true,
                                    district: true,
                                    state: true,
                                },
                            });
                            if (area) {
                                location = [
                                    area.villageName,
                                    area.gramPanchayat,
                                    area.blockName,
                                    area.district,
                                    area.state
                                ].filter(Boolean).join(', ');
                            }
                        }

                        // 6️⃣ Create the plan
                        const plan = await prisma.plan.create({
                            data: {
                                projectId: project.id,
                                activityId: activity.id,
                                interventionAreaId: interventionArea?.id,
                                startMonth: intersectionStart,
                                endMonth: intersectionEnd,
                                monthlyTargets: aiResponse.monthlyTargets,
                                status: "PLANNED",
                                location: location
                            },
                            include: {
                                project: { select: { name: true } },
                                activity: { select: { name: true, unitOfMeasure: true, targetUnit: true } },
                                interventionArea: { 
                                    select: { 
                                        villageName: true,
                                        blockName: true,
                                        district: true
                                    } 
                                }
                            }
                        });

                        // Add AI-generated metadata to the plan object for response
                        const planWithMetadata = {
                            ...plan,
                            aiMetadata: {
                                strategy: aiResponse.strategy,
                                reasoning: aiResponse.reasoning,
                                totalDistributed: aiResponse.totalDistributed
                            }
                        };

                        createdPlans.push(planWithMetadata);
                        console.log(`Created plan for activity: ${activity.name} in project ${project.name}`);

                        // 7️⃣ Create audit log
                        try {
                            await prisma.auditLog.create({
                                data: {
                                    organizationId: session.user.organizationId || '',
                                    userId: session.user.id,
                                    action: "CREATE",
                                    resource: "Plan",
                                    resourceId: plan.id,
                                    timestamp: new Date(),
                                },
                            });
                        } catch (err) {
                            console.error("Audit log error for plan:", err);
                        }

                    } catch (error) {
                        console.error(`Error creating plan for activity ${activity.name} in project ${project.name}:`, error);
                        skippedActivities.push({
                            projectName: project.name,
                            activityName: activity.name,
                            reason: error instanceof Error ? error.message : 'Unknown error'
                        });
                        continue;
                    }
                }

            } catch (error) {
                console.error(`Error processing project ${project.name}:`, error);
                continue;
            }
        }

        // 8️⃣ Generate summary statistics
        const summary = {
            totalPlans: createdPlans.length,
            projectsProcessed: projects.length,
            plansPerProject: createdPlans.reduce((acc, plan) => {
                const projectName = plan.project.name;
                acc[projectName] = (acc[projectName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            totalMonthlyTargets: createdPlans.reduce((total, plan) => {
                const monthlyValues = Object.values(plan.monthlyTargets || {}) as number[];
                return total + monthlyValues.reduce((sum, val) => sum + (val || 0), 0);
            }, 0),
            distributionStrategies: createdPlans.reduce((acc, plan) => {
                const strategy = plan.aiMetadata?.strategy || 'unknown';
                acc[strategy] = (acc[strategy] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            planYearRange: {
                start: planStart.toISOString(),
                end: planEnd.toISOString(),
                label: `FY ${planStart.getFullYear()}-${String((planEnd.getFullYear()) % 100).padStart(2, "0")}`
            },
            skippedActivities: skippedActivities.length,
            skippedActivityDetails: skippedActivities
        };

        return NextResponse.json({
            created: createdPlans.map(({ aiMetadata, ...plan }) => plan), // Remove AI metadata from final response
            summary,
            message: `Successfully generated ${createdPlans.length} plans across ${projects.length} projects for ${summary.planYearRange.label}`
        });

    } catch (err) {
        console.error("AI Project Plan Seeder API error:", err);
        return NextResponse.json({ 
            error: "Failed to generate project plans",
            details: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}