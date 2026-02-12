// app/actions/getDonorDashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";

export async function getDonorDashboard() {
  const session  = await getServerSession(authOptions);
  const donors = await prisma.donor.findMany({
    where:{
      organizationId: session?.user.organizationId
    },
    include: {
      projectFunding: {
        include: {
          project: {
            include: {
              programs: true,
              interventionAreas: {
                include: {
                  district: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return donors.map((donor) => {
    const projects = donor.projectFunding.map((pf) => pf.project);

    const projectCount = projects.length;

    const programIds = new Set(
      projects.flatMap((p) => p.programs.map((prog) => prog.id))
    );

    const districtIds = new Set(
      projects.flatMap((p) =>
        p.interventionAreas.map((ia) => ia.district?.id).filter(Boolean)
      )
    );

    return {
      id: donor.id,
      name: donor.name,
      projectCount,
      programCount: programIds.size,
      coverageCount: districtIds.size,
    };
  });
}
