import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { organizationId, numActivitiesPerProject = 3 } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (numActivitiesPerProject < 1 || numActivitiesPerProject > 10) {
            return NextResponse.json({ error: "Number of activities per project must be between 1 and 10" }, { status: 400 });
        }

        // 1️⃣ Fetch all projects for the organization with related data
        const projects = await prisma.project.findMany({
            where: { organizationId },
            include: {
                objectives: true,
                programs: {
                    include: {
                        indicators: {
                            where: { level: 'PROGRAM' }
                        },
                        interventions: {
                            include: {
                                SubIntervention: true
                            }
                        }
                    }
                },
                indicators: {
                    where: { level: 'PROJECT' }
                }
            }
        });

        if (!projects.length) {
            return NextResponse.json({ error: "No projects found for this organization" }, { status: 404 });
        }

        console.log(`Found ${projects.length} projects for organization ${organizationId}`);

        const createdActivities: any[] = [];

        // 2️⃣ Process each project
        for (const project of projects) {
            try {
                if (!project.objectives.length) {
                    console.warn(`Skipping project ${project.name} - no objectives found`);
                    continue;
                }

                // Get all interventions from project's programs
                const allInterventions = project.programs.flatMap(program => 
                    program.interventions.map(intervention => ({
                        ...intervention,
                        programId: program.id,
                        programName: program.name
                    }))
                );

                if (!allInterventions.length) {
                    console.warn(`Skipping project ${project.name} - no interventions found`);
                    continue;
                }

                // Get all program and project indicators
                const allIndicators = [
                    ...project.programs.flatMap(program => program.indicators),
                    ...project.indicators
                ];

                if (!allIndicators.length) {
                    console.warn(`Skipping project ${project.name} - no indicators found`);
                    continue;
                }

                // 3️⃣ Generate activity data using AI
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
                const aiPrompt = `
Generate ${numActivitiesPerProject} realistic project activities for the following project:

PROJECT: "${project.name}"
DESCRIPTION: "${project.description}"
THEME: "${project.theme}"
BUDGET: ${project.totalBudget} ${project.currency}

AVAILABLE OBJECTIVES:
${project.objectives.map(obj => `${obj.id}: "${obj.description}" (${obj.level})`).join('\n')}

AVAILABLE INDICATORS:
${allIndicators.map(ind => `${ind.id}: "${ind.name}" (${ind.type})`).join('\n')}

AVAILABLE INTERVENTIONS & SUB-INTERVENTIONS:
${allInterventions.map(intervention => 
    `${intervention.id}: "${intervention.name}" (Program: ${intervention.programName})\n` +
    intervention.SubIntervention.map(sub => `  - ${sub.id}: "${sub.name}"`).join('\n')
).join('\n\n')}

ACTIVITY TYPES: Training, Household, Infrastructure, General activity

IMPORTANT: Return ONLY a valid JSON array with no additional text, comments, or markdown formatting.

Generate activities that are realistic and diverse. Each activity should include:

{
  "projectId": "${project.id}",
  "objectiveId": "objectiveId (must be from available objectives)",
  "indicatorId": "indicatorId (must be from available indicators)",
  "intervention": "interventionId (must be from available interventions)",
  "subIntervention": "subInterventionId (must be from selected intervention's sub-interventions)",
  "name": "string (clear, measurable activity name)",
  "description": "string (detailed activity description)",
  "activityType": "Training|Household|Infrastructure|General activity",
  "startDate": "YYYY-MM (start month)",
  "endDate": "YYYY-MM (end month, at least 1 month after start)",
  "unitOfMeasure": "string (unit of measurement)",
  "targetUnit": "number (target quantity)",
  "costPerUnit": "number (cost per unit)",
  "totalBudget": "number (targetUnit * costPerUnit)",
  "leverage": "string (optional leverage details)"
}

Ensure:
1. Activities are diverse and complement each other
2. All IDs exist in the provided lists
3. Sub-interventions belong to the selected intervention
4. Activities align with project theme and objectives
5. Budget allocations are realistic
6. Start/end dates are logical (within project timeframe)
7. Unit of measure matches the activity type
8. Total budget calculation is correct
`;

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" },
                });

                let activitiesData: any[] = [];
                let responseText = '';
                let cleanedResponse = '';

                try {
                    responseText = result.response.text();
                    console.log(`Raw AI response for project ${project.name}:`, responseText.substring(0, 300));
                    
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
                    
                    activitiesData = JSON.parse(cleanedResponse);
                    
                    if (!Array.isArray(activitiesData)) {
                        throw new Error("AI response is not an array");
                    }
                } catch (e) {
                    console.error(`Failed to parse AI response for project ${project.name}:`, e);
                    continue;
                }

                // 4️⃣ Validate and create activities
                for (const activityData of activitiesData) {
                    try {
                        // Validate required fields
                        if (!activityData.name || !activityData.objectiveId || !activityData.indicatorId) {
                            console.warn(`Skipping activity with missing required fields:`, activityData);
                            continue;
                        }

                        // Validate objective exists in project
                        const validObjective = project.objectives.find(obj => obj.id === activityData.objectiveId);
                        if (!validObjective) {
                            console.warn(`Invalid objectiveId for project ${project.name}:`, activityData.objectiveId);
                            continue;
                        }

                        // Validate indicator exists
                        const validIndicator = allIndicators.find(ind => ind.id === activityData.indicatorId);
                        if (!validIndicator) {
                            console.warn(`Invalid indicatorId for project ${project.name}:`, activityData.indicatorId);
                            continue;
                        }

                        // Validate intervention and sub-intervention
                        const validIntervention = allInterventions.find(int => int.id === activityData.intervention);
                        if (!validIntervention) {
                            console.warn(`Invalid intervention for project ${project.name}:`, activityData.intervention);
                            continue;
                        }

                        const validSubIntervention = validIntervention.SubIntervention.find(
                            sub => sub.id === activityData.subIntervention
                        );
                        if (!validSubIntervention) {
                            console.warn(`Invalid subIntervention for project ${project.name}:`, activityData.subIntervention);
                            continue;
                        }

                        // Create activity
                        const activity = await prisma.activity.create({
                            data: {
                                organizationId,
                                projectId: project.id,
                                objectiveId: activityData.objectiveId,
                                indicatorId: activityData.indicatorId,
                                interventionId: activityData.intervention,
                                subInterventionId: activityData.subIntervention,
                                name: activityData.name,
                                description: activityData.description || null,
                                type: activityData.activityType || 'General activity',
                                startDate: new Date(activityData.startDate + '-01'),
                                endDate: new Date(activityData.endDate + '-01'),
                                unitOfMeasure: activityData.unitOfMeasure,
                                targetUnit: activityData.targetUnit,
                                costPerUnit: activityData.costPerUnit,
                                totalBudget: activityData.totalBudget,
                                leverage: activityData.leverage || null,
                                status: 'PLANNED'
                            },
                            include: {
                                project: { select: { name: true } },
                                objective: { select: { description: true } },
                                indicator: { select: { name: true } },
                                Intervention: { select: { name: true } },
                                subInterventionRel: { select: { name: true } }
                            }
                        });

                        createdActivities.push(activity);
                        console.log(`Created activity: ${activity.name} for project ${project.name}`);

                    } catch (error) {
                        console.error(`Error creating activity for project ${project.name}:`, error);
                        continue;
                    }
                }

            } catch (error) {
                console.error(`Error processing project ${project.name}:`, error);
                continue;
            }
        }

        return NextResponse.json({
            created: createdActivities,
            summary: {
                totalActivities: createdActivities.length,
                projectsProcessed: projects.length,
                activitiesPerProject: createdActivities.reduce((acc, activity) => {
                    const projectName = activity.project.name;
                    acc[projectName] = (acc[projectName] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                totalBudget: createdActivities.reduce((total, activity) => 
                    total + (activity.totalBudget || 0), 0
                ),
                activityTypes: createdActivities.reduce((acc, activity) => {
                    acc[activity.type] = (acc[activity.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            }
        });

    } catch (err) {
        console.error("AI Project Activity Seeder API error:", err);
        return NextResponse.json({ error: "Failed to generate project activities" }, { status: 500 });
    }
}