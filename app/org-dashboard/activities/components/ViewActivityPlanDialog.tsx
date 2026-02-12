import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, MapPin, Hash, IndianRupee, Calendar, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ViewActivityPlanDialogProps {
    activityId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewActivityPlanDialog({ activityId, open, onOpenChange }: ViewActivityPlanDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activityData, setActivityData] = useState<any>(null);

    // 1. Fetch Data on Open
    useEffect(() => {
        if (open && activityId) {
            setIsLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plan-activities/${activityId}`)
                .then((res) => res.json())
                .then((response) => {
                    if (response.success) {
                        setActivityData(response.data);
                    }
                })
                .catch(() => toast.error('Failed to load activity details'))
                .finally(() => setIsLoading(false));
        } else if (!open) {
            setActivityData(null);
        }
    }, [open, activityId]);

    // 2. Data Extraction Helpers
    const currentPlan = activityData?.Plan?.[0];
    const monthlyTargets = currentPlan?.monthlyTargets || {};
    const interventionAreaId = currentPlan?.interventionAreaId;
    const interventionAreas = activityData?.project?.interventionAreas || [];

    // 3. Location Rendering Logic
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
        return interventionAreas.find((a: any) => a.id === interventionAreaId) || null;
    }, [interventionAreaId, interventionAreas]);

    // 4. Month Calculation
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

    // 5. Financial & Target Calculations
    const fixedTarget = activityData?.targetUnit || 0;
    const currentTargetSum = Object.values(monthlyTargets).reduce((a: any, b: any) => a + (b || 0), 0);
    const costPerUnit = activityData?.costPerUnit || 0;
    const totalBudget = Number(currentTargetSum) * costPerUnit;
    const isTargetMet = Number(currentTargetSum) === Number(fixedTarget);

    // Formatter
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-y-auto">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50/50">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <DialogTitle className="text-xl">Activity Plan Details</DialogTitle>
                            <DialogDescription>
                                View configured location, targets, and budget allocation.
                            </DialogDescription>
                        </div>
                        {activityData && (
                            <Badge variant={isTargetMet ? "default" : "secondary"} className={isTargetMet ? "bg-green-600 hover:bg-green-700" : ""}>
                                {isTargetMet ? "Fully Planned" : "Planning Incomplete"}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="flex-1 px-6 py-6">
                        <div className="space-y-8">

                            {/* SECTION 1: CORE DETAILS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                        <Hash className="w-4 h-4 text-blue-500" /> Basic Info
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 pl-6">
                                        <InfoItem label="Project" value={activityData?.project?.name} />
                                        <InfoItem label="Activity Name" value={activityData?.name} />
                                        <InfoItem label="Objective" value={activityData?.objective?.description} />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                        <Target className="w-4 h-4 text-blue-500" /> Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                        <InfoItem label="Intervention Type" value={activityData?.Intervention?.name} />
                                        <InfoItem label="Unit of Measure" value={activityData?.unitOfMeasure} />
                                        <InfoItem label="Fixed Target" value={fixedTarget} highlight />
                                        <InfoItem label="Cost Per Unit" value={formatCurrency(costPerUnit)} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* SECTION 2: LOCATION */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                    <MapPin className="w-4 h-4 text-blue-500" /> Location Strategy
                                </h3>
                                <div className="bg-slate-50 border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Intervention Area</span>
                                        <p className="text-sm mt-1 text-slate-700 font-medium leading-relaxed">
                                            {selectedArea ? renderInterventionArea(selectedArea) : 'No Area Selected'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Level of Intervention</span>
                                            <p className="text-sm mt-1 text-slate-700">{activityData?.levelofIntervention || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Plan Location</span>
                                            <p className="text-sm mt-1 text-slate-700">{currentPlan?.location || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: MONTHLY BREAKDOWN */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                        <Calendar className="w-4 h-4 text-blue-500" /> Monthly Breakdown
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        Total Allocated: <span className="font-medium text-slate-900">{Number(currentTargetSum)}</span> / {fixedTarget}
                                    </span>
                                </div>
                                
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 divide-x divide-y bg-white">
                                        {monthRange.map((m) => {
                                            const val = monthlyTargets[m.key] || 0;
                                            const hasValue = val > 0;
                                            return (
                                                <div key={m.key} className={`p-3 text-center flex flex-col items-center justify-center gap-1 transition-colors ${hasValue ? 'bg-blue-50/50' : ''}`}>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
                                                    <span className={`text-sm font-medium ${hasValue ? 'text-blue-700' : 'text-slate-300'}`}>
                                                        {val > 0 ? val : '-'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {!isTargetMet && (
                                    <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded border border-amber-100">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Allocated targets ({currentTargetSum}) do not match the fixed target ({fixedTarget}).</span>
                                    </div>
                                )}
                            </div>

                            {/* SECTION 4: FINANCIAL SUMMARY */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-orange-600 text-slate-50 rounded-lg p-4 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-white text-xs font-medium uppercase tracking-wider mb-1">Total Targets</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">{Number(currentTargetSum)}</span>
                                            <span className="text-sm text-white">/ {fixedTarget} units</span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between text-green-900">
                                    <div>
                                        <p className="text-green-600 text-xs font-medium uppercase tracking-wider mb-1">Total Budget</p>
                                        <span className="text-2xl font-bold">{formatCurrency(totalBudget)}</span>
                                    </div>
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <IndianRupee className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="p-4 border-t bg-slate-50">
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Simple Helper Component for Read-Only Fields
function InfoItem({ label, value, highlight = false }: { label: string, value: string | number | undefined, highlight?: boolean }) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
            <span className={`text-sm ${highlight ? 'font-bold text-slate-900' : 'text-slate-700'} truncate`} title={String(value)}>
                {value || 'N/A'}
            </span>
        </div>
    );
}