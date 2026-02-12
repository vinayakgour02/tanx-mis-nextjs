
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { orgId, prompt } = await req.json();

    if (!orgId || !prompt) {
      return NextResponse.json({ error: "orgId and prompt are required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prisma schema snippet for AI reference
    const schema = `
    model state { id String @id @default(cuid()) name String organizationId String district district[] block[] }
    model district { id String @id @default(cuid()) name String stateId String? block block[] }
    model block { id String @id @default(cuid()) name String districtId String? gramPanchaya gramPanchayat[] areaType areaType }
    model gramPanchayat { id String @id @default(cuid()) name String blockId String? village village[] }
    model village { id String @id @default(cuid()) name String gramPanchayatId String? }
    
    enum areaType {
      RURAL
      URBAN
    }
    `;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Based on this Prisma schema:\n${schema}\n\nGenerate JSON array of states with nested districts, blocks, gramPanchayats, and villages for organization ${orgId}. 
Make realistic names only for india. Return strict JSON array only, no extra text.\nPrompt: ${prompt}\n\nIMPORTANT: areaType must be ONLY "RURAL" or "URBAN" (no other values allowed)\n\nExample format:
[
  {
    "name": "Maharashtra",
    "districts": [
      {
        "name": "Mumbai",
        "blocks": [
          {
            "name": "Andheri",
            "areaType": "URBAN",
            "gramPanchayats": [
              {
                "name": "Andheri East GP",
                "villages": [
                  { "name": "Village 1" },
                  { "name": "Village 2" }
                ]
              }
            ]
          },
          {
            "name": "Rural Block",
            "areaType": "RURAL",
            "gramPanchayats": [
              {
                "name": "Rural GP",
                "villages": [
                  { "name": "Village A" }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    console.log("AI Response:", responseText);
    
    let hierarchy;
    try {
      hierarchy = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    // Ensure hierarchy is an array
    if (!Array.isArray(hierarchy)) {
      console.error("Hierarchy is not an array:", hierarchy);
      return NextResponse.json({ error: "AI response must be an array of states" }, { status: 500 });
    }

    // Insert hierarchy into database
    console.log(`Processing ${hierarchy.length} states for organization ${orgId}`);
    
    const createdStates = await Promise.all(
      hierarchy.map(async (s: any, index: number) => {
        console.log(`Creating state ${index + 1}: ${s.name}`);
        
        if (!s.name) {
          console.error(`State at index ${index} has no name:`, s);
          throw new Error(`State at index ${index} is missing a name`);
        }
        const createdState = await prisma.state.create({
          data: {
            name: s.name,
            organizationId: orgId,
          },
        });

        if (s.districts?.length) {
          console.log(`Creating ${s.districts.length} districts for state: ${s.name}`);
          await Promise.all(
            s.districts.map(async (d: any, dIndex: number) => {
              if (!d.name) {
                console.error(`District at index ${dIndex} in state ${s.name} has no name:`, d);
                throw new Error(`District at index ${dIndex} in state ${s.name} is missing a name`);
              }
              const createdDistrict = await prisma.district.create({
                data: {
                  name: d.name,
                  stateId: createdState.id,
                  organizationId: orgId,
                },
              });

              if (d.blocks?.length) {
                await Promise.all(
                  d.blocks.map(async (b: any) => {
                    // Validate and normalize areaType
                    let areaType = (b.areaType ?? "RURAL").toUpperCase();
                    if (areaType !== "RURAL" && areaType !== "URBAN") {
                      console.warn(`Invalid areaType "${b.areaType}" for block "${b.name}", defaulting to RURAL`);
                      areaType = "RURAL";
                    }
                    
                    const createdBlock = await prisma.block.create({
                      data: {
                        name: b.name,
                        districtId: createdDistrict.id,
                        organizationId: orgId,
                        areaType: areaType as "RURAL" | "URBAN",
                      },
                    });

                    if (b.gramPanchayats?.length) {
                      await Promise.all(
                        b.gramPanchayats.map(async (g: any) => {
                          const createdGP = await prisma.gramPanchayat.create({
                            data: {
                              name: g.name,
                              blockId: createdBlock.id,
                              organizationId: orgId,
                            },
                          });

                          if (g.villages?.length) {
                            await Promise.all(
                              g.villages.map((v: any) =>
                                prisma.village.create({
                                  data: {
                                    name: v.name,
                                    gramPanchayatId: createdGP.id,
                                    organizationId: orgId,
                                  },
                                })
                              )
                            );
                          }
                        })
                      );
                    }
                  })
                );
              }
            })
          );
        }

        return createdState;
      })
    );

    return NextResponse.json({ createdStates });
  } catch (err) {
    console.error("Location Seeder API error:", err);
    return NextResponse.json({ error: "Failed to seed locations" }, { status: 500 });
  }
}
