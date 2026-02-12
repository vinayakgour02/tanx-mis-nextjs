import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, MapPin, Hash, IndianRupee, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandItem, CommandList } from '@/components/ui/command';

const levelTypes = ['State', 'District', 'Block', 'Gram Panchayat', 'Village'] as const;

// Schema
const editSchema = z.object({
    interventionAreaId: z.string().min(1, 'Intervention Area is required'),
    levelofIntervention: z.enum(levelTypes),
    planMonthlyTargets: z.record(z.string(), z.coerce.number()),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditActivityDialogProps {
    activityId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onActivityUpdated: () => void;
}

export function EditActivityDialog({ activityId, open, onOpenChange, onActivityUpdated }: EditActivityDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Data State
    const [activityData, setActivityData] = useState<any>(null);
    const [interventionAreas, setInterventionAreas] = useState<any[]>([]);
    const form = useForm<EditFormValues>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            planMonthlyTargets: {},
        },
    });

    // Watch fields
    const interventionAreaId = useWatch({ control: form.control, name: 'interventionAreaId' });
    const levelOfIntervention = useWatch({ control: form.control, name: 'levelofIntervention' });
    const planMonthlyTargets = useWatch({ control: form.control, name: 'planMonthlyTargets' }) || {};

    // 1. Fetch Data on Open
    useEffect(() => {
        if (open && activityId) {
            setIsLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plan-activities/${activityId}`)
                .then((res) => res.json())
                .then((response) => {
                    if (response.success) {
                        const data = response.data;
                        setActivityData(data);
                        setInterventionAreas(data.project?.interventionAreas || []);

                        const currentPlan = data.Plan?.[0];
                        form.reset({
                            interventionAreaId: currentPlan?.interventionAreaId || '',
                            levelofIntervention: data.levelofIntervention,
                            planMonthlyTargets: currentPlan?.monthlyTargets || {},
                        });
                    }
                })
                .catch(() => toast.error('Failed to load activity details'))
                .finally(() => setIsLoading(false));
        }
    }, [open, activityId, form]);

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



    // 2. Month Calculation
    const monthRange = useMemo(() => {
        if (!activityData?.startDate || !activityData?.endDate) return [];
        const start = new Date(activityData.startDate);
        const end = new Date(activityData.endDate);
        const list = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    }, [activityData]);

    // 3. Location Logic
    const resolvedLocation = useMemo(() => {
        if (!interventionAreaId || !levelOfIntervention) return '';
        const area = interventionAreas.find((a) => a.id === interventionAreaId);
        if (!area) return '';

        const lvl = levelOfIntervention.toLowerCase();
        if (lvl === 'state') return area.state?.name || '';
        if (lvl === 'district') return area.district?.name || '';
        if (lvl === 'block') return area.blockName?.name || '';
        if (lvl === 'gram panchayat') return area.gramPanchayat?.name || '';
        if (lvl === 'village') return area.villageName?.name || '';

        return area.location || '';
    }, [interventionAreaId, levelOfIntervention, interventionAreas]);


    // 4. Calculations & Validation
    const fixedTarget = activityData?.targetUnit || 0;
    const currentTargetSum = Object.values(planMonthlyTargets).reduce((a, b) => a + (b || 0), 0);
    const costPerUnit = activityData?.costPerUnit || 0;
    const newTotalBudget = currentTargetSum * costPerUnit;

    // Validation Check
    const isOverTarget = currentTargetSum > fixedTarget;

    // 5. Submit
    const onSubmit = async (values: EditFormValues) => {
        if (isOverTarget) {
            toast.error(`Total targets cannot exceed ${fixedTarget}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plan-activities/${activityId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('Activity updated successfully');
            onActivityUpdated();
            onOpenChange(false);
        } catch (error) {
            toast.error('Error updating activity');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Edit Activity Plan</DialogTitle>
                    <DialogDescription>
                        Update location and monthly targets.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1 px-6 py-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">

                                {/* READ ONLY SECTION */}
                                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                                    <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3 tracking-wider">Activity Details (Read-Only)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-90">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Project</label>
                                            <Input className="bg-white" disabled value={activityData?.project?.name || ''} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Activity Name</label>
                                            <Input className="bg-white" disabled value={activityData?.name || ''} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Objective</label>
                                            <Input className="bg-white" disabled value={activityData?.objective?.description || 'N/A'} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Intervention</label>
                                            <Input className="bg-white" disabled value={activityData?.Intervention?.name || 'N/A'} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Unit of Measure</label>
                                            <Input className="bg-white" disabled value={activityData?.unitOfMeasure || 'N/A'} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Target Unit (Fixed)</label>
                                            <Input className="bg-white font-bold" disabled value={fixedTarget} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground">Cost Per Unit</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                                                <Input className="pl-9 bg-white" disabled value={activityData?.costPerUnit || 0} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* EDITABLE LOCATION SECTION */}
                                <div className="border p-4 rounded-lg space-y-4">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Location Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <FormField
                                            control={form.control}
                                            name="interventionAreaId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Intervention Area</FormLabel>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
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
                                            name="levelofIntervention"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Level of Intervention</FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select level" />
                                                            </SelectTrigger>
                                                        </FormControl>

                                                        <SelectContent>
                                                            {levelTypes.map((lvl) => (
                                                                <SelectItem key={lvl} value={lvl}>
                                                                    {lvl}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />


                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Plan Location
                                        </label>
                                        <Input
                                            value={resolvedLocation || '—'}
                                            disabled
                                            className="bg-slate-100"
                                        />
                                    </div>


                                </div>

                                {/* MONTHLY PLANNING GRID */}
                                <div className={`border rounded-lg p-4 transition-colors duration-200 ${isOverTarget ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex flex-col">
                                            <h3 className={`font-semibold text-sm ${isOverTarget ? 'text-red-700' : ''}`}>Monthly Planning Breakdown</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Allocate the fixed target across months.
                                            </p>
                                        </div>
                                        {isOverTarget && (
                                            <Badge variant="destructive" className="flex gap-1 items-center">
                                                <AlertCircle className="w-3 h-3" />
                                                Exceeds Limit
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {monthRange.map((m) => (
                                            <div key={m.key} className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-500">{m.label}</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className={`h-8 text-xs ${isOverTarget ? 'border-red-300 focus-visible:ring-red-400' : ''}`}
                                                    value={planMonthlyTargets[m.key] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                        form.setValue(`planMonthlyTargets.${m.key}`, val);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {isOverTarget && (
                                        <div className="mt-3 text-xs text-red-600 font-medium flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Total allocation ({currentTargetSum}) cannot exceed the fixed target of {fixedTarget}.
                                        </div>
                                    )}
                                </div>

                                {/* LIVE SUMMARY */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`border rounded p-3 flex items-center gap-3 transition-colors ${isOverTarget ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                                        <Hash className={`w-5 h-5 ${isOverTarget ? 'text-red-600' : 'text-blue-600'}`} />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Targets</p>
                                            <p className={`text-lg font-bold ${isOverTarget ? 'text-red-700' : 'text-blue-700'}`}>
                                                {currentTargetSum} <span className="text-sm font-normal text-muted-foreground">/ {fixedTarget}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border rounded p-3 flex items-center gap-3 bg-green-50 border-green-100">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Total Budget</p>
                                            <p className="text-lg font-bold text-green-700">{newTotalBudget.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </Form>
                    </ScrollArea>
                )}

                <DialogFooter className="p-4 border-t bg-slate-50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting || isOverTarget}
                        className={isOverTarget ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}