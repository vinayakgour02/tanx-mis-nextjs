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
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { organizationId, reportsPerActivity = 2, reportStatus = "DRAFT" } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (reportsPerActivity < 1 || reportsPerActivity > 5) {
            return NextResponse.json({ error: "Number of reports per activity must be between 1 and 5" }, { status: 400 });
        }

        // 1️⃣ Fetch all projects for the organization with related data
        const projects = await prisma.project.findMany({
            where: { 
                organizationId,
                status: 'ACTIVE' // Only generate reports for active projects
            },
            include: {
                activities: {
                    where: {
                        status: { in: ['ACTIVE', 'PLANNED'] } // Include both ACTIVE and PLANNED activities
                    },
                    include: {
                        Intervention: true,
                        subInterventionRel: true,
                        objective: true,
                        indicator: true
                    }
                },
                interventionAreas: {
                    include: {
                        state: true,
                        district: true,
                        blockName: true,
                        villageName: true,
                        gramPanchayat: true
                    }
                },
                programs: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!projects.length) {
            return NextResponse.json({ error: "No active projects found for this organization" }, { status: 404 });
        }

        console.log(`Found ${projects.length} active projects for organization ${organizationId}`);

        const createdReports: any[] = [];
        let totalActivitiesProcessed = 0;
        let totalReportsCreated = 0;

        // 2️⃣ Process each project
        for (const project of projects) {
            try {
                if (!project.activities.length) {
                    console.warn(`Skipping project ${project.name} - no activities found`);
                    continue;
                }

                if (!project.interventionAreas.length) {
                    console.warn(`Skipping project ${project.name} - no intervention areas found`);
                    continue;
                }

                console.log(`Processing project: ${project.name} with ${project.activities.length} activities`);
                
                // Log activity details for debugging
                if (project.activities.length > 0) {
                    project.activities.forEach(activity => {
                        console.log(`  - Activity: ${activity.name} (Status: ${activity.status})`);
                    });
                }

                // 3️⃣ Process each activity in the project
                for (const activity of project.activities) {
                    try {
                        totalActivitiesProcessed++;

                        // Get a random intervention area for this project
                        const randomInterventionArea = project.interventionAreas[
                            Math.floor(Math.random() * project.interventionAreas.length)
                        ];

                        // 4️⃣ Generate report data using AI
                        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
                        const aiPrompt = `
Generate ${reportsPerActivity} realistic activity reports for the following activity:

PROJECT: "${project.name}"
ACTIVITY: "${activity.name}"
ACTIVITY TYPE: "${activity.type}"
DESCRIPTION: "${activity.description || 'No description provided'}"
UNIT OF MEASURE: "${activity.unitOfMeasure}"
TARGET UNIT: ${activity.targetUnit || 'Not specified'}
BUDGET: ${activity.totalBudget} (Cost per unit: ${activity.costPerUnit})

INTERVENTION: "${activity.Intervention?.name || 'Unknown'}"
SUB-INTERVENTION: "${activity.subInterventionRel?.name || 'Unknown'}"
OBJECTIVE: "${activity.objective?.description || 'Unknown'}"

INTERVENTION AREA: "${randomInterventionArea.state?.name || randomInterventionArea.state} - ${randomInterventionArea.district?.name || randomInterventionArea.district} - ${randomInterventionArea.blockName?.name || randomInterventionArea.blockName} - ${randomInterventionArea.villageName?.name || randomInterventionArea.villageName}"

IMPORTANT: Return ONLY a valid JSON array with no additional text, comments, or markdown formatting.

Generate realistic reports that show progress on this activity. Each report should include:

{
  "reportingDate": "YYYY-MM-DD (within last 6 months)",
  "reportingMonth": "Month name",
  "reportingQuarter": "Q1|Q2|Q3|Q4",
  "reportingYear": "FY24|FY25",
  "levelofActivity": "district|blockName|villageName",
  "location": "Specific location description",
  "gpsCoordinates": "latitude,longitude (realistic coordinates for India)",
  "unitReported": "number (realistic progress, not exceeding target)",
  "numberOfPeople": "number (if activity involves people, otherwise null)",
  "hasLeverage": "boolean",
  "leverageSources": "array of strings (Government, CSR, Community, NGO) or null",
  "leverageGovt": "number (amount in INR) or null",
  "leverageCsr": "number (amount in INR) or null",
  "leverageCommunity": "number (amount in INR) or null",
  "status": "${reportStatus}",
  "landscape": "Brief description of the location/landscape"
}

Ensure:
1. Reports show realistic progress (not all activities complete)
2. Unit reported should be reasonable based on target and activity type
3. Number of people should match activity type (Training activities need people)
4. Leverage information should be realistic (not all activities have leverage)
5. GPS coordinates should be realistic for Indian locations
6. Dates should be recent but realistic
7. Quarter and month should match
8. Level of activity should match the intervention area depth
`;

                        const result = await model.generateContent({
                            contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
                            generationConfig: { responseMimeType: "application/json" },
                        });

                        let reportsData: any[] = [];
                        let responseText = '';
                        let cleanedResponse = '';

                        try {
                            responseText = result.response.text();
                            console.log(`Raw AI response for activity ${activity.name}:`, responseText.substring(0, 200));
                            
                            // Clean up the response text
                            cleanedResponse = responseText
                                .replace(/```json\s*/g, '')
                                .replace(/```\s*/g, '')
                                .trim();
                            
                            // Find JSON boundaries
                            const jsonStart = Math.min(
                                cleanedResponse.indexOf('[') !== -1 ? cleanedResponse.indexOf('[') : Infinity,
                                cleanedResponse.indexOf('{') !== -1 ? cleanedResponse.indexOf('{') : Infinity
                            );
                            
                            if (jsonStart !== Infinity) {
                                cleanedResponse = cleanedResponse.substring(jsonStart);
                            }
                            
                            // Apply JSON cleaning
                            cleanedResponse = cleanedResponse
                                .replace(/,\s*([}\]])/g, '$1')
                                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
                                .replace(/([a-zA-Z])'([a-zA-Z])/g, '$1\'$2')
                                .replace(/(:\s*)'([^']*)'(\s*[,}\]])/g, '$1"$2"$3');
                            
                            reportsData = JSON.parse(cleanedResponse);
                            
                            if (!Array.isArray(reportsData)) {
                                throw new Error("AI response is not an array");
                            }
                        } catch (e) {
                            console.error(`Failed to parse AI response for activity ${activity.name}:`, e);
                            continue;
                        }

                        // 5️⃣ Validate and create reports
                        for (const reportData of reportsData) {
                            try {
                                // Validate required fields
                                if (!reportData.reportingDate || !reportData.reportingMonth || !reportData.unitReported) {
                                    console.warn(`Skipping report with missing required fields:`, reportData);
                                    continue;
                                }

                                // Validate unit reported doesn't exceed target
                                if (activity.targetUnit && reportData.unitReported > activity.targetUnit) {
                                    reportData.unitReported = Math.floor(activity.targetUnit * 0.8); // Set to 80% of target
                                }

                                // For training activities, ensure numberOfPeople is set
                                if (activity.type === "Training" && !reportData.numberOfPeople) {
                                    reportData.numberOfPeople = Math.max(1, Math.floor(reportData.unitReported * 15)); // Assume 15 people per training unit
                                }

                                // Create report
                                const report = await prisma.report.create({
                                    data: {
                                        organizationId,
                                        projectId: project.id,
                                        programId: project.programs[0]?.id || null,
                                        activityId: activity.id,
                                        interventionAreaId: randomInterventionArea.id,
                                        creatorId: session.user.id,
                                        type: activity.type || 'General activity',
                                        status: reportData.status || reportStatus,
                                        reportingDate: new Date(reportData.reportingDate),
                                        reportingMonth: reportData.reportingMonth,
                                        reportingQuarter: reportData.reportingQuarter,
                                        reportingYear: reportData.reportingYear,
                                        levelofActivity: reportData.levelofActivity || 'district',
                                        landscape: reportData.landscape || reportData.location,
                                        gpsCoordinates: reportData.gpsCoordinates,
                                        unitType: activity.unitOfMeasure,
                                        unitReported: reportData.unitReported,
                                        numberOfPeople: reportData.numberOfPeople || null,
                                        hasLeverage: reportData.hasLeverage || false,
                                        leverageSources: Array.isArray(reportData.leverageSources) 
                                            ? reportData.leverageSources.join(", ") 
                                            : reportData.leverageSources || "No Leverage",
                                        leverageGovt: reportData.leverageGovt || null,
                                        leverageCsr: reportData.leverageCsr || null,
                                        leverageCommunity: reportData.leverageCommunity || null,

                                        // Handle training report if it's a training activity
                                        ...(activity.type === "Training" && reportData.numberOfPeople && {
                                            trainingReport: {
                                                create: {
                                                    dateFrom: new Date(reportData.reportingDate),
                                                    dateTo: new Date(reportData.reportingDate),
                                                    // Generate some sample participants for training reports
                                                    participants: {
                                                        create: Array.from({ length: Math.min(reportData.numberOfPeople, 5) }, (_, i) => ({
                                                            name: `Participant ${i + 1}`,
                                                            age: 25 + Math.floor(Math.random() * 30),
                                                            gender: i % 2 === 0 ? 'Male' : 'Female',
                                                            education: ['Primary', 'Secondary', 'Graduate', 'Post Graduate'][Math.floor(Math.random() * 4)],
                                                            socialGroup: ['General', 'SC', 'ST', 'OBC'][Math.floor(Math.random() * 4)],
                                                            designation: 'Participant',
                                                            organization: 'Community',
                                                            mobile: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                                                            email: `participant${i + 1}@example.com`,
                                                            isPwd: Math.random() < 0.1, // 10% chance of being PWD
                                                        }))
                                                    }
                                                }
                                            }
                                        })
                                    },
                                    include: {
                                        project: { select: { name: true } },
                                        activity: { select: { name: true, type: true } },
                                        creator: { select: { firstName: true, lastName: true } },
                                        interventionArea: {
                                            select: {
                                                state: true,
                                                district: true,
                                                blockName: true,
                                                villageName: true
                                            }
                                        },
                                        trainingReport: {
                                            include: {
                                                participants: true
                                            }
                                        }
                                    }
                                });

                                // Create audit log
                                try {
                                    await prisma.auditLog.create({
                                        data: {
                                            organizationId,
                                            userId: session.user.id,
                                            action: 'CREATE',
                                            resource: 'Report',
                                            resourceId: report.id,
                                            timestamp: new Date(),
                                        },
                                    });
                                } catch (error) {
                                    console.error("Error creating audit log for report:", error);
                                }

                                createdReports.push(report);
                                totalReportsCreated++;
                                console.log(`Created report: ${report.id} for activity ${activity.name} in project ${project.name}`);

                            } catch (error) {
                                console.error(`Error creating report for activity ${activity.name}:`, error);
                                continue;
                            }
                        }

                    } catch (error) {
                        console.error(`Error processing activity ${activity.name}:`, error);
                        continue;
                    }
                }

            } catch (error) {
                console.error(`Error processing project ${project.name}:`, error);
                continue;
            }
        }

        return NextResponse.json({
            created: createdReports,
            summary: {
                totalReports: totalReportsCreated,
                totalActivitiesProcessed,
                projectsProcessed: projects.length,
                reportsPerProject: createdReports.reduce((acc, report) => {
                    const projectName = report.project.name;
                    acc[projectName] = (acc[projectName] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                reportTypes: createdReports.reduce((acc, report) => {
                    acc[report.activity.type] = (acc[report.activity.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                totalUnitReported: createdReports.reduce((total, report) => 
                    total + (report.unitReported || 0), 0
                ),
                totalPeopleReached: createdReports.reduce((total, report) => 
                    total + (report.numberOfPeople || 0), 0
                ),
                reportsByStatus: createdReports.reduce((acc, report) => {
                    acc[report.status] = (acc[report.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                trainingReports: createdReports.filter(r => r.activity.type === 'Training').length,
                totalParticipants: createdReports
                    .filter(r => r.trainingReport)
                    .reduce((total, report) => total + (report.trainingReport?.participants?.length || 0), 0)
            }
        });

    } catch (err) {
        console.error("AI Project Report Seeder API error:", err);
        return NextResponse.json({ error: "Failed to generate project reports" }, { status: 500 });
    }
}