'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectForm } from '../new/components/ProjectForm';

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast.error('Failed to load project');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList className="flex items-center gap-2 text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/org-dashboard"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/org-dashboard/projects"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground">/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="font-medium text-primary">
                Edit Project
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
            <p className="text-muted-foreground">
              Update project information and settings
            </p>
          </div>
        </div>
      </div>

      {/* Project Form */}
      <Card className="p-6">
        <ProjectForm
          initialData={project}
          projectId={id}
          onSuccess={(projectId: string) => {
            toast.success('Project updated successfully');
            router.push(`/org-dashboard/projects/${projectId}`);
          }}
        />
      </Card>
    </div>
  );
} 