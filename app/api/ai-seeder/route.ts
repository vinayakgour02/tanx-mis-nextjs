import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { orgId, prompt } = await req.json();

    if (!orgId || !prompt) {
      return NextResponse.json({ error: "orgId and prompt are required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const schema = `
    model Objective {
      id             String   @id @default(cuid())
      organizationId String
      programId      String? will be null strictly
      projectId      String? will be null strictly
      code           String
      level          String // Impact, Outcome, Output, Activity
      description    String
      orderIndex     Int
    }`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Based on this Prisma schema:\n${schema}\n\nGenerate only JSON array of 5–10 realistic objectives  for this request:\n${prompt}\n\nStrict JSON, no extra text.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const objectives = JSON.parse(result.response.text());

    const created = await Promise.all(
      objectives.map((o: any, i: number) =>
        prisma.objective.create({
          data: {
            organizationId: orgId,
            programId: o.programId ?? null,
            projectId: o.projectId ?? null,
            code: o.code ?? `OBJ-${i + 1}`,
            level: o.level ?? "General",
            description: o.description ?? "No description",
            orderIndex: o.orderIndex ?? i,
          },
        })
      )
    );

    return NextResponse.json({ created });
  } catch (err) {
    console.error("Seeder API error:", err);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
