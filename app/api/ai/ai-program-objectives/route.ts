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

        const { organizationId, objectivesPerProgram = 3 } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (objectivesPerProgram < 1 || objectivesPerProgram > 8) {
            return NextResponse.json({ error: "Number of objectives per program must be between 1 and 8" }, { status: 400 });
        }

        console.log(`Starting AI objective generation for organization ${organizationId} with ${objectivesPerProgram} objectives per program`);

        // 1️⃣ Verify organization exists and fetch programs
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                programs: {
                    where: { status: 'ACTIVE' }, // Only process active programs
                    select: { 
                        id: true, 
                        name: true, 
                        description: true, 
                        theme: true, 
                        sector: true,
                        priority: true,
                        budget: true
                    }
                }
            }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        if (!organization.programs.length) {
            return NextResponse.json({ error: "No active programs found for this organization" }, { status: 404 });
        }

        console.log(`Found organization: ${organization.name} with ${organization.programs.length} active programs`);

        const createdObjectives: any[] = [];
        let totalObjectivesCreated = 0;

        // 2️⃣ Loop over each program and generate objectives
        for (const program of organization.programs) {
            console.log(`Processing program: ${program.name}`);

            try {
                // 3️⃣ Generate objectives using AI
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
                const aiPrompt = `
Generate ${objectivesPerProgram} realistic program objectives for the following program:

ORGANIZATION CONTEXT:
Organization: "${organization.name}"
Mission: "${organization.mission || 'Not specified'}"

PROGRAM DETAILS:
Program Name: "${program.name}"
Description: "${program.description || 'No description provided'}"
Theme: "${program.theme || 'Not specified'}"
Sector: "${program.sector || 'Not specified'}"
Priority: "${program.priority}"
Budget: ${program.budget ? `${program.budget} INR` : 'Not specified'}

Generate a JSON array of ${objectivesPerProgram} objectives with the following structure:
[
  {
    "level": "Impact|Outcome|Output|Activity",
    "description": "Clear, specific, and measurable objective description (100-200 words)",
    "orderIndex": 0
  }
]

REQUIREMENTS:
- Create objectives at different levels (Impact, Outcome, Output, Activity)
- Ensure objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Align objectives with the program's theme and sector
- Consider the program's budget and priority level
- Descriptions should be comprehensive and actionable
- Use appropriate order index (0, 1, 2, etc.)
- Focus on realistic outcomes for the program's scope

Return ONLY the JSON array, no additional text or formatting.`;

                console.log(`Sending AI prompt for program: ${program.name}`);

                const result = await model.generateContent(aiPrompt);
                let responseText = result.response.text();

                console.log(`AI response received for program ${program.name} (${responseText.length} characters)`);

                // 4️⃣ Parse AI response with robust error handling
                let objectivesData: any[];
                try {
                    // Clean the response text
                    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    
                    // Find JSON boundaries
                    const jsonStart = responseText.indexOf('[');
                    const jsonEnd = responseText.lastIndexOf(']') + 1;
                    
                    if (jsonStart === -1 || jsonEnd === 0) {
                        throw new Error("No JSON array found in AI response");
                    }
                    
                    const cleanJson = responseText.substring(jsonStart, jsonEnd);
                    objectivesData = JSON.parse(cleanJson);
                    
                    if (!Array.isArray(objectivesData)) {
                        throw new Error("AI response is not an array");
                    }
                    
                    console.log(`Successfully parsed ${objectivesData.length} objectives for program ${program.name}`);
                } catch (parseError) {
                    console.error(`Failed to parse AI response for program ${program.name}:`, parseError);
                    console.error("Raw AI response:", responseText.substring(0, 500));
                    // Continue with next program instead of failing entirely
                    continue;
                }

                // 5️⃣ Create objectives in database for this program
                const programObjectives: any[] = [];
                for (const [index, objectiveData] of objectivesData.entries()) {
                    try {
                        // Validate required fields
                        if (!objectiveData.description || !objectiveData.level) {
                            console.warn(`Skipping objective ${index + 1} for program ${program.name} - missing required fields`);
                            continue;
                        }

                        // Generate a unique code
                        const code = `${program.name.substring(0, 3).toUpperCase()}-OBJ-${String(index + 1).padStart(2, '0')}`;

                        const objective = await prisma.objective.create({
                            data: {
                                organizationId,
                                programId: program.id,
                                projectId: null, // Program objectives don't belong to projects
                                code,
                                level: objectiveData.level,
                                description: objectiveData.description,
                                orderIndex: objectiveData.orderIndex ?? index,
                            },
                        });

                        programObjectives.push({
                            id: objective.id,
                            code: objective.code,
                            level: objective.level,
                            description: objective.description,
                            programName: program.name,
                            programId: program.id,
                            orderIndex: objective.orderIndex,
                        });

                        totalObjectivesCreated++;
                        console.log(`✓ Created objective: ${objective.code} for program ${program.name}`);
                    } catch (objectiveError) {
                        console.error(`Failed to create objective ${index + 1} for program ${program.name}:`, objectiveError);
                        // Continue with next objective instead of failing entirely
                        continue;
                    }
                }

                if (programObjectives.length > 0) {
                    createdObjectives.push({
                        programId: program.id,
                        programName: program.name,
                        objectives: programObjectives
                    });
                }

                console.log(`✓ Successfully created ${programObjectives.length} objectives for program: ${program.name}`);
            } catch (programError) {
                console.error(`Failed to process program ${program.name}:`, programError);
                // Continue with next program instead of failing entirely
                continue;
            }
        }

        console.log(`Objective generation completed. Created ${totalObjectivesCreated} objectives across ${createdObjectives.length} programs.`);

        // 6️⃣ Audit logging
        try {
            await prisma.auditLog.create({
                data: {
                    organizationId,
                    userId: session.user?.id || 'unknown',
                    action: 'AI_PROGRAM_OBJECTIVES_GENERATION',
                    resource: 'Objective',
                    resourceId: totalObjectivesCreated > 0 ? createdObjectives[0]?.objectives[0]?.id : null,
                    ipAddress: null,
                    userAgent: null,
                    timestamp: new Date(),
                },
            });
        } catch (auditError) {
            console.error("Failed to create audit log:", auditError);
            // Don't fail the entire operation for audit logging issues
        }

        // 7️⃣ Return success response
        return NextResponse.json({
            message: `Successfully generated ${totalObjectivesCreated} objectives across ${createdObjectives.length} programs`,
            created: createdObjectives,
            summary: {
                totalObjectives: totalObjectivesCreated,
                programsProcessed: createdObjectives.length,
                organizationId,
                organizationName: organization.name,
                objectivesPerProgram,
            }
        });
    } catch (err) {
        console.error("AI Program Objectives Seeder API error:", err);
        return NextResponse.json({ 
            error: "Failed to generate program objectives",
            details: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}