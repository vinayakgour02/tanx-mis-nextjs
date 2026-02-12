import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Target, MapPin, Briefcase, Info, Loader2, BarChart3 } from "lucide-react";

export interface PlanData {
  id: string;
  status: string;
  startMonth: string;
  endMonth: string;
  monthlyTargets: Record<string, number>;
  project: {
    name: string;
  };
  activity: {
    name: string;
    unitOfMeasure: string | null;
    indicator?: { name: string } | null;
    Intervention?: { name: string } | null;
  };
  location: string;
}

export interface PlanDetailsDialogProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
}

const PlanDetailsDialog: React.FC<PlanDetailsDialogProps> = ({ planId, isOpen, onClose }) => {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (isOpen && planId) {
        setLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/plan/${planId}`);
          const result = await response.json();
          if (result.success) setPlan(result.data);
        } catch (error) {
          console.error("Failed to fetch plan:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPlanDetails();
  }, [isOpen, planId]);

  /**
   * Generates keys matching your DB format: "YYYY-MM"
   */
  const getMonthRange = (start: string, end: string) => {
    const months = [];
    let current = new Date(start);
    const last = new Date(end);
    
    while (current <= last) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      
      months.push({
        key: `${year}-${month}`, // Matches "2026-03"
        label: current.toLocaleString('default', { month: 'short' }),
        year: year
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const monthRange = plan ? getMonthRange(plan.startMonth, plan.endMonth) : [];
  const monthlyTargets = plan?.monthlyTargets || {};
  const currentTargetSum = Object.values(monthlyTargets).reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-t-4 border-t-orange-600 bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            Plan Overview
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            <p className="mt-4 text-slate-500 font-medium">Loading details...</p>
          </div>
        ) : plan ? (
          <div className="space-y-8 py-4">
            
            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <DetailItem icon={<Info />} label="Activity" value={plan.activity.name} />
              <DetailItem icon={<Briefcase />} label="Project" value={plan.project.name} />
              <DetailItem icon={<Target />} label="Intervention" value={plan.activity.Intervention?.name} />
              <DetailItem icon={<BarChart3 />} label="Indicator" value={plan.activity.indicator?.name} />
              <DetailItem 
                icon={<Calendar />} 
                label="Duration" 
                value={`${new Date(plan.startMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} - ${new Date(plan.endMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`} 
              />
              <DetailItem icon={<Target />} label="Unit of Measure" value={plan.activity.unitOfMeasure || 'N/A'} />
            </div>

            {/* Location Section */}
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <h4 className="text-xs font-bold text-orange-700 uppercase flex items-center gap-2 mb-3 tracking-wider">
                <MapPin className="w-4 h-4" /> Location Details
              </h4>
              <div className="text-sm font-semibold text-slate-700">
                {plan.location || "No location specified"}
              </div>
            </div>

            {/* Monthly Breakdown Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 uppercase tracking-tight">
                  <Calendar className="w-4 h-4 text-orange-600" /> Monthly Targets
                </h3>
                <div className="px-3 py-1 bg-white border border-orange-200 rounded-full shadow-sm">
                  <span className="text-xs text-slate-500 font-medium uppercase mr-2">Total:</span>
                  <span className="text-sm font-bold text-orange-600">{currentTargetSum}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {monthRange.map((m) => {
                  const val = monthlyTargets[m.key] || 0;
                  const hasValue = val > 0;
                  return (
                    <div 
                      key={m.key} 
                      className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1
                        ${hasValue 
                          ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-100' 
                          : 'bg-slate-50/50 border-slate-100 opacity-60'}`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {m.label} '{m.year.toString().slice(-2)}
                      </span>
                      <span className={`text-base font-bold ${hasValue ? 'text-orange-600' : 'text-slate-300'}`}>
                        {val > 0 ? val : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No plan data found.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Sub-component for clean layout
const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | null }) => (
  <div className="flex items-start gap-4 group">
    <div className="mt-1 p-1.5 bg-slate-50 rounded-md text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-200">
      {React.cloneElement(icon as React.ReactElement, { })}
    </div>
    <div className="space-y-0.5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-800 leading-tight">{value || '-'}</p>
    </div>
  </div>
);

export default PlanDetailsDialog;