'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewIndicatorDialog } from '@/app/org-dashboard/indicators/_components/new-indicator-dialog';
import { EditIndicatorDialog } from './edit-indicator-dialog';
import { DeleteIndicatorDialog } from './delete-indicator-dialog';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './indicators-columns';
import { UseFormReturn } from 'react-hook-form';
import { ProjectFormValues } from '../../lib/schema';
import { toast } from 'sonner';

type IndicatorType = 'OUTPUT' | 'OUTCOME' | 'IMPACT';
type FrequencyType = 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONE_TIME';
type UnitType = 'PERCENTAGE' | 'COUNT' | 'RATIO' | 'CURRENCY' | 'SCORE' | 'HOURS' | 'DAYS' | 'KILOMETERS' | 'KILOGRAMS' | 'UNITS' | 'OTHER';

interface Indicator {
  id?: string;
  name: string;
  type: IndicatorType;
  level: 'ORGANIZATION' | 'PROJECT';
  definition: string;
  rationale?: string;
  dataSource: string;
  frequency: string;
  unitOfMeasure: string;
  disaggregateBy?: string;
  baselineDate?: Date;
  baselineValue?: string;
  target?: string;
}

interface IndicatorsTabProps {
  form: UseFormReturn<ProjectFormValues>;
  projectId?: string;
}

export function IndicatorsTab({ form, projectId }: IndicatorsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const indicators = form.watch('indicators') || [];
  const programIds = form.watch('programIds') || [];

  const handleIndicatorCreated = (newIndicator: Indicator) => {
    setDialogOpen(false);
    const currentIndicators = form.getValues('indicators') || [];
    
    // Convert null values to undefined for proper validation
    const processedIndicator = {
      ...newIndicator,
      baselineValue: newIndicator.baselineValue || undefined,
      target: newIndicator.target || undefined,
    };
    
    form.setValue('indicators', [...currentIndicators, processedIndicator], { 
      shouldValidate: true 
    });
  };

  const handleEditIndicator = (indicator: any) => {
    setSelectedIndicator(indicator);
    setEditDialogOpen(true);
  };

  const handleIndicatorUpdated = (updatedIndicator: any) => {
    const currentIndicators = form.getValues('indicators') || [];
    const indicatorIndex = currentIndicators.findIndex((ind, index) => {
      // For indicators without IDs, use the actual object reference comparison
      if (selectedIndicator && 'id' in selectedIndicator && selectedIndicator.id && 'id' in ind && ind.id) {
        return ind.id === selectedIndicator.id;
      }
      // Fallback to index-based comparison
      return currentIndicators.indexOf(ind) === currentIndicators.indexOf(selectedIndicator!);
    });
    
    if (indicatorIndex !== -1) {
      const newIndicators = [...currentIndicators];
      newIndicators[indicatorIndex] = {
        ...updatedIndicator,
        baselineValue: updatedIndicator.baselineValue || undefined,
        target: updatedIndicator.target || undefined,
      };
      
      form.setValue('indicators', newIndicators, { 
        shouldValidate: true 
      });
    }
    
    setEditDialogOpen(false);
    setSelectedIndicator(null);
    
    // Optionally refresh indicators from server if project is saved
    if (projectId) {
      refreshIndicators();
    }
  };

  const handleDeleteIndicator = (indicator: any) => {
    setSelectedIndicator(indicator);
    setDeleteDialogOpen(true);
  };

  const handleIndicatorDeleted = () => {
    const currentIndicators = form.getValues('indicators') || [];
    const newIndicators = currentIndicators.filter((ind, index) => {
      // For indicators without IDs, use the actual object reference comparison
      if (selectedIndicator && 'id' in selectedIndicator && selectedIndicator.id && 'id' in ind && ind.id) {
        return ind.id !== selectedIndicator.id;
      }
      // Fallback to index-based comparison
      return currentIndicators.indexOf(ind) !== currentIndicators.indexOf(selectedIndicator!);
    });
    
    form.setValue('indicators', newIndicators, { 
      shouldValidate: true 
    });
    
    setDeleteDialogOpen(false);
    setSelectedIndicator(null);
    
    // Optionally refresh indicators from server if project is saved
    if (projectId) {
      refreshIndicators();
    }
  };

  // Function to refresh indicators from server
  const refreshIndicators = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/indicators?projectId=${projectId}`);
      if (response.ok) {
        const serverIndicators = await response.json();
        form.setValue('indicators', serverIndicators, { 
          shouldValidate: true 
        });
      }
    } catch (error) {
      console.error('Error refreshing indicators:', error);
      toast.error('Failed to refresh indicators');
    }
  };

  // Create columns with action handlers
  const columns = createColumns({
    onEdit: handleEditIndicator,
    onDelete: handleDeleteIndicator,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Indicators</h3>
          <p className="text-sm text-muted-foreground">
            Manage indicators to measure project progress and success
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={!projectId}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Indicator
        </Button>
      </div>

      {!projectId && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please save the project first to manage indicators.</p>
        </div>
      )}

      {projectId && (
        <DataTable 
          columns={columns} 
          data={indicators.map((indicator, index) => ({
            ...indicator,
            id: (indicator as any).id || `temp-${index}`, // Ensure each indicator has an ID
            baselineValue: indicator.baselineValue || undefined,
            target: indicator.target || undefined,
            rationale: indicator.rationale || undefined, // Convert null to undefined
            disaggregateBy: indicator.disaggregateBy || undefined, // Convert null to undefined
          }))}
        />
      )}

      <NewIndicatorDialog
        scope='project'
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleIndicatorCreated}
        projectId={projectId}
        programIds={programIds}
      />

      <EditIndicatorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleIndicatorUpdated}
        indicator={selectedIndicator}
        projectId={projectId}
        programIds={programIds}
      />

      <DeleteIndicatorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleIndicatorDeleted}
        indicator={selectedIndicator}
        projectId={projectId}
      />
    </div>
  );
} 