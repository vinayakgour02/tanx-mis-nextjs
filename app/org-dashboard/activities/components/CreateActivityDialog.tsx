import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandItem, CommandList } from '@/components/ui/command';

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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar, DollarSign, IndianRupee, Hash, MapPin, AlertCircle } from 'lucide-react';
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { useSession } from 'next-auth/react';

// --- Constants ---
const activityTypes = ['Training', 'Household', 'Infrastructure', 'General'] as const;
const levelTypes = ['State', 'District', 'Block', 'Gram Panchayat', 'Village'] as const;

// --- Schema ---
const formSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  objectiveId: z.string().optional(),
  indicatorId: z.string().optional(),
  interventionId: z.string().optional(),
  subInterventionId: z.string().optional(),
  interventionAreaId: z.string().min(1, 'Intervention Area is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(activityTypes).optional(),
  levelofIntervention: z.enum(levelTypes, { required_error: 'Level is required' }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  unitOfMeasure: z.string().optional(),
  targetUnit: z.coerce.number().min(1, 'Target unit is required'),
  costPerUnit: z.coerce.number().min(0).optional(),
  leverage: z.string().optional(),
  // Dynamic object for monthly targets: { "2024-01": 50, "2024-02": 20 }
  planMonthlyTargets: z.record(z.string(), z.coerce.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// --- Interfaces ---
interface CreateActivityDialogProps {

  onActivityCreated?: () => void;
}

export function CreateActivityDialog({ onActivityCreated }: CreateActivityDialogProps) {
  const { organizationId } = useOrganizationId();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data State ---
  const [projects, setProjects] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [subInterventions, setSubInterventions] = useState<any[]>([]);
  const [interventionAreas, setInterventionAreas] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetUnit: 0,
      costPerUnit: 0,
      planMonthlyTargets: {},
    },
  });

  // Watch fields for logic
  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const objectiveId = useWatch({ control: form.control, name: 'objectiveId' });
  const interventionId = useWatch({ control: form.control, name: 'interventionId' });
  const interventionAreaId = useWatch({ control: form.control, name: 'interventionAreaId' });
  const levelOfIntervention = useWatch({ control: form.control, name: 'levelofIntervention' });
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const endDate = useWatch({ control: form.control, name: 'endDate' });
  const targetUnit = useWatch({ control: form.control, name: 'targetUnit' });
  const costPerUnit = useWatch({ control: form.control, name: 'costPerUnit' });
  const planMonthlyTargets = useWatch({ control: form.control, name: 'planMonthlyTargets' }) || {};

  // --- 1. Fetch Initial Projects ---
  const { data: session, status } = useSession()
  useEffect(() => {
    if (open && organizationId) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activity-options?organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user.backendToken}`,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProjects(data.data);
        })
        .catch(() => toast.error('Failed to load projects'));
    }
  }, [open, organizationId]);

  // --- 2. Cascade: Project Selected -> Load Dependencies ---
  useEffect(() => {
    if (!projectId) {
      setObjectives([]); setInterventionAreas([]); setInterventions([]);
      return;
    }
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setObjectives(proj.objectives || []);
      setInterventionAreas(proj.interventionAreas || []);

      // Flatten interventions from programs
      const flattened = proj.programs?.flatMap((prog: any) => prog.interventions || []) || [];
      // Remove duplicates by ID
      const unique = [...new Map(flattened.map((item: any) => [item.id, item])).values()];
      setInterventions(unique);
    }
  }, [projectId, projects]);

  // --- 3. Cascade: Objective Selected -> Load Indicators ---
  useEffect(() => {
    if (!objectiveId || !projectId) {
      setIndicators([]);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activity-indicators?objectiveId=${objectiveId}&projectId=${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setIndicators(data.data);
      })
      .catch(() => console.error("Failed to fetch indicators"));
  }, [objectiveId, projectId]);

  // --- 4. Cascade: Intervention Selected -> Load Subs ---
  useEffect(() => {
    const currentInterv = interventions.find((i) => i.id === interventionId);
    setSubInterventions(currentInterv?.SubIntervention || []);
  }, [interventionId, interventions]);


  const renderInterventionArea = (a: any) => {
    if (!a) return 'N/A';

    return [
      a.state?.name && `State: ${a.state.name}`,
      a.district?.name && `District: ${a.district.name}`,
      a.blockName?.name && `Block: ${a.blockName.name}`,
      a.gramPanchayat?.name && `GP: ${a.gramPanchayat.name}`,
      a.villageName?.name && `Village: ${a.villageName.name}`,
    ]
      .filter(Boolean)
      .join(' → ');
  };

  const selectedArea = useMemo(() => {
    if (!interventionAreaId) return null;
    return interventionAreas.find((a) => a.id === interventionAreaId) || null;
  }, [interventionAreaId, interventionAreas]);


  // --- 5. Calculation: Month Range ---
  const monthRange = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const list = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Iterate from 1st of start month to last of end month
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const stopDate = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    while (current <= stopDate) {
      const year = current.getFullYear();
      const monthIdx = current.getMonth();
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${monthNames[monthIdx]} '${String(year).slice(2)}`;
      list.push({ key, label });
      current.setMonth(current.getMonth() + 1);
    }
    return list;
  }, [startDate, endDate]);

  // --- 6. Calculation: Location Preview ---
  const resolvedLocation = useMemo(() => {
    if (!interventionAreaId || !levelOfIntervention) return null;
    const area = interventionAreas.find((a) => a.id === interventionAreaId);
    if (!area) return null;

    const lvl = levelOfIntervention.toLowerCase();
    if (lvl === 'state') return `State: ${area.state?.name || 'N/A'}`;
    if (lvl === 'district') return `District: ${area.district?.name || 'N/A'}`;
    if (lvl === 'block') return `Block: ${area.blockName?.name || 'N/A'}`;
    if (lvl === 'gram panchayat') return `GP: ${area.gramPanchayat?.name || 'N/A'}`;
    if (lvl === 'village') return `Village: ${area.villageName?.name || 'N/A'}`;
    return area.location || 'Generic Location';
  }, [interventionAreaId, levelOfIntervention, interventionAreas]);

  // --- 7. Validation: Targets ---
  const currentTargetSum = Object.values(planMonthlyTargets).reduce((a, b) => a + (b || 0), 0);
  const totalBudget = (targetUnit || 0) * (costPerUnit || 0);
  const isOverTarget = currentTargetSum > targetUnit;
  const isTargetMatched = currentTargetSum === targetUnit && targetUnit > 0;

  // --- Submit Handler ---
  const onSubmit = async (values: FormValues) => {
    if (isOverTarget) {
      toast.error(`Monthly targets (${currentTargetSum}) exceed Total Target (${targetUnit})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        totalBudget,
        organizationId,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plan-activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create');

      toast.success('Plan & Activity Created Successfully!');
      if (onActivityCreated) onActivityCreated();
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Error creating activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className='h-9 rounded-md '>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Activity & Plan
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Create Activity & Plan</DialogTitle>
          <DialogDescription>
            Define activity details, location, and monthly physical targets.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">

              {/* --- SECTION 1: BASICS --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Project *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl className='truncate'>
                          <SelectTrigger className='truncate'>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Project" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name *</FormLabel>
                      <FormControl><Input placeholder="E.g. Community Training" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- SECTION 2: HIERARCHY --- */}
              <div className="p-4 bg-slate-50 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="objectiveId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Objective</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!projectId}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Objective" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {objectives.map((o) => (
                            <SelectItem key={o.id} value={o.id}>{o.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="indicatorId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Indicator</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!objectiveId}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Indicator" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indicators.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interventionId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Intervention</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!projectId}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Intervention" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {interventions.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subInterventionId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Sub-Intervention</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!interventionId}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Sub-Intervention" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subInterventions.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- SECTION 3: LOCATION & TYPE --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="levelofIntervention"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Level of Intervention *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Level" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levelTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {resolvedLocation && (
                        <div className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {resolvedLocation}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interventionAreaId"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Intervention Area *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={!projectId}
                            className="h-auto py-2 justify-start text-left whitespace-normal"
                          >
                            {selectedArea
                              ? renderInterventionArea(selectedArea)
                              : 'Select intervention area'}
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="p-0 w-[420px]">
                          <Command>
                            <CommandList>
                              {interventionAreas.map((area) => (
                                <CommandItem
                                  key={area.id}
                                  onSelect={() => field.onChange(area.id)}
                                  className="whitespace-normal break-words"
                                >
                                  {renderInterventionArea(area)}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Activity Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <span className="truncate text-left w-full">
                              <SelectValue placeholder="Select Type" />
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- SECTION 4: BUDGET & DATES --- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-md border bg-slate-50">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <MonthYearPicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <MonthYearPicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetUnit"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Target Count *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="number" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem className='truncate'>
                      <FormLabel>Cost / Unit</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="number" {...field} />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="col-span-2 md:col-span-1">
                  <FormLabel>Total Budget</FormLabel>
                  <div className="mt-2 text-sm font-bold border rounded px-3 py-2 bg-white">
                    {totalBudget.toLocaleString()}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-3 truncate">
                      <FormLabel>Unit Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Beneficiaries" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- SECTION 5: MONTHLY PLANNING GRID --- */}
              <div className={
                `border rounded-lg p-4 transition-colors 
                  ${isOverTarget ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`
              }>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm">Monthly Planning Breakdown</h3>
                    <p className="text-xs text-muted-foreground">Distribute the target ({targetUnit}) across months</p>
                  </div>
                  <Badge variant={isOverTarget ? "destructive" : isTargetMatched ? "default" : "secondary"}>
                    Plan Sum: {currentTargetSum} / {targetUnit}
                  </Badge>
                </div>

                {monthRange.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded bg-slate-50">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    Select Start and End dates to view planning grid
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {monthRange.map((m) => (
                      <div key={m.key} className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">{m.label}</label>
                        <Input
                          type="number"
                          placeholder="0"
                          className={`h-8 text-xs ${isOverTarget ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                          value={planMonthlyTargets[m.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            form.setValue(`planMonthlyTargets.${m.key}`, val, { shouldValidate: true });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {isOverTarget && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Allocated targets exceed the total target count. Please adjust.
                  </div>
                )}
              </div>


              <FormField
                control={form.control}
                name="leverage"
                render={({ field }) => (
                  <FormItem className='truncate'>
                    <FormLabel>Leverage / Remarks</FormLabel>
                    <FormControl><Textarea {...field} className="min-h-[60px]" /></FormControl>
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-slate-50">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting || isOverTarget}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}