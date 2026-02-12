import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/authOptions";

// GET /api/donors/[id] - Get a single donor
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const donor = await prisma.donor.findFirst({
      where: { id: params.id },
    });

    if (!donor) return new NextResponse("Donor not found", { status: 404 });

    return NextResponse.json(donor);
  } catch (error) {
    console.error("[DONOR_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/donors/[id] - Update a donor
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await req.json();

    const updatedDonor = await prisma.donor.update({
      where: { id: params.id },
      data: {
        name: json.name,
        type: json.type,
        code: json.code,
        description: json.description,
      },
    });

    // Optional: audit log
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const realIp = req.headers.get("x-real-ip") ?? "";
    const ipAddress = (forwardedFor.split(",")[0]?.trim() || realIp || undefined);
    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.auditLog.create({
      data: {
        organizationId: session?.user?.organizationId,
        userId: session.user.id ?? undefined,
        action: "UPDATE",
        resource: "Donor",
        resourceId: updatedDonor.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(updatedDonor);
  } catch (error) {
    console.error("[DONOR_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/donors/[id] - Delete a donor
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.donor.delete({
      where: { id: params.id },
    });

    // Optional: audit log
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const realIp = req.headers.get("x-real-ip") ?? "";
    const ipAddress = (forwardedFor.split(",")[0]?.trim() || realIp || undefined);
    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id ?? undefined,
        action: "DELETE",
        resource: "Donor",
        resourceId: params.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });

    return new NextResponse("Deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[DONOR_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
