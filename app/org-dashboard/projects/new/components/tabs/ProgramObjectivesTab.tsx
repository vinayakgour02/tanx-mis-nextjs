'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ProjectFormValues } from '../../lib/schema';
import { DataTable } from '@/components/ui/data-table';
import { NewObjectiveDialog } from '../dialogs/NewObjectiveDialog';
import { EditObjectiveDialog } from '../dialogs/EditObjectiveDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Objective {
  id: string;
  code: string;
  level: string;
  description: string;
  orderIndex: number;
  createdAt?: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
}

interface ProgramObjectivesTabProps {
  form: UseFormReturn<ProjectFormValues>;
  projectId?: string;
}

// Define columns for the objectives table
const columns = [
  {
    accessorKey: 'code',
    header: 'Code',
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }: any) => {
      const level = row.getValue('level');
      return level.charAt(0) + level.slice(1).toLowerCase();
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }: any) => {
      const description = row.getValue('description');
      return description.length > 100 
        ? `${description.substring(0, 100)}...` 
        : description;
    },
  },
  {
    accessorKey: 'orderIndex',
    header: 'Order',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) => {
      const objective = row.original;
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Edit objective:', objective.id)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Delete objective:', objective.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

export function ProgramObjectivesTab({ form, projectId }: ProgramObjectivesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState<Objective | null>(null);
  const [objectiveToEdit, setObjectiveToEdit] = useState<Objective | null>(null);

  // Fetch objectives when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchObjectives();
    }
  }, [projectId]);

  const fetchObjectives = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/objectives?projectId=${projectId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch objectives');
      }
      
      const data = await response.json();
      setObjectives(data);
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast.error('Failed to fetch objectives');
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveCreated = (newObjective: Objective) => {
    setObjectives(prev => [...prev, newObjective]);
    toast.success('Objective created successfully');
  };

  const handleObjectiveUpdated = (updatedObjective: Objective) => {
    setObjectives(prev => prev.map(obj => 
      obj.id === updatedObjective.id ? updatedObjective : obj
    ));
    toast.success('Objective updated successfully');
  };

  const handleDeleteObjective = async (objective: Objective) => {
    setObjectiveToDelete(objective);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!objectiveToDelete) return;
    
    try {
      const response = await fetch(`/api/objectives/${objectiveToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete objective');
      }
      
      setObjectives(prev => prev.filter(obj => obj.id !== objectiveToDelete.id));
      toast.success('Objective deleted successfully');
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Failed to delete objective');
    } finally {
      setDeleteDialogOpen(false);
      setObjectiveToDelete(null);
    }
  };

  const handleEditObjective = (objective: Objective) => {
    setObjectiveToEdit(objective);
    setEditDialogOpen(true);
  };

  // Update columns to include proper action handlers
  const tableColumns = columns.map(col => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }: any) => {
          const objective = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditObjective(objective)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteObjective(objective)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      };
    }
    return col;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Objectives</h3>
          <p className="text-sm text-muted-foreground">
            Manage objectives to track project goals and outcomes
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)}
          disabled={!projectId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Objective
        </Button>
      </div>

      {!projectId && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please save the project first to manage objectives.</p>
        </div>
      )}

      {projectId && (
        <>
          <DataTable 
            columns={tableColumns} 
            data={objectives}
            loading={loading}
          />

          <NewObjectiveDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSuccess={handleObjectiveCreated}
            projectId={projectId}
          />

          <EditObjectiveDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleObjectiveUpdated}
            objective={objectiveToEdit}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Objective</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this objective? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 