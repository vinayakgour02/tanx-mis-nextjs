import { prisma } from "@/lib/prisma";
import { ProgramsList } from "./components/programs-list";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth";
import { ProgramsHeaderActions } from "./components/header-actions";

export default async function ProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.organizationId) {
    throw new Error("Unauthorized");
  }

  const programs = await prisma.program.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize the programs data to handle Decimal objects
  const serializedPrograms = programs.map((program) => ({
    ...program,
    budget: program.budget ? program.budget.toString() : null,
    baseline: program.baseline ? program.baseline.toString() : null,
    target: program.target ? program.target.toString() : null,
    startDate: program.startDate?.toISOString() || null,
    endDate: program.endDate?.toISOString() || null,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Programs</h2>
          <p className="text-muted-foreground">
            Manage your organization&apos;s programs
          </p>
        </div>
        <ProgramsHeaderActions />
      </div>
      <ProgramsList programs={serializedPrograms} />
    </div>
  );
}
