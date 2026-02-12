import { NextResponse } from "next/server";
import XlsxPopulate from "xlsx-populate";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { Project, Objective, Indicator, Program, Intervention, SubIntervention } from "@prisma/client";

// Define the extended types with relations
type ExtendedProject = Project & {
    objectives: (Objective & {
        indicators: Indicator[];
    })[];
    programs: (Program & {
        interventions: (Intervention & {
            SubIntervention: SubIntervention[];
        })[];
    })[];
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.user.organizationId;

        // -------------------------------
        // Fetch project & related data
        // -------------------------------
        const project = await prisma.project.findFirst({
            where: { id: projectId, organizationId },
            include: {
                objectives: {
                    include: {
                        indicators: true,
                    },
                },
                programs: {
                    include: {
                        interventions: {
                            include: {
                                SubIntervention: true
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }


        // Flatten data
        const extendedProject = project as ExtendedProject;
        const objectives = extendedProject.objectives || [];
        const indicators = objectives.flatMap((o) => o.indicators || []);
        const interventions = extendedProject.programs.flatMap((p) => p.interventions || []);
        const subInterventions = interventions.flatMap((i) => i.SubIntervention || []);

        // -------------------------------
        // Workbook setup
        // -------------------------------
        const workbook = await (XlsxPopulate as any).fromBlankAsync();
        const sheet = workbook.sheet(0).name("Activity Template");

        // Title Row
        sheet.cell("A1").value(`Activity Bulk Upload Template - ${project.name}`);
        sheet.range("A1:M1").style({ bold: true, fontSize: 14 });

        // Instruction Row
        sheet
            .cell("A2")
            .value(
                "👉 Fill one activity per row. Use dropdowns where available. Do not alter hidden sheets."
            )
            .style({ italic: true, fontColor: "555555" });

        // Headers
        const headers = [
            "Objective",
            "Indicator",
            "Intervention",
            "Sub-Intervention",
            "Activity Name",
            "Activity Type",
            "Start Month (YYYY-MM)",
            "End Month (YYYY-MM)",
            "Unit of Measurement",
            "Target Unit",
            "Cost per Unit",
            "Total Budget (auto)",
            "Leverage (optional)",
        ];
        headers.forEach((h, i) => sheet.cell(3, i + 1).value(h));

        sheet.range("A3:M3").style({
            bold: true,
            fill: "eaeaea",
            border: true,
            horizontalAlignment: "center",
        });

        // Column widths
        sheet.column("A").width(22);
        sheet.column("B").width(22);
        sheet.column("C").width(22);
        sheet.column("D").width(22);
        sheet.column("E").width(28);
        sheet.column("F").width(18);
        sheet.column("G").width(18);
        sheet.column("H").width(18);
        sheet.column("I").width(22);
        sheet.column("J").width(14);
        sheet.column("K").width(14);
        sheet.column("L").width(18);
        sheet.column("M").width(25);

        // -------------------------------
        // Hidden "Lists" sheet for dropdown data
        // -------------------------------
        const listSheet = workbook.addSheet("Lists").hidden(true);
        objectives.forEach((o: Objective, idx: number) => listSheet.cell(idx + 1, 1).value(o.description));
        indicators.forEach((i: Indicator, idx: number) => listSheet.cell(idx + 1, 2).value(i.name));
        interventions.forEach((i: Intervention, idx: number) => listSheet.cell(idx + 1, 3).value(i.name));
        subInterventions.forEach((s: SubIntervention, idx: number) => listSheet.cell(idx + 1, 4).value(s.name));
        const activityTypes = ["Training", "Household", "Infrastructure", "General Activity"];
        activityTypes.forEach((a: string, idx: number) => listSheet.cell(idx + 1, 5).value(a));

        // -------------------------------
        // Metadata + ID Map
        // -------------------------------
        const metaSheet = workbook.addSheet("__meta").hidden(true);
        metaSheet.cell("A1").value("projectId");
        metaSheet.cell("B1").value(projectId);
        metaSheet.cell("A2").value("organizationId");
        metaSheet.cell("B2").value(organizationId);

        const idMap = workbook.addSheet("__idmap").hidden(true);
        idMap.cell("A1").value("Objective Name");
        idMap.cell("B1").value("Objective ID");
        idMap.cell("D1").value("Indicator Name");
        idMap.cell("E1").value("Indicator ID");
        idMap.cell("G1").value("Intervention Name");
        idMap.cell("H1").value("Intervention ID");
        idMap.cell("J1").value("SubIntervention Name");
        idMap.cell("K1").value("SubIntervention ID");

        objectives.forEach((o: Objective, i: number) => {
            idMap.cell(i + 2, 1).value(o.description);
            idMap.cell(i + 2, 2).value(o.id);
        });
        indicators.forEach((ind: Indicator, i: number) => {
            idMap.cell(i + 2, 4).value(ind.name);
            idMap.cell(i + 2, 5).value(ind.id);
        });
        interventions.forEach((intv: Intervention, i: number) => {
            idMap.cell(i + 2, 7).value(intv.name);
            idMap.cell(i + 2, 8).value(intv.id);
        });
        subInterventions.forEach((sub: SubIntervention, i: number) => {
            idMap.cell(i + 2, 10).value(sub.name);
            idMap.cell(i + 2, 11).value(sub.id);
        });

        // -------------------------------
        // Dropdowns & Formulas
        // -------------------------------
        const objRange = `='Lists'!$A$1:$A$${objectives.length}`;
        const indRange = `Lists!$B$1:$B$${indicators.length}`;
        const intRange = `Lists!$C$1:$C$${interventions.length}`;
        const subIntRange = `Lists!$D$1:$D$${subInterventions.length}`;
        const typeRange = `Lists!$E$1:$E$${activityTypes.length}`;

        for (let i = 4; i <= 100; i++) {
            sheet.cell(i, 1).dataValidation({
                type: "list",
                formula1: objRange,
                allowBlank: true,
                showDropDown: true,
                showErrorMessage: true,
                errorTitle: "Invalid Selection",
                error: "Please select a valid Objective from the dropdown list.",
            });

            sheet.cell(i, 2).dataValidation({
                type: "list",
                formula1: indRange,
                allowBlank: true,
                showDropDown: true,
                showErrorMessage: true,
                errorTitle: "Invalid Selection",
                error: "Please select a valid Indicator from the dropdown list.",
            });

            sheet.cell(i, 3).dataValidation({
                type: "list",
                formula1: intRange,
                allowBlank: true,
                showDropDown: true,
                showErrorMessage: true,
                errorTitle: "Invalid Selection",
                error: "Please select a valid Intervention from the dropdown list.",
            });

            sheet.cell(i, 4).dataValidation({
                type: "list",
                formula1: subIntRange,
                allowBlank: true,
                showDropDown: true,
                showErrorMessage: true,
                errorTitle: "Invalid Selection",
                error: "Please select a valid Sub-Intervention from the dropdown list.",
            });

            sheet.cell(i, 6).dataValidation({
                type: "list",
                formula1: typeRange,
                allowBlank: true,
                showDropDown: true,
                showErrorMessage: true,
                errorTitle: "Invalid Selection",
                error: "Please select a valid Activity Type from the dropdown list.",
            });

            // Auto formula for total budget
            sheet.cell(i, 12).formula(`J${i}*K${i}`);

        }


        const buffer = await workbook.outputAsync();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Activity_Bulk_Template_${project.name}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Excel generation failed:", error);
        return NextResponse.json(
            { error: "Failed to generate template" },
            { status: 500 }
        );
    }
}