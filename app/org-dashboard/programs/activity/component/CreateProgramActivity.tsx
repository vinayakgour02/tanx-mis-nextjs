'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

////////////////////////
// Zod schema
////////////////////////
const formSchema = z.object({
  programId: z.string().min(1, 'Program is required'),
  objectiveId: z.string().min(1, 'Objective is required'),
  interventionName: z.string().min(1, 'Intervention name is required'),
  subInterventions: z
    .array(
      z.object({
        name: z.string().min(1, 'Sub-intervention name is required'),
        indicators: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, 'At least one sub-intervention is required'),
});

type FormValues = z.infer<typeof formSchema>;

////////////////////////
// Interfaces
////////////////////////
interface Program { id: string; name: string }
interface Objective { id: string; description: string }
interface Indicator { id: string; name: string }
interface Intervention {
  id: string;
  name: string;
  objectiveId: string;
  programs: Program[];
  SubIntervention: {
    id: string;
    name: string;
    description?: string;
    indicatorId?: string;
    Indicator?: { // Note: capital I to match API response
      id: string;
      name: string;
    };
  }[];
  objective?: { id: string; description: string };
  indicator?: { id: string; name: string };
}

interface CreateInterventionDialogProps {
  programs: Program[];
  onInterventionSaved: () => void;
  initialData?: Intervention;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

////////////////////////
// SubInterventionField Component
////////////////////////
interface SubInterventionFieldProps {
  subIndex: number;
  control: any;
  removeSub: (index: number) => void;
  indicators: Indicator[];
  selectedProgramId?: string;
  selectedObjectiveId?: string;
}

function SubInterventionField({
  subIndex,
  control,
  removeSub,
  indicators,
  selectedProgramId,
  selectedObjectiveId,
}: SubInterventionFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `subInterventions.${subIndex}.indicators`,
  });

  return (
    <div className="border border-2 border-orange-500 rounded-lg p-3 md:p-4 bg-muted/30 space-y-3 md:space-y-4 transition-colors w-[80%]">
      {/* Header row: index badge + name + remove */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-2 text-xs font-medium">
          {subIndex + 1}
        </span>

        <FormField
          control={control}
          name={`subInterventions.${subIndex}.name`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl className='w-[70%]'>
                <Input
                  {...field}
                  placeholder={`Sub-Intervention ${subIndex + 1} name`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeSub(subIndex)}
          title="Remove sub-intervention"
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm">Indicators</FormLabel>
          <span className="text-xs text-muted-foreground">
            {fields.length} selected
          </span>
        </div>

        <div className="pl-0 md:pl-2 space-y-2">
          {fields.map((field, indIndex) => (
            <div
              key={field.id}
              className="flex gap-2 items-center"
            >
              <FormField
                control={control}
                name={`subInterventions.${subIndex}.indicators.${indIndex}.id`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedProgramId || !selectedObjectiveId}
                      >
                        <SelectTrigger className='w-96'>
                          <SelectValue placeholder="Select indicator" />
                        </SelectTrigger>
                        <SelectContent  className="w-96" >
                          {indicators.length === 0 ? (
                            <SelectItem value="__no_indicators__" disabled>
                              No indicators available
                            </SelectItem>
                          ) : (
                            indicators.map((indicator) => (
                              <SelectItem  key={indicator.id} value={indicator.id}>
                                {indicator.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(indIndex)}
                  title="Remove indicator"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: '', name: '' })}
            className="mt-1"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Indicator
          </Button>
        </div>
      </div>
    </div>
  );
}

////////////////////////
// CreateInterventionDialog Component
////////////////////////
export function CreateInterventionDialog({
  programs,
  onInterventionSaved,
  initialData,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: CreateInterventionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(false);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode && initialData
      ? {
        programId: initialData.programs?.[0]?.id ?? '',
        objectiveId: initialData.objectiveId ?? '',
        interventionName: initialData.name ?? '',
        subInterventions: initialData.SubIntervention?.length > 0
          ? (() => {
              // Group SubInterventions by name to handle duplicates
              const grouped = initialData.SubIntervention.reduce((acc: any, si: any) => {
                if (!acc[si.name]) {
                  acc[si.name] = {
                    name: si.name,
                    indicators: []
                  };
                }
                
                // Add indicator if it exists
                if (si.Indicator) {
                  acc[si.name].indicators.push({
                    id: si.Indicator.id,
                    name: si.Indicator.name
                  });
                } else if (si.indicatorId) {
                  // Fallback if Indicator object is not populated
                  acc[si.name].indicators.push({
                    id: si.indicatorId,
                    name: ''
                  });
                }
                
                return acc;
              }, {});
              
              const result = Object.values(grouped).map((group: any) => ({
                name: group.name,
                indicators: group.indicators.length > 0 ? group.indicators : [{ id: '', name: '' }]
              }));
              
              return result.length > 0 ? result : [{ name: '', indicators: [{ id: '', name: '' }] }];
            })()
          : [{ name: '', indicators: [{ id: '', name: '' }] }],
      }
      : { subInterventions: [{ name: '', indicators: [{ id: '', name: '' }] }] },
  });

  const { fields: subFields, append: appendSub, remove: removeSub } = useFieldArray({
    control: form.control,
    name: 'subInterventions',
  });

  const selectedProgramId = form.watch('programId');
  const selectedObjectiveId = form.watch('objectiveId');

  ////////////////////////
  // Fetch Objectives
  ////////////////////////
  const fetchObjectives = async (programId: string) => {
    setIsLoadingObjectives(true);
    try {
      const res = await fetch(`/api/activities/program/objective?programId=${programId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setObjectives(data);
    } catch {
      toast.error('Failed to fetch objectives');
      setObjectives([]);
    } finally {
      setIsLoadingObjectives(false);
    }
  };

  const fetchIndicators = async (programId: string, objectiveId?: string) => {
    setIsLoadingIndicators(true);
    try {
      let url = `/api/indicators/program-filtered?programId=${programId}`;
      if (objectiveId) url += `&objectiveId=${objectiveId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIndicators(data);
    } catch {
      toast.error('Failed to fetch indicators');
      setIndicators([]);
    } finally {
      setIsLoadingIndicators(false);
    }
  };

  useEffect(() => {
    if (selectedProgramId) fetchObjectives(selectedProgramId);
    else {
      setObjectives([]);
      setIndicators([]);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedProgramId && selectedObjectiveId) fetchIndicators(selectedProgramId, selectedObjectiveId);
    else if (selectedProgramId) fetchIndicators(selectedProgramId);
    else setIndicators([]);
  }, [selectedProgramId, selectedObjectiveId]);

  // Pre-populate dropdowns in edit mode
  useEffect(() => {
    if (isEditMode && initialData && open) {
      // Set objective from initial data if available
      if (initialData.objective && objectives.length === 0) {
        setObjectives([initialData.objective]);
      }
      
      // Set indicators from SubIntervention data if available
      if (initialData.SubIntervention && indicators.length === 0) {
        const indicatorsFromData = initialData.SubIntervention
          .filter(si => si.Indicator)
          .map(si => si.Indicator!)
          .filter((indicator, index, self) => 
            index === self.findIndex(i => i.id === indicator.id)
          ); // Remove duplicates
        
        if (indicatorsFromData.length > 0) {
          setIndicators(indicatorsFromData);
        }
      }
    }
  }, [isEditMode, initialData, open, objectives.length, indicators.length]);

  ////////////////////////
  // Submit
  ////////////////////////
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.interventionName,
        programId: values.programId,
        objectiveId: values.objectiveId,
        subInterventions: values.subInterventions,
      };

      const res = await fetch(
        isEditMode ? `/api/intervention/${initialData?.id}` : '/api/intervention',
        {
          method: isEditMode ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error('Failed to save intervention');

      toast.success(`Intervention ${isEditMode ? 'updated' : 'created'} successfully`);
      onInterventionSaved();
      setOpen(false);

      if (!isEditMode) {
        form.reset({ subInterventions: [{ name: '', indicators: [{ id: '', name: '' }] }] });
        setObjectives([]);
        setIndicators([]);
      }
    } catch {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} intervention`);
    } finally {
      setIsSubmitting(false);
    }
  };

  ////////////////////////
  // Render
  ////////////////////////
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Intervention
          </Button>
        </DialogTrigger>
      )}

      {/* Wider and more comfortable dialog, scrollable body */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
        <div className="p-5 md:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">
              {isEditMode ? 'Edit Intervention' : 'Create New Intervention'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a program and objective, name the intervention, then add one or more sub-interventions with indicators.
            </p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Program and Objective in a responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Program */}
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem className='w-72'>
                      <FormLabel className="flex items-center gap-1">
                        Program <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className='w-72'>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='w-72'>
                          {programs.length === 0 ? (
                            <SelectItem value="__no_programs__" disabled>
                              No programs available
                            </SelectItem>
                          ) : (
                            programs.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Objective */}
                <FormField
                  control={form.control}
                  name="objectiveId"
                  render={({ field }) => (
                    <FormItem className='w-72'>
                      <FormLabel className="flex items-center gap-1">
                        Objective <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedProgramId || isLoadingObjectives}
                      >
                        <FormControl>
                          <SelectTrigger className='w-72'>
                            <SelectValue
                              placeholder={
                                !selectedProgramId
                                  ? 'Select program first'
                                  : isLoadingObjectives
                                    ? 'Loading objectives...'
                                    : 'Select objective'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='w-208'>
                          {objectives.length === 0 ? (
                            <SelectItem value="__no_objectives__" disabled>
                              {isLoadingObjectives ? 'Loading...' : 'No objectives found'}
                            </SelectItem>
                          ) : (
                            objectives.map((objective) => (
                              <SelectItem key={objective.id} value={objective.id}>
                                {objective.description}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Intervention Name */}
              <FormField
                control={form.control}
                name="interventionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Intervention Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter intervention name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sub-Interventions */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <FormLabel>Sub-Interventions</FormLabel>
                    <span className="text-xs text-muted-foreground">
                      {subFields.length} total
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add sub-interventions and choose at least one indicator for each.
                  </p>
                </div>

                <div className="space-y-4">
                  {subFields.map((subField, index) => (
                    <SubInterventionField
                      key={subField.id}
                      subIndex={index}
                      control={form.control}
                      removeSub={removeSub}
                      indicators={indicators}
                      selectedProgramId={selectedProgramId}
                      selectedObjectiveId={selectedObjectiveId}
                    />
                  ))}
                </div>

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendSub({ name: '', indicators: [{ id: '', name: '' }] })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Sub-Intervention
                  </Button>
                </div>
              </div>

              {/* Sticky action area */}
              <div className="sticky bottom-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-5 md:-mx-6 px-5 md:px-6 py-3 border-t">
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? 'Update Intervention' : 'Create Intervention'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}