import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { organizationId, numInterventionsPerObjective = 2, numSubInterventionsPerIntervention = 3 } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        // 1️⃣ Fetch programs for this organization with their objectives and indicators
        const programs = await prisma.program.findMany({
            where: { organizationId },
            include: {
                objectives: {
                    include: {
                        indicators: true, // Get objective-specific indicators
                    },
                },
                indicators: true, // Get program-level indicators as fallback
            },
        });

        if (!programs.length) {
            return NextResponse.json({ error: "No programs found for this organization" }, { status: 404 });
        }

        const createdInterventions: any[] = [];

        // 2️⃣ Loop over each program
        for (const program of programs) {
            console.log(`Processing program: ${program.name} with ${program.objectives.length} objectives`);
            
            if (!program.objectives.length) {
                console.log(`Skipping program ${program.name} - no objectives found`);
                continue;
            }

            // 3️⃣ Generate interventions for each objective in the program
            for (const objective of program.objectives) {
                console.log(`Generating interventions for objective: ${objective.description}`);
                
                // Get indicators for this specific objective, fallback to program indicators
                const objectiveIndicators = objective.indicators && objective.indicators.length > 0 
                    ? objective.indicators 
                    : program.indicators.filter((ind: any) => ind.objectiveId === objective.id);
                
                // If no objective-specific indicators, use all program indicators as fallback
                const availableIndicators = objectiveIndicators.length > 0 
                    ? objectiveIndicators 
                    : program.indicators;
                
                console.log(`Found ${availableIndicators.length} indicators for objective: ${objective.description}`);
                
                if (availableIndicators.length === 0) {
                    console.log(`Skipping objective ${objective.description} - no indicators available`);
                    continue;
                }
                // Prepare AI prompt with program context
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const aiPrompt = `
Generate ${numInterventionsPerObjective} realistic interventions for the following objective within this program context:

PROGRAM CONTEXT:
Name: "${program.name}"
Description: "${program.description || 'No description provided'}"
Theme: "${program.theme || 'Not specified'}"
Sector: "${program.sector || 'Not specified'}"
Budget: ${program.budget || 'Not specified'}

OBJECTIVE: "${objective.description}"
Level: "${objective.level}"

AVAILABLE INDICATORS FOR THIS OBJECTIVE:
${availableIndicators.map((ind: any) => `- ${ind.name}: ${ind.definition}`).join('\n')}

Generate interventions that are specifically relevant to this program's context and objective. Each intervention should have ${numSubInterventionsPerIntervention} sub-interventions.

IMPORTANT: Return ONLY a valid JSON array with no additional text, comments, or markdown formatting.

Return strictly JSON array. Each item should include:
{
  "name": "string (intervention name)",
  "description": "string (intervention description)",
  "subInterventions": [
    {
      "name": "string (sub-intervention name)",
      "description": "string (sub-intervention description)",
      "suggestedIndicatorIds": ["indicatorId1", "indicatorId2"] // Use IDs from available indicators that match this sub-intervention
    }
  ]
}

Make sure the interventions:
1. Are actionable and specific to the program's scope
2. Align with the objective's level and description
3. Consider the program's theme and sector
4. Are realistic for the given budget and context
5. Sub-interventions should be measurable activities
6. Link sub-interventions to relevant indicators from the available list

AVAILABLE INDICATOR IDS AND NAMES FOR THIS OBJECTIVE:
${availableIndicators.map((ind: any) => `${ind.id}: "${ind.name}"`).join('\n')}
`;

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" },
                });

                let interventions: any[] = [];

                try {
                    const responseText = result.response.text();
                    console.log("Raw AI response for objective", objective.id, ":", responseText);
                    
                    // Clean up the response text by removing any markdown formatting or extra characters
                    const cleanedResponse = responseText
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*/g, '')
                        .replace(/^[^\[\{]*/, '') // Remove any text before the first [ or {
                        .replace(/[^\]\}]*$/, '') // Remove any text after the last ] or }
                        .trim();
                    
                    interventions = JSON.parse(cleanedResponse);
                    
                    // Validate that the result is an array
                    if (!Array.isArray(interventions)) {
                        console.error("AI response is not an array for objective:", objective.id);
                        continue;
                    }
                } catch (e) {
                    console.error("Failed to parse AI response for objective:", objective.id, "Error:", e);
                    console.error("Raw response text:", result.response.text());
                    continue;
                }

                // 4️⃣ Insert interventions into Prisma
                for (const interventionData of interventions) {
                    try {
                        // Validate intervention data structure
                        if (!interventionData.name || typeof interventionData.name !== 'string') {
                            console.error("Invalid intervention data - missing or invalid name:", interventionData);
                            continue;
                        }
                        
                        if (!interventionData.subInterventions || !Array.isArray(interventionData.subInterventions)) {
                            console.error("Invalid intervention data - missing or invalid subInterventions:", interventionData);
                            continue;
                        }

                        // Prepare sub-interventions data
                        const subInterventionData = interventionData.subInterventions.map((si: any) => {
                            // Validate sub-intervention structure
                            if (!si.name || typeof si.name !== 'string') {
                                console.warn("Skipping sub-intervention with invalid name:", si);
                                return null;
                            }
                            
                            // Filter valid indicator IDs from suggestions (use objective-specific indicators)
                            const validIndicatorIds = (si.suggestedIndicatorIds || []).filter((id: string) => 
                                availableIndicators.some((ind: any) => ind.id === id)
                            );
                            
                            console.log(`Sub-intervention "${si.name}" suggested ${si.suggestedIndicatorIds?.length || 0} indicators, ${validIndicatorIds.length} are valid`);

                            // If we have valid indicators, create multiple sub-interventions (one per indicator)
                            if (validIndicatorIds.length > 0) {
                                return validIndicatorIds.map((indicatorId: string) => {
                                    const indicator = availableIndicators.find((ind: any) => ind.id === indicatorId);
                                    console.log(`Linking sub-intervention "${si.name}" to indicator "${indicator?.name}"`);
                                    return {
                                        name: si.name,
                                        description: si.description || null,
                                        indicatorId: indicatorId,
                                    };
                                });
                            } else {
                                // Create sub-intervention without indicator if none matched
                                console.log(`Creating sub-intervention "${si.name}" without indicator linking`);
                                return [{
                                    name: si.name,
                                    description: si.description || null,
                                }];
                            }
                        }).filter(Boolean).flat();

                        const intervention = await prisma.intervention.create({
                            data: {
                                name: interventionData.name,
                                objectiveId: objective.id,
                                programs: {
                                    connect: { id: program.id },
                                },
                                SubIntervention: subInterventionData.length > 0 ? {
                                    create: subInterventionData,
                                } : undefined,
                            },
                            include: {
                                programs: true,
                                SubIntervention: {
                                    include: { Indicator: true },
                                },
                                objective: true,
                            },
                        });

                        createdInterventions.push(intervention);
                        const linkedIndicators = intervention.SubIntervention.filter(si => si.Indicator).length;
                        console.log(`Successfully created intervention: ${intervention.name} with ${intervention.SubIntervention.length} sub-interventions (${linkedIndicators} linked to indicators)`);
                    } catch (error) {
                        console.error("Error creating intervention:", interventionData.name, "Error:", error);
                        // Continue processing other interventions instead of breaking
                        continue;
                    }
                }
            }
        }

        return NextResponse.json({ 
            created: createdInterventions,
            summary: {
                totalInterventions: createdInterventions.length,
                totalSubInterventions: createdInterventions.reduce((total, intervention) => 
                    total + intervention.SubIntervention.length, 0
                ),
                linkedSubInterventions: createdInterventions.reduce((total, intervention) => 
                    total + intervention.SubIntervention.filter((si: any) => si.Indicator).length, 0
                ),
                programsProcessed: programs.length,
                programsWithObjectives: programs.filter(p => p.objectives.length > 0).length,
            }
        });
    } catch (err) {
        console.error("AI Program Activities API error:", err);
        return NextResponse.json({ error: "Failed to generate program activities" }, { status: 500 });
    }
}