'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusIcon } from 'lucide-react';
import { AddObjectiveForm } from '@/components/objectives/AddObjectiveForm';

type Props = {
  organizationId: string;
  scope: "organization" | "program" | "project";
  projects: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  variant?: 'header' | 'empty';
};

export function CreateObjectiveButton({ organizationId, projects, programs, variant = 'header', scope }: Props) {
  const { can } = usePermissions();
  // const canCreate = can('objectives', 'create') || can('objectives', 'admin');
 const canCreate =
  scope !== "organization"
    ? can("objectives", "create") || can("objectives", "admin")
    : can("organization.objectives", "write") ||
      can("organization.objectives", "create") ||
      can("organization.objectives", "admin");

if (!canCreate) return null;
  const label = variant === 'empty' ? 'Add Your First Objective' : 'Add Objective';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className={variant === 'header' ? 'w-full md:w-auto' : undefined}>
          <PlusIcon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Objective</DialogTitle>
        </DialogHeader>
        <AddObjectiveForm
          projects={projects}
          programs={programs}
          organizationId={organizationId}
          scope={scope}
        />
      </DialogContent>
    </Dialog>
  );
} 