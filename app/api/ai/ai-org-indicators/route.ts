import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { organizationId, prompt, numIndicatorsPerObjective = 3 } = await req.json();

        if (!organizationId || !prompt) {
            return NextResponse.json({ error: "organizationId and prompt are required" }, { status: 400 });
        }

        // 1️⃣ Fetch objectives for this organization
        const objectives = await prisma.objective.findMany({
            where: { organizationId },
        });

        if (!objectives.length) {
            return NextResponse.json({ error: "No objectives found for this organization" }, { status: 404 });
        }

        const createdIndicators: any[] = [];

        // 2️⃣ Loop over each objective
        for (const objective of objectives) {
            // Prepare AI prompt
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const aiPrompt = `
Generate ${numIndicatorsPerObjective} realistic indicators for the following objective:
"${objective.description}" keep the optional data as string.

Return strictly JSON array. Each item should include:
  organizationId String
  objectiveId    String
  name           String         @db.VarChar(255)
  type           IndicatorType //OUTPUT, OUTCOME, IMPACT
  level          IndicatorLevel //'ORGANIZATION'
  definition     String         @db.Text

  // Data Collection
  dataSource    String @db.VarChar(255)
  frequency     String @db.VarChar(100) (MONTHLY, QUARTERLY, ANNUALLY, ONE_TIME)
  unitOfMeasure String @db.VarChar(100) (PERCENTAGE, COUNT, RATIO, CURRENCY, SCORE, HOURS, DAYS, KILOMETERS, KILOGRAMS, UNITS, OTHER)

  // Baseline & Target
  target        String  @db.VarChar(255)


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

            // 3️⃣ Insert into Prisma
            const saved = await Promise.all(
                indicators.map((i, idx) =>
                    prisma.organizationIndicator.create({
                        data: {
                            organizationId,
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

        return NextResponse.json({ created: createdIndicators });
    } catch (err) {
        console.error("AI Org Indicators API error:", err);
        return NextResponse.json({ error: "Failed to generate organization indicators" }, { status: 500 });
    }
}
