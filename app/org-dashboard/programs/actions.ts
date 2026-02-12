'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function createProgram(data: {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" ;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  sector?: string;
  theme?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      throw new Error("Unauthorized");
    }

    const program = await prisma.program.create({
      data: {
        ...data,
        budget: data.budget ? parseFloat(data.budget) : undefined,
        organizationId: session.user.organizationId,
      },
    });

    revalidatePath("/org-dashboard/programs");

    return {
      ...program,
      budget: program.budget ? Number(program.budget) : null,
      baseline: program.baseline ? Number(program.baseline) : null,
      target: program.target ? Number(program.target) : null,
    };
  } catch (error) {
    console.error("Failed to create program:", error);
    throw new Error("Failed to create program");
  }
}

// ------------------ UPDATE PROGRAM ------------------

export async function updateProgram(
  id: string,
  data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    budget?: string;
    status?: "DRAFT" | "ACTIVE" | "CLOSED" ;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    sector?: string;
    theme?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.program.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== session.user.organizationId) {
      throw new Error("Program not found or unauthorized");
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...data,
        budget: data.budget ? parseFloat(data.budget) : undefined,
      },
    });

    revalidatePath("/org-dashboard/programs");

    return {
      ...program,
      budget: program.budget ? Number(program.budget) : null,
      baseline: program.baseline ? Number(program.baseline) : null,
      target: program.target ? Number(program.target) : null,
    };
  } catch (error) {
    console.error("Failed to update program:", error);
    throw new Error("Failed to update program");
  }
}


// ------------------ DELETE PROGRAM ------------------
export async function deleteProgram(id: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.organizationId) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.program.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== session.user.organizationId) {
      throw new Error("Program not found or unauthorized");
    }

    await prisma.program.delete({
      where: { id },
    });

    revalidatePath("/org-dashboard/programs");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete program:", error);
    throw new Error("Failed to delete program");
  }
}