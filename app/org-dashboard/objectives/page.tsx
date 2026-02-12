import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DataTable } from '@/components/objectives/ObjectivesTable';
import { ClipboardList, Target, Layers, FolderTree, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreateObjectiveButton } from './components/CreateObjectiveButton';

interface DbObjective {
  id: string;
  code: string | null;
  level: string;
  description: string;
  createdAt: Date;
  project: { name: string } | null;
  program: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
  objectives: DbObjective[];
}

interface Program {
  id: string;
  name: string;
  objectives: DbObjective[];
}

interface Organization {
  id: string;
  projects: {
    id: string;
    name: string;
  }[];
  programs: {
    id: string;
    name: string;
  }[];
  objectives: DbObjective[];
}

// Table data interface
interface ObjectiveTableData {
  id: string;
  code: string;
  type: 'Project' | 'Program' | 'Organization';
  project: string;
  program: string;
  level: string;
  description: string;
  createdAt: Date;
}

async function getOrganizationData(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, isActive: true },
    select: {
      organization: {
        select: {
          id: true,
          projects: {
            select: {
              id: true,
              name: true,
            },
          },
          programs: {
            select: {
              id: true,
              name: true,
            },
          },
          objectives: {
            where: {
              projectId: null,
              programId: null,
            },
            select: {
              id: true,
              code: true,
              level: true,
              description: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });

  // Return only the necessary serializable data
  return membership?.organization ? {
    id: membership.organization.id,
    projects: membership.organization.projects,
    programs: membership.organization.programs,
    objectives: membership.organization.objectives,
  } as Organization : undefined;
}

export default async function ObjectivesPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  const organizationData = await getOrganizationData(user.id);

  if (!organizationData) {
    return <div>No organization found</div>;
  }

  // Also fetch objectives for projects and programs
  const projectObjectives = await prisma.objective.findMany({
    where: {
      project: {
        organizationId: organizationData.id,
      },
    },
    select: {
      id: true,
      code: true,
      level: true,
      description: true,
      createdAt: true,
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  const programObjectives = await prisma.objective.findMany({
    where: {
      program: {
        organizationId: organizationData.id,
      },
    },
    select: {
      id: true,
      code: true,
      level: true,
      description: true,
      createdAt: true,
      program: {
        select: {
          name: true,
        },
      },
    },
  });

  const organizationObjectives = await prisma.objective.findMany({
    where: {
      projectId: null,
      programId: null,
      organizationId: organizationData.id,
    },
    select: {
      id: true,
      code: true,
      level: true,
      description: true,
      createdAt: true,
      program: {
        select: {
          name: true,
        },
      },
    },
  });


  // Transform objectives into table format
  const tableObjectives: ObjectiveTableData[] = [
    ...projectObjectives.map(obj => ({
      id: obj.id,
      code: obj.code || '',
      type: 'Project' as const,
      project: obj.project?.name || '',
      program: '',
      level: obj.level,
      description: obj.description,
      createdAt: obj.createdAt,
    })),
    ...programObjectives.map(obj => ({
      id: obj.id,
      code: obj.code || '',
      type: 'Program' as const,
      project: '',
      program: obj.program?.name || '',
      level: obj.level,
      description: obj.description,
      createdAt: obj.createdAt,
    })),
    ...organizationObjectives.map(obj => ({
      id: obj.id,
      code: obj.code || '',
      type: 'Organization' as const,
      project: '',
      program: '',
      level: obj.level,
      description: obj.description,
      createdAt: obj.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate statistics
  const stats = {
    total: tableObjectives.length,
    byType: {
      Project: tableObjectives.filter(obj => obj.type === 'Project').length,
      Program: tableObjectives.filter(obj => obj.type === 'Program').length,
      Organization: tableObjectives.filter(obj => obj.type === 'Organization').length,
    },
    byLevel: {
      Goal: tableObjectives.filter(obj => obj.level === 'Goal').length,
      Outcome: tableObjectives.filter(obj => obj.level === 'Outcome').length,
      Output: tableObjectives.filter(obj => obj.level === 'Output').length,
      Activity: tableObjectives.filter(obj => obj.level === 'Activity').length,
    },
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Objectives</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your organization's objectives
          </p>
        </div>
        <CreateObjectiveButton organizationId={organizationData.id} projects={organizationData.projects} programs={organizationData.programs} scope="organization" />
      </div>

      {tableObjectives.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Target className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No objectives found</h3>
            <p className="text-muted-foreground text-lg mb-6 max-w-sm">
              Get started by adding your first objective to track your organization's goals
            </p>
            <CreateObjectiveButton variant="empty" organizationId={organizationData.id} projects={organizationData.projects} programs={organizationData.programs} scope="organization" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Objectives Table */}
          <Card>
            {/* <CardHeader>
              <CardTitle>Organization Objectives</CardTitle>
              <CardDescription>
                A list of org objectives across your organization
              </CardDescription>
            </CardHeader> */}
            <CardContent>
              <DataTable
                scope='organization'
                projects={organizationData.projects}
                programs={organizationData.programs}
                data={tableObjectives.filter(obj => obj.type === 'Organization')}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}