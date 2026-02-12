// components/objectives/ObjectivesScopePage.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/objectives/ObjectivesTable";
import { ClipboardList, Target, Layers, FolderTree, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateObjectiveButton } from "../../app/org-dashboard/objectives/components/CreateObjectiveButton";

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


interface ObjectivesScopePageProps {
    scope: "organization" | "program" | "project";
    programId?: string;
    projectId?: string;
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

export default async function ObjectivesScopePage({
    scope,
    programId,
    projectId,
}: ObjectivesScopePageProps) {
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
    let tableObjectives: ObjectiveTableData[] = [];


    if (scope === "organization") {
        // Get organization data
        const membership = await prisma.membership.findFirst({
            where: { userId: user.id, isActive: true },
            select: {
                organization: {
                    select: {
                        id: true,
                        projects: { select: { id: true, name: true } },
                        programs: { select: { id: true, name: true } },
                        objectives: {
                            where: { projectId: null, programId: null },
                            select: { id: true, code: true, level: true, description: true, createdAt: true },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });

        if (!membership?.organization) {
            return <div>No organization found</div>;
        }

        tableObjectives = membership.organization.objectives.map((obj) => ({
            id: obj.id,
            code: obj.code || "",
            type: "Organization",
            project: "",
            program: "",
            level: obj.level,
            description: obj.description,
            createdAt: obj.createdAt,
        }));
    }

    if (scope === "project") {
        const objectives = await prisma.objective.findMany({
            where: { projectId },
            select: {
                id: true,
                code: true,
                level: true,
                description: true,
                createdAt: true,
                project: { select: { name: true } },
            },
        });

        tableObjectives = objectives.map((obj) => ({
            id: obj.id,
            code: obj.code || "",
            type: "Project",
            project: obj.project?.name || "",
            program: "",
            level: obj.level,
            description: obj.description,
            createdAt: obj.createdAt,
        }));
    }

    if (scope === "program") {
        const objectives = await prisma.objective.findMany({
            where: {
                organizationId: user.organizationId,   // ✅ ensures it has a program
                programId: { not: null },
            },
            select: {
                id: true,
                code: true,
                level: true,
                description: true,
                createdAt: true,
                program: {
                    select: { name: true },
                },
            },
        });
        tableObjectives = objectives.map((obj) => ({
            id: obj.id,
            code: obj.code || "",
            type: "Program",
            project: "",
            program: obj.program?.name || "",
            level: obj.level,
            description: obj.description,
            createdAt: obj.createdAt,
        }));
    }


    // Sort objectives
    tableObjectives.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Stats
    const stats = {
        total: tableObjectives.length,
        byType: {
            Project: tableObjectives.filter((obj) => obj.type === "Project").length,
            Program: tableObjectives.filter((obj) => obj.type === "Program").length,
            Organization: tableObjectives.filter((obj) => obj.type === "Organization").length,
        },
    };

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Objectives</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track {scope} objectives
                    </p>
                </div>
                <CreateObjectiveButton
                    organizationId={organizationData?.id ?? ""}
                    projects={organizationData?.projects ?? []}
                    programs={organizationData?.programs ?? []}
                    scope={scope}
                />
            </div>

            {tableObjectives.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-muted p-6 mb-6">
                            <Target className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">No objectives found</h3>
                        <p className="text-muted-foreground text-lg mb-6 max-w-sm">
                            Get started by adding your first objective to track goals
                        </p>
                        <CreateObjectiveButton
                            variant="empty"
                            organizationId={organizationData?.id ?? ""}
                            projects={organizationData?.projects ?? []}
                            programs={organizationData?.programs ?? []}
                            scope={scope}
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Statistics */}
                    {/* <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Project</CardTitle>
                                <FolderTree className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.byType.Project}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Program</CardTitle>
                                <Layers className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.byType.Program}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Organization</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.byType.Organization}</div>
                            </CardContent>
                        </Card>
                    </div> */}

                    {/* Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Objectives</CardTitle>
                            <CardDescription>Objectives in {scope} scope</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable data={tableObjectives} scope={scope} programs={organizationData.programs} projects={organizationData.projects} />
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
