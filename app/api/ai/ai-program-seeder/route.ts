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

        const { organizationId, numPrograms = 5, programThemes, budget } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (numPrograms < 1 || numPrograms > 10) {
            return NextResponse.json({ error: "Number of programs must be between 1 and 10" }, { status: 400 });
        }

        console.log(`Starting AI program generation for organization ${organizationId} with ${numPrograms} programs`);

        // 1️⃣ Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true, mission: true, type: true }
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        console.log(`Found organization: ${organization.name}`);

        const createdPrograms: any[] = [];

        // 2️⃣ Generate program data using AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const aiPrompt = `
Generate ${numPrograms} realistic development program proposals for an organization.

ORGANIZATION CONTEXT:
Name: "${organization.name}"
Mission: "${organization.mission || 'Not specified'}"
Type: "${organization.type || 'Development'}"

${programThemes ? `PROGRAM THEMES (focus on these): ${programThemes}` : ''}
${budget ? `BUDGET RANGE: ${budget}` : ''}

Generate a JSON array of ${numPrograms} programs with the following structure:
[
  {
    "name": "Clear, descriptive program name",
    "description": "Detailed program description (100-300 words)",
    "theme": "SDG theme (e.g., SDG 1 - No Poverty, SDG 4 - Quality Education)",
    "sector": "Program sector (Education, Health, Agriculture, etc.)",
    "priority": "HIGH", // LOW, MEDIUM, HIGH, CRITICAL
    "budget": 500000, // Number in INR
    "baseline": 0, // Starting metric value
    "target": 1000, // Target metric value
    "startDate": "2024-04-01", // Program start date
    "endDate": "2027-03-31" // Program end date (3 years)
  }
]

REQUIREMENTS:
- Names should be unique and specific to the program focus
- Descriptions should be comprehensive and realistic
- Use appropriate SDG themes that align with the organization's mission
- Set realistic budgets (100,000 to 5,000,000 INR)
- Choose appropriate priority levels
- Set meaningful baseline and target values
- Use standard fiscal year dates (April to March)
- Ensure variety in sectors and themes
- All programs should have status "ACTIVE" 

Return ONLY the JSON array, no additional text or formatting.`;

        console.log("Sending AI prompt for program generation");

        const result = await model.generateContent(aiPrompt);
        let responseText = result.response.text();

        console.log(`AI response received (${responseText.length} characters)`);

        // 3️⃣ Parse AI response with robust error handling
        let programsData: any[];
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
            programsData = JSON.parse(cleanJson);
            
            if (!Array.isArray(programsData)) {
                throw new Error("AI response is not an array");
            }
            
            console.log(`Successfully parsed ${programsData.length} programs from AI response`);
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            console.error("Raw AI response:", responseText.substring(0, 500));
            return NextResponse.json({ 
                error: "Failed to parse AI response. Please try again.",
                details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
            }, { status: 500 });
        }

        // 4️⃣ Create programs in database
        for (const [index, programData] of programsData.entries()) {
            try {
                console.log(`Creating program ${index + 1}: ${programData.name}`);

                // Validate required fields
                if (!programData.name || !programData.description) {
                    console.warn(`Skipping program ${index + 1} - missing required fields`);
                    continue;
                }

                // Create program using transaction
                const program = await prisma.$transaction(async (tx) => {
                    const newProgram = await tx.program.create({
                        data: {
                            organizationId,
                            name: programData.name,
                            description: programData.description,
                            theme: programData.theme || null,
                            sector: programData.sector || null,
                            priority: programData.priority || 'MEDIUM',
                            budget: programData.budget ? Number(programData.budget) : null,
                            baseline: programData.baseline ? Number(programData.baseline) : null,
                            target: programData.target ? Number(programData.target) : null,
                            startDate: programData.startDate ? new Date(programData.startDate) : null,
                            endDate: programData.endDate ? new Date(programData.endDate) : null,
                            status: 'ACTIVE', // Set status to ACTIVE as requested
                        },
                    });

                    return newProgram;
                });

                createdPrograms.push({
                    id: program.id,
                    name: program.name,
                    description: program.description,
                    theme: program.theme,
                    sector: program.sector,
                    priority: program.priority,
                    budget: program.budget ? Number(program.budget) : null,
                    status: program.status,
                    startDate: program.startDate?.toISOString(),
                    endDate: program.endDate?.toISOString(),
                });

                console.log(`✓ Successfully created program: ${program.name}`);
            } catch (programError) {
                console.error(`Failed to create program ${index + 1}:`, programError);
                console.error("Program data:", JSON.stringify(programData, null, 2));
                // Continue with next program instead of failing entirely
                continue;
            }
        }

        console.log(`Program generation completed. Created ${createdPrograms.length} programs.`);

        // 5️⃣ Audit logging
        try {
            await prisma.auditLog.create({
                data: {
                    organizationId,
                    userId: session.user?.id || 'unknown',
                    action: 'AI_PROGRAM_GENERATION',
                    resource: 'Program',
                    resourceId: createdPrograms.length > 0 ? createdPrograms[0].id : null,
                    ipAddress: null,
                    userAgent: null,
                    timestamp: new Date(),
                },
            });
        } catch (auditError) {
            console.error("Failed to create audit log:", auditError);
            // Don't fail the entire operation for audit logging issues
        }

        // 6️⃣ Return success response
        return NextResponse.json({
            message: `Successfully generated ${createdPrograms.length} programs`,
            created: createdPrograms,
            summary: {
                totalPrograms: createdPrograms.length,
                organizationId,
                organizationName: organization.name,
            }
        });
    } catch (err) {
        console.error("AI Program Seeder API error:", err);
        return NextResponse.json({ 
            error: "Failed to generate programs",
            details: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}