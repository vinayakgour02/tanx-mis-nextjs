'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, Pencil, Trash, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { projectStatuses } from '@/app/org-dashboard/projects/new/lib/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from '@/hooks/use-permissions';

interface Project {
  id: string;
  name: string;
  code?: string | null;
  description?: string;
  status?: 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  totalBudget?: string;
  currency?: string;
  theme?: string;
  programs: Array<{
  id: string;
  name: string;
  theme: string;
  sector: string;
  startDate: string;
  endDate: string;
}>;
  objectives: Array<{
    id: string;
    level: string;
    description: string;
    code?: string | null;
    projectId?: string;
    organizationId?: string | null;
    programId?: string | null;
    orderIndex?: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  indicators: Array<{
    id: string;
    name: string;
    type: string;
    level: string;
    definition: string;
    dataSource: string;
    frequency: string;
    unitOfMeasure: string;
    baselineValue?: string;
    organizationId?: string;
    projectId?: string;
    objectiveId?: string | null;
    rationale?: string | null;
    disaggregateBy?: string | null;
    baselineDate?: string | null;
    target?: string | null;
    lastModifiedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    programId?: string | null;
  }>;
  team: Array<{
    id: string;
    name: string;
    designation: string;
    level: string;
  }>;
  interventionAreas: Array<{
    id: string;
    state: string;
    district: string;
    blockName: string;
    gramPanchayat: string;
    villageName: string;
  }>;
  activities: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
  }>;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  reports: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  funding: Array<{
    id: string;
    amount: string;
    year: number;
    donor: {
      id: string;
      name: string;
      type: string;
      code?: string;
      description?: string;
    };
    currency: string;
    projectId?: string;
    donorId?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  directBeneficiaries?: number;
  indirectBeneficiaries?: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      DRAFT: 'bg-white',
      PLANNED: 'bg-blue-500',
      ACTIVE: 'bg-green-500',
      ON_HOLD: 'bg-yellow-500',
      COMPLETED: 'bg-purple-500',
      CANCELLED: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      
      toast.success('Project deleted successfully');
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
    try {
      setIsStatusUpdating(true);
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update project status');
      
      toast.success('Project status updated successfully');
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      toast.error('Failed to update project status');
      console.error(error);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAdminProjects = can('projects', 'admin');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Projects
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and monitor all your organization's projects
          </p>
        </div>
        {canAdminProjects && (
          <Button 
            onClick={() => router.push('/org-dashboard/projects/new')}
            className="shadow-lg hover:shadow-primary/20 transition-all duration-200 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        )}
      </div>

      <Card className="p-6 shadow-xl">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full transition-all duration-200 border-muted focus:border-primary"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {projectStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Table */}
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>No projects found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.code && (
                            <div className="text-sm text-muted-foreground">
                              Code: {project.code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
  {project.programs && project.programs.length > 0 ? (
    <div className="space-y-2">
      {project.programs.map((prog) => (
        <div key={prog.id}>
          <div className="font-medium">{prog.name}</div>
          {prog.theme && (
            <div className="text-sm text-muted-foreground">
              Theme: {prog.theme}
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <span className="text-sm text-muted-foreground">No programs</span>
  )}
</TableCell>

                      <TableCell>
                        <Select
                          value={project.status ?? 'DRAFT'}
                          onValueChange={(value) => updateProjectStatus(project.id, value as Project['status'])}
                          disabled={isStatusUpdating || !canAdminProjects}
                        >
                          <SelectTrigger
                            className={`w-[160px] ${getStatusColor(project.status)} ${
                              project.status === 'DRAFT' ? 'text-black' : 'text-white'
                            } font-medium px-3 py-1`}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {project.startDate || project.endDate ? (
                            <>
                              <p>{formatDate(project.startDate || '')}</p>
                              <p className="text-muted-foreground">
                                to {formatDate(project.endDate || '')}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No dates set</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {project.totalBudget && project.currency ? (
                          formatCurrency(Number(project.totalBudget || 0), project.currency)
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/org-dashboard/projects/${project.id}/view`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canAdminProjects && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-primary/10 hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/org-dashboard/projects/${project.id}`);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (projectToDelete) {
                  deleteProject(projectToDelete);
                  setDeleteDialogOpen(false);
                  setProjectToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectDetails({ project, formatDate, formatCurrency }: { 
  project: Project; 
  formatDate: (date: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
}) {
  return (
    <div className="px-6 py-4 space-y-8">
      {/* Basic Info */}
      <div>
        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary"></div>
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">Code</p>
            <p className="font-medium">{project.code || 'Not set'}</p>
          </div>
          <div className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">Beneficiaries</p>
            <p className="font-medium">Direct: {project.directBeneficiaries || 0}</p>
            <p className="font-medium">Indirect: {project.indirectBeneficiaries || 0}</p>
          </div>
          <div className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
            <p className="text-sm text-muted-foreground mb-1">Budget</p>
            <p className="font-medium">{formatCurrency(Number(project.totalBudget || 0), project.currency || 'INR')}</p>
          </div>
        </div>
      </div>

      {/* Program Info */}
      {/* Program Info */}
{project.programs && project.programs.length > 0 && (
  <div>
    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <div className="h-1 w-1 rounded-full bg-primary"></div>
      Programs
    </h4>
    <div className="grid gap-4">
      {project.programs.map((prog) => (
        <div
          key={prog.id}
          className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors"
        >
          <p className="font-medium text-lg mb-2">{prog.name}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Theme</p>
              <p className="font-medium">{prog.theme}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sector</p>
              <p className="font-medium">{prog.sector}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {formatDate(prog.startDate)} - {formatDate(prog.endDate)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


      {/* Objectives */}
      {project.objectives && project.objectives.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Objectives
          </h4>
          <div className="grid gap-4">
            {project.objectives.map(objective => (
              <div key={objective.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-medium flex-1">{objective.description}</p>
                  <Badge variant="secondary" className="shrink-0">{objective.level}</Badge>
                </div>
                {objective.code && (
                  <p className="text-sm text-muted-foreground mt-2">Code: {objective.code}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicators */}
      {project.indicators && project.indicators.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Indicators
          </h4>
          <div className="grid gap-4">
            {project.indicators.map(indicator => (
              <div key={indicator.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <p className="font-medium text-lg">{indicator.name}</p>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="secondary">{indicator.type}</Badge>
                    <Badge variant="secondary">{indicator.level}</Badge>
                  </div>
                </div>
                <p className="text-sm mb-4">{indicator.definition}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Source</p>
                    <p className="font-medium">{indicator.dataSource}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium">{indicator.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">{indicator.unitOfMeasure}</p>
                  </div>
                  {indicator.baselineValue && (
                    <div>
                      <p className="text-sm text-muted-foreground">Baseline</p>
                      <p className="font-medium">{indicator.baselineValue}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funding */}
      {project.funding && project.funding.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Funding
          </h4>
          <div className="grid gap-4">
            {project.funding.map(fund => (
              <div key={fund.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-lg">{fund.donor.name}</p>
                    <p className="text-sm text-muted-foreground">Type: {fund.donor.type}</p>
                    {fund.donor.code && (
                      <p className="text-sm text-muted-foreground">Code: {fund.donor.code}</p>
                    )}
                    {fund.donor.description && (
                      <p className="text-sm text-muted-foreground mt-2">{fund.donor.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-lg">{formatCurrency(Number(fund.amount), fund.currency || project.currency || 'INR')}</p>
                    <p className="text-sm text-muted-foreground">Year: {fund.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {project.team && project.team.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary"></div>
            Team Members
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.team.map(member => (
              <div key={member.id} className="p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                <p className="font-medium text-lg">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.designation}</p>
                <p className="text-sm text-muted-foreground">Level: {member.level}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}