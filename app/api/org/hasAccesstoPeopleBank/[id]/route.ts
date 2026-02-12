// app/api/org/hasAccesstoPeopleBank/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID is missing" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      hasAccesstoPeopleBank: true,
      hasAccessToAssetManagement: true, // ✅ added
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(org);
}
