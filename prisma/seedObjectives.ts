import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // fast & good for JSON
});

async function generateObjectives(orgId: string, prompt: string) {
  const schema = `
  model Objective {
    id             String   @id @default(cuid())
    organizationId String
    programId      String?
    projectId      String?
    code           String
    level          String // Goal, Outcome, Output, Activity
    description    String
    orderIndex     Int
  }
  `;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a data seeder. Based on the schema:\n${schema}\n\nGenerate only JSON array of 5-10 realistic objectives for this request:\n${prompt}\n\nFormat strictly as JSON with no extra text do not do anything with program id and project id leave them null.`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const objectives = JSON.parse(result.response.text());

  for (let i = 0; i < objectives.length; i++) {
    await prisma.objective.create({
      data: {
        ...objectives[i],
        organizationId: orgId,
        code: objectives[i].code ?? `OBJ-${i + 1}`,
        orderIndex: objectives[i].orderIndex ?? i,
      },
    });
  }

  console.log(`✅ Inserted ${objectives.length} objectives`);
}

// Run from CLI
const orgId = process.argv[2];
const userPrompt = process.argv.slice(3).join(" ") || "Create 5 generic objectives for eduction";

if (!orgId) {
  console.error("❌ Provide an organizationId as first argument");
  process.exit(1);
}

generateObjectives(orgId, userPrompt)
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
