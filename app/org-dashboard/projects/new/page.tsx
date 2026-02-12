'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Building2, ChevronRight } from 'lucide-react';
import { ProjectForm } from './components/ProjectForm';

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

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
        {projectId ? 'Edit Project' : 'New Project'}
      </BreadcrumbLink>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {projectId ? 'Edit Project' : 'Create New Project'}
            </h1>
            <p className="text-muted-foreground">
              {projectId ? 'Update your project information' : 'Create a new project by filling out the information below'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Form */}
      <Card className="p-6">
        <ProjectForm 
          projectId={projectId || undefined}
          onSuccess={(projectId) => {
            router.replace(`/org-dashboard/projects/new?projectId=${projectId}`);
          }}
        />
      </Card>
    </div>
  );
} 