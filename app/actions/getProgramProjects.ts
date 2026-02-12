// app/actions/getProgramProjects.ts
"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function getProgramProjects() {
  const session  = await getServerSession(authOptions);
  const programs = await prisma.program.findMany({
    where:{
      organizationId: session?.user.organizationId
    },
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return programs;
}
