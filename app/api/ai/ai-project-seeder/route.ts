import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { organizationId, numProjects = 2, projectThemes, budget, donors } = await req.json();

        if (!organizationId) {
            return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
        }

        if (numProjects < 1 || numProjects > 10) {
            return NextResponse.json({ error: "Number of projects must be between 1 and 10" }, { status: 400 });
        }

        // 1️⃣ Fetch available programs, donors, organization indicators, program indicators, and locations for context
        const [programs, availableDonors, organizationIndicators, availableStates] = await Promise.all([
            prisma.program.findMany({
                where: { organizationId },
                select: { id: true, name: true, theme: true, sector: true, description: true }
            }),
            prisma.donor.findMany({
                where: { organizationId },
                select: { id: true, name: true, type: true }
            }),
            prisma.organizationIndicator.findMany({
                where: { organizationId },
                select: { id: true, name: true, type: true, definition: true }
            }),
            prisma.state.findMany({
                where: { organizationId },
                include: {
                    district: {
                        include: {
                            block: {
                                include: {
                                    grampanchaya: {
                                        include: {
                                            village: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Fetch program indicators for all available programs
        const programIndicators = await prisma.indicator.findMany({
            where: {
                organizationId,
                programId: { in: programs.map(p => p.id) },
                level: 'PROGRAM'
            },
            select: {
                id: true,
                name: true,
                type: true,
                definition: true,
                programId: true,
                program: {
                    select: { name: true }
                }
            }
        });

        if (!programs.length) {
            return NextResponse.json({ error: "No programs found for this organization" }, { status: 404 });
        }

        if (!availableStates.length) {
            return NextResponse.json({ error: "No locations found for this organization. Please create states and districts first using the location seeder." }, { status: 404 });
        }

        console.log(`Found ${programs.length} programs, ${availableDonors.length} donors, ${organizationIndicators.length} organization indicators, ${programIndicators.length} program indicators, and ${availableStates.length} states for organization ${organizationId}`);

        const createdProjects: any[] = [];

        // 2️⃣ Generate project data using AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const aiPrompt = `
Generate ${numProjects} realistic development project proposals with complete details for an organization.

AVAILABLE PROGRAMS (select from these):
${programs.map(p => `${p.id}: "${p.name}" - ${p.theme || 'No theme'} (${p.sector || 'No sector'})`).join('\n')}

AVAILABLE DONORS (select from these):
${availableDonors.map(d => `${d.id}: "${d.name}" (${d.type})`).join('\n')}

AVAILABLE PROGRAM INDICATORS (OPTIONAL for project indicators as parent indicators):
${programIndicators.map(pi => `${pi.id}: "${pi.name}" - ${pi.type} from ${pi.program?.name} (${pi.definition})`).join('\n')}

AVAILABLE LOCATIONS (select from these for intervention areas):
${availableStates.map((state: any) => 
    `STATE: ${state.id} - "${state.name}"\n` +
    state.district.map((district: any) => 
        `  DISTRICT: ${district.id} - "${district.name}"\n` +
        district.block.map((block: any) => 
            `    BLOCK: ${block.id} - "${block.name}" (${block.areaType})\n` +
            block.grampanchaya.map((gp: any) => 
                `      GP: ${gp.id} - "${gp.name}"\n` +
                gp.village.map((village: any) => 
                    `        VILLAGE: ${village.id} - "${village.name}"`
                ).join('\n')
            ).join('\n')
        ).join('\n')
    ).join('\n')
).join('\n\n')}

THEMES TO FOCUS ON: ${projectThemes || 'Education, Health, Environment, Agriculture, Women Empowerment'}
BUDGET RANGE: ${budget || '100000-2000000'} (in local currency)

IMPORTANT: Return ONLY a valid JSON array with no additional text, comments, or markdown formatting.

Generate projects that are realistic and diverse. Each project should include:

{
  "name": "string (project name)",
  "description": "string (detailed project description, min 50 words)",
  "theme": "string (project theme)",
  "status": "PLANNED",
  "baseline": "number (baseline value if applicable)",
  "target": "number (target value if applicable)",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD (at least 6 months after start)",
  "directBeneficiaries": "number (50-10000)",
  "indirectBeneficiaries": "number (100-50000)",
  "totalBudget": "number (within specified range)",
  "currency": "INR",
  "goal": "string (overall project goal)",
  "programIds": ["programId1", "programId2"] // 1-3 relevant programs from available list,
  "objectives": [
    {
      "code": "OBJ-001",
      "level": "GOAL|OUTCOME|OUTPUT",
      "description": "string (objective description)",
      "orderIndex": "number (1, 2, 3...)"
    }
  ], // 3-5 objectives per project
  "indicators": [
    {
      "name": "string (indicator name)",
      "type": "OUTPUT|OUTCOME|IMPACT",
      "level": "PROJECT",
      "definition": "string (how indicator is measured)",
      "rationale": "string (why this indicator)",
      "dataSource": "string (data collection method)",
      "frequency": "MONTHLY|QUARTERLY|ANNUALLY",
      "unitOfMeasure": "PERCENTAGE|COUNT|RATIO|CURRENCY|SCORE|HOURS|DAYS|UNITS|OTHER",
      "disaggregateBy": "string (optional disaggregation)",
      "baselineValue": "string (baseline value)",
      "target": "string (target value)",
      "programIndicatorId": "programIndicatorId (OPTIONAL - can link to a program indicator as parent)"
    }
  ], // 2-4 indicators per project
  "funding": [
    {
      "donorId": "donorId",
      "amount": "number (portion of total budget)",
      "currency": "INR",
      "year": "number (current year or next)"
    }
  ], // 1-3 funding sources
  "interventionAreas": [
    {
      "stateId": "stateId (MANDATORY - must be from available states)",
      "districtId": "districtId (MANDATORY - must be from available districts)",
      "blockId": "blockId (OPTIONAL - can be from available blocks)",
      "gramPanchayatId": "gramPanchayatId (OPTIONAL - can be from available gram panchayats)",
      "villageId": "villageId (OPTIONAL - can be from available villages)",
      "serialNumber": "number (1, 2, 3... for ordering)",
      "status": "PLANNED",
      "type": "RURAL|URBAN (based on block area type)"
    }
  ] // 2-5 intervention areas per project
}

Ensure:
1. Projects are diverse in themes and approaches
2. Dates are realistic (start dates within next 6 months, end dates 6-36 months later)
3. Budget allocations across donors sum up to total budget
4. Objectives are hierarchical (GOAL -> OUTCOME -> OUTPUT)
5. Indicators are measurable and specific
6. All programIds and donorIds exist in the provided lists
7. Beneficiary numbers are realistic for the project scope
8. OPTIONAL: Project indicators can optionally have a programIndicatorId from the program indicators list as parent indicators
9. Only use indicator IDs that exist in the provided lists
11. MANDATORY: Each project must have 2-5 intervention areas with valid location IDs from the available locations
12. Intervention areas must have at least stateId and districtId, other location levels are optional
13. Use realistic geographic distribution - don't cluster all areas in one location
`;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
            generationConfig: { responseMimeType: "application/json" },
        });

        let projectsData: any[] = [];
        let responseText = '';
        let cleanedResponse = '';

        try {
            responseText = result.response.text();
            console.log("Raw AI response length:", responseText.length);
            console.log("Raw AI response start:", responseText.substring(0, 500));
            
            // Clean up the response text more thoroughly
            cleanedResponse = responseText
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            
            // Remove any text before the first [ or {
            const jsonStart = Math.min(
                cleanedResponse.indexOf('[') !== -1 ? cleanedResponse.indexOf('[') : Infinity,
                cleanedResponse.indexOf('{') !== -1 ? cleanedResponse.indexOf('{') : Infinity
            );
            
            if (jsonStart !== Infinity) {
                cleanedResponse = cleanedResponse.substring(jsonStart);
            }
            
            // Find the end of the JSON by counting brackets
            let bracketCount = 0;
            let inString = false;
            let escapeNext = false;
            let jsonEnd = -1;
            
            for (let i = 0; i < cleanedResponse.length; i++) {
                const char = cleanedResponse[i];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                
                if (char === '"' && !escapeNext) {
                    inString = !inString;
                    continue;
                }
                
                if (!inString) {
                    if (char === '[' || char === '{') {
                        bracketCount++;
                    } else if (char === ']' || char === '}') {
                        bracketCount--;
                        if (bracketCount === 0) {
                            jsonEnd = i + 1;
                            break;
                        }
                    }
                }
            }
            
            if (jsonEnd !== -1) {
                cleanedResponse = cleanedResponse.substring(0, jsonEnd);
            }
            
            // Additional cleaning: fix common JSON issues
            cleanedResponse = cleanedResponse
                // Fix trailing commas
                .replace(/,\s*([}\]])/g, '$1')
                // Fix missing quotes around property names
                .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3')
                // Fix apostrophes in text content (don't convert to double quotes)
                .replace(/([a-zA-Z])'([a-zA-Z])/g, '$1\'$2')
                // Fix single quotes around string values to double quotes
                .replace(/(:\s*)'([^']*)'(\s*[,}\]])/g, '$1"$2"$3')
                // Remove any remaining non-JSON characters at the end
                .replace(/[^}\]]*$/, '');
            
            console.log("Cleaned response length:", cleanedResponse.length);
            console.log("Cleaned response start:", cleanedResponse.substring(0, 500));
            console.log("Cleaned response end:", cleanedResponse.substring(cleanedResponse.length - 500));
            
            // Try to parse the JSON
            projectsData = JSON.parse(cleanedResponse);
            
            if (!Array.isArray(projectsData)) {
                console.error("AI response is not an array");
                return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
            }
        } catch (e) {
            console.error("Failed to parse AI response:", e);
            console.error("Cleaned response that failed to parse:", cleanedResponse);
            
            // Try a more aggressive cleaning approach as fallback
            try {
                // Extract just the array content by finding the first [ and last ]
                const arrayStart = cleanedResponse.indexOf('[');
                const arrayEnd = cleanedResponse.lastIndexOf(']');
                
                if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
                    const arrayContent = cleanedResponse.substring(arrayStart, arrayEnd + 1);
                    projectsData = JSON.parse(arrayContent);
                    console.log("Successfully parsed with fallback method");
                } else {
                    throw new Error("Could not extract valid JSON array");
                }
            } catch (fallbackError) {
                console.error("Fallback parsing also failed:", fallbackError);
                return NextResponse.json({ 
                    error: "Failed to parse AI response", 
                    details: e instanceof Error ? e.message : String(e),
                    responseLength: responseText.length
                }, { status: 500 });
            }
        }

        // 3️⃣ Process and create each project
        for (const projectData of projectsData) {
            try {
                // Validate required fields
                if (!projectData.name || !projectData.description) {
                    console.warn("Skipping project with missing required fields:", projectData);
                    continue;
                }

                // Validate program IDs
                const validProgramIds = (projectData.programIds || []).filter((id: string) => 
                    programs.some(p => p.id === id)
                );

                if (validProgramIds.length === 0) {
                    console.warn("No valid program IDs found for project:", projectData.name);
                    continue;
                }

                // Validate donor IDs in funding
                const validFunding = (projectData.funding || []).filter((fund: any) => 
                    availableDonors.some(d => d.id === fund.donorId)
                );

                // Validate and process indicators with program linking only
                const validIndicators = (projectData.indicators || []).filter((ind: any) => {
                    // Check if programIndicatorId is valid (optional but recommended for project indicators)
                    if (ind.programIndicatorId && !programIndicators.some(pi => pi.id === ind.programIndicatorId)) {
                        console.warn(`Indicator ${ind.name} has invalid programIndicatorId, removing it:`, ind.programIndicatorId);
                        ind.programIndicatorId = null; // Remove invalid program indicator ID
                    }

                    console.log(`Valid indicator ${ind.name} - programIndicatorId: ${ind.programIndicatorId || 'none'}`);
                    return true;
                });

                if (validIndicators.length === 0) {
                    console.warn(`Skipping project ${projectData.name} - no valid indicators`);
                    continue;
                }

                // Validate and process intervention areas
                const validInterventionAreas = (projectData.interventionAreas || []).filter((area: any) => {
                    // Check if stateId is provided and valid (mandatory)
                    if (!area.stateId || !availableStates.some((state: any) => state.id === area.stateId)) {
                        console.warn(`Skipping intervention area - invalid or missing stateId:`, area.stateId);
                        return false;
                    }

                    // Check if districtId is provided and valid (mandatory)
                    const validState = availableStates.find((state: any) => state.id === area.stateId);
                    if (!area.districtId || !validState?.district.some((district: any) => district.id === area.districtId)) {
                        console.warn(`Skipping intervention area - invalid or missing districtId:`, area.districtId);
                        return false;
                    }

                    // Optional validations for deeper hierarchy
                    const validDistrict = validState.district.find((district: any) => district.id === area.districtId);
                    if (area.blockId && !validDistrict?.block.some((block: any) => block.id === area.blockId)) {
                        console.warn(`Intervention area has invalid blockId, removing it:`, area.blockId);
                        area.blockId = null;
                    }

                    if (area.gramPanchayatId && area.blockId) {
                        const validBlock = validDistrict?.block.find((block: any) => block.id === area.blockId);
                        if (!validBlock?.grampanchaya.some((gp: any) => gp.id === area.gramPanchayatId)) {
                            console.warn(`Intervention area has invalid gramPanchayatId, removing it:`, area.gramPanchayatId);
                            area.gramPanchayatId = null;
                        }
                    }

                    if (area.villageId && area.gramPanchayatId) {
                        const validGP = validDistrict?.block.find((block: any) => block.id === area.blockId)?.grampanchaya.find((gp: any) => gp.id === area.gramPanchayatId);
                        if (!validGP?.village.some((village: any) => village.id === area.villageId)) {
                            console.warn(`Intervention area has invalid villageId, removing it:`, area.villageId);
                            area.villageId = null;
                        }
                    }

                    console.log(`Valid intervention area - stateId: ${area.stateId}, districtId: ${area.districtId}`);
                    return true;
                });

                if (validInterventionAreas.length === 0) {
                    console.warn(`Skipping project ${projectData.name} - no valid intervention areas`);
                    continue;
                }

                // Create project using transaction
                const project = await prisma.$transaction(async (tx) => {
                    const newProject = await tx.project.create({
                        data: {
                            organizationId,
                            name: projectData.name,
                            description: projectData.description,
                            theme: projectData.theme || null,
                            status: projectData.status || 'PLANNED',
                            baseline: projectData.baseline || null,
                            target: projectData.target || null,
                            startDate: new Date(projectData.startDate),
                            endDate: new Date(projectData.endDate),
                            directBeneficiaries: projectData.directBeneficiaries || null,
                            indirectBeneficiaries: projectData.indirectBeneficiaries || null,
                            totalBudget: projectData.totalBudget,
                            currency: projectData.currency || 'INR',
                            goal: projectData.goal || null,

                            // Connect to programs
                            programs: {
                                connect: validProgramIds.map((id: string) => ({ id })),
                            },

                            // Create objectives
                            objectives: {
                                create: (projectData.objectives || []).map((obj: any, index: number) => ({
                                    level: obj.level || 'OUTPUT',
                                    description: obj.description,
                                    orderIndex: obj.orderIndex || index + 1,
                                    code: obj.code || `OBJ-${String(index + 1).padStart(3, '0')}`,
                                })),
                            },

                            // Create funding
                            funding: {
                                create: validFunding.map((fund: any) => ({
                                    donorId: fund.donorId,
                                    amount: fund.amount,
                                    currency: fund.currency || 'INR',
                                    year: fund.year || new Date().getFullYear(),
                                })),
                            },

                            // Create intervention areas
                            interventionAreas: {
                                create: validInterventionAreas.map((area: any, index: number) => ({
                                    serialNumber: area.serialNumber || index + 1,
                                    stateId: area.stateId,
                                    districtId: area.districtId,
                                    blockId: area.blockId || null,
                                    gramPanchayatId: area.gramPanchayatId || null,
                                    villageId: area.villageId || null,
                                    status: area.status || 'PLANNED',
                                    type: area.type || 'RURAL',
                                    date: new Date(),
                                })),
                            },
                        },
                        include: {
                            programs: true,
                            objectives: true,
                            funding: {
                                include: {
                                    donor: true,
                                },
                            },
                            interventionAreas: {
                                include: {
                                    state: { select: { name: true } },
                                    district: { select: { name: true } },
                                    blockName: { select: { name: true } },
                                    gramPanchayat: { select: { name: true } },
                                    villageName: { select: { name: true } },
                                },
                            },
                        },
                    });

                    // Create indicators separately and link them to objectives
                    const createdIndicators = [];
                    for (let i = 0; i < validIndicators.length; i++) {
                        const ind = validIndicators[i];
                        // Link indicator to a random objective from the created project
                        const randomObjective = newProject.objectives[i % newProject.objectives.length];
                        
                        const indicator = await tx.indicator.create({
                            data: {
                                name: ind.name,
                                type: ind.type || 'OUTPUT',
                                level: ind.level || 'PROJECT',
                                definition: ind.definition,
                                rationale: ind.rationale || null,
                                dataSource: ind.dataSource,
                                frequency: ind.frequency || 'QUARTERLY',
                                unitOfMeasure: ind.unitOfMeasure || 'COUNT',
                                disaggregateBy: ind.disaggregateBy || null,
                                baselineValue: ind.baselineValue || null,
                                target: ind.target || null,
                                ...(ind.programIndicatorId && {
                                    parentIndicator: { connect: { id: ind.programIndicatorId } }
                                }),
                                organization: { connect: { id: organizationId } },
                                project: { connect: { id: newProject.id } },
                                objective: { connect: { id: randomObjective.id } },
                            },
                        });
                        createdIndicators.push(indicator);
                    }

                    // Return the complete project with indicators
                    return {
                        ...newProject,
                        indicators: createdIndicators
                    };
                });

                createdProjects.push(project);
                console.log(`Successfully created project: ${project.name} with ${project.objectives.length} objectives, ${project.indicators.length} indicators, and ${project.interventionAreas.length} intervention areas`);

            } catch (error) {
                console.error("Error creating project:", projectData.name, "Error:", error);
                continue;
            }
        }

        return NextResponse.json({ 
            created: createdProjects,
            summary: {
                totalProjects: createdProjects.length,
                totalObjectives: createdProjects.reduce((total, project) => 
                    total + project.objectives.length, 0
                ),
                totalIndicators: createdProjects.reduce((total, project) => 
                    total + project.indicators.length, 0
                ),
                totalInterventionAreas: createdProjects.reduce((total, project) => 
                    total + project.interventionAreas.length, 0
                ),
                totalFunding: createdProjects.reduce((total, project) => 
                    total + project.funding.reduce((fundingTotal: number, fund: any) => 
                        fundingTotal + (fund.amount || 0), 0
                    ), 0
                ),
                programsConnected: programs.length,
                donorsConnected: availableDonors.length,
                statesUsed: availableStates.length,
            }
        });
    } catch (err) {
        console.error("AI Project Seeder API error:", err);
        return NextResponse.json({ error: "Failed to generate projects" }, { status: 500 });
    }
}