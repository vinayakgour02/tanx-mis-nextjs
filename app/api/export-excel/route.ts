import XlsxPopulate from "xlsx-populate";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const objectives = await prisma.objective.findMany({
      where: {
        programId: programId ?? undefined,
        program: { organizationId },
      },
      include: {
        indicators: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const indicators = objectives.flatMap((o) => o.indicators);

    const workbook = await (XlsxPopulate as any).fromBlankAsync();
    const sheet = workbook.sheet(0).name("Template");

    // Header
    const headers = [
      "Objective (select from list)",
      "Intervention Name",
      "Sub-Intervention",
      "Indicator (select from list)"
    ];
    sheet.row(1).style({ bold: true, fill: "fbeec1" });
    headers.forEach((h, i) => sheet.cell(1, i + 1).value(h));

    // Blank rows
    for (let i = 2; i <= 20; i++) {
      sheet.cell(i, 1).value("");
      sheet.cell(i, 2).value("");
      sheet.cell(i, 3).value("");
      sheet.cell(i, 4).value("");
    }

    // -------------------------------
    // Hidden Sheets
    // -------------------------------

    // 1️⃣ Dropdown source list
    const listSheet = (workbook as any).addSheet("Lists").hidden(true);
    objectives.forEach((o, idx) => listSheet.cell(idx + 1, 1).value(o.description));
    indicators.forEach((i, idx) => listSheet.cell(idx + 1, 2).value(i.name));

    // 2️⃣ Metadata sheet
    const metaSheet = (workbook as any).addSheet("__meta").hidden(true);
    metaSheet.cell("A1").value("programId");
    metaSheet.cell("B1").value(programId);

    // 3️⃣ ID mapping sheet
    const idMapSheet = (workbook as any).addSheet("__idmap").hidden(true);
    idMapSheet.cell("A1").value("objectiveName");
    idMapSheet.cell("B1").value("objectiveId");
    idMapSheet.cell("D1").value("indicatorName");
    idMapSheet.cell("E1").value("indicatorId");

    objectives.forEach((o, i) => {
      idMapSheet.cell(i + 2, 1).value(o.description);
      idMapSheet.cell(i + 2, 2).value(o.id);
    });

    indicators.forEach((ind, i) => {
      idMapSheet.cell(i + 2, 4).value(ind.name);
      idMapSheet.cell(i + 2, 5).value(ind.id);
    });

    // -------------------------------
    // Dropdown validations
    // -------------------------------
    const objRange = `Lists!$A$1:$A$${objectives.length}`;
    const indRange = `Lists!$B$1:$B$${indicators.length}`;

    for (let i = 2; i <= 20; i++) {
      sheet.cell(i, 1).dataValidation({
        type: "list",
        allowBlank: true,
        formula1: objRange,
        showInputMessage: true,
        promptTitle: "Select Objective",
        prompt: "Choose a valid program objective.",
      });
      sheet.cell(i, 4).dataValidation({
        type: "list",
        allowBlank: true,
        formula1: indRange,
        showInputMessage: true,
        promptTitle: "Select Indicator",
        prompt: "Choose a valid program indicator.",
      });
    }

    // -------------------------------
    // Export the file
    // -------------------------------
    const buffer = await workbook.outputAsync();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Intervention_Bulk_Template.xlsx`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate Excel template" },
      { status: 500 }
    );
  }
}