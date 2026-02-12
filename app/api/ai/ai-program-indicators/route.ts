import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { organizationId, numIndicatorsPerProgram = 3 } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        // 1️⃣ Fetch programs for this organization with their objectives
        const programs = await prisma.program.findMany({
            where: { organizationId },
            include: {
                objectives: true,
            },
        });

        if (!programs.length) {
            return NextResponse.json({ error: "No programs found for this organization" }, { status: 404 });
        }

        const createdIndicators: any[] = [];

        // 2️⃣ Loop over each program
        for (const program of programs) {
            if (!program.objectives.length) {
                console.log(`Skipping program ${program.name} - no objectives found`);
                continue;
            }

            // Prepare program context for AI
            const programContext = {
                name: program.name,
                description: program.description,
                theme: program.theme,
                sector: program.sector,
                budget: program.budget,
                objectives: program.objectives.map(obj => ({
                    description: obj.description,
                    level: obj.level,
                })),
            };

            // 3️⃣ Generate indicators for each objective in the program
            for (const objective of program.objectives) {
                // Prepare AI prompt with program context
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const aiPrompt = `
Generate ${numIndicatorsPerProgram} realistic program-level indicators for the following objective within this program context:

PROGRAM CONTEXT:
Name: "${program.name}"
Description: "${program.description || 'No description provided'}"
Theme: "${program.theme || 'Not specified'}"
Sector: "${program.sector || 'Not specified'}"
Budget: ${program.budget || 'Not specified'}

OBJECTIVE: "${objective.description}"
Level: "${objective.level}"

Generate indicators that are specifically relevant to this program's context and the objective. Consider the program's theme, sector, and scope.

Return strictly JSON array. Each item should include:
{
  "organizationId": "${organizationId}",
  "programId": "${program.id}",
  "objectiveId": "${objective.id}",
  "name": "string",
  "type": "OUTPUT|OUTCOME|IMPACT",
  "level": "PROGRAM",
  "definition": "string",
  "rationale": "string (optional)",
  "dataSource": "string",
  "frequency": "MONTHLY|QUARTERLY|ANNUALLY|ONE_TIME",
  "unitOfMeasure": "PERCENTAGE|COUNT|RATIO|CURRENCY|SCORE|HOURS|DAYS|KILOMETERS|KILOGRAMS|UNITS|OTHER",
  "disaggregateBy": "string (optional)",
  "baselineValue": "string (optional)",
  "target": "string (optional)"
}

Make sure the indicators:
1. Are measurable and specific to the program's scope
2. Align with the objective's level and description
3. Consider the program's theme and sector
4. Are realistic for the given budget and context
5. Include appropriate data sources and measurement frequencies
`;

                const result = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" },
                });

                let indicators: any[] = [];

                try {
                    indicators = JSON.parse(result.response.text());
                } catch (e) {
                    console.error("Failed to parse AI response for objective:", objective.id, e);
                    continue;
                }

                // 4️⃣ Insert into Prisma (using the regular Indicator model for program-level indicators)
                const saved = await Promise.all(
                    indicators.map((i) =>
                        prisma.indicator.create({
                            data: {
                                organizationId,
                                programId: program.id,
                                objectiveId: objective.id,
                                name: i.name,
                                type: i.type,
                                level: i.level,
                                definition: i.definition,
                                rationale: i.rationale ?? null,
                                dataSource: i.dataSource,
                                frequency: i.frequency,
                                unitOfMeasure: i.unitOfMeasure,
                                disaggregateBy: i.disaggregateBy ?? null,
                                baselineValue: i.baselineValue ?? null,
                                target: i.target ?? null,
                            },
                        })
                    )
                );

                createdIndicators.push(...saved);
            }
        }

        return NextResponse.json({ 
            created: createdIndicators,
            summary: {
                totalIndicators: createdIndicators.length,
                programsProcessed: programs.length,
                programsWithObjectives: programs.filter(p => p.objectives.length > 0).length,
            }
        });
    } catch (err) {
        console.error("AI Program Indicators API error:", err);
        return NextResponse.json({ error: "Failed to generate program indicators" }, { status: 500 });
    }
}