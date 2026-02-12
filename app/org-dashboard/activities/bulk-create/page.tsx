'use client'

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  AlertCircle, 
  Calendar, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

import { useOrganizationId } from "@/hooks/useOrganizationId"; 

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Types ---

interface SubIntervention {
  id: string;
  name: string;
}

interface Intervention {
  id: string;
  name: string;
  SubIntervention: SubIntervention[];
}

interface InterventionArea {
  id: string;
  location?: string;
  state?: { name: string };
  district?: { name: string };
  blockName?: { name: string };
  gramPanchayat?: { name: string };
  villageName?: { name: string };
}

interface Indicator {
  id: string;
  name: string;
}

interface Objective {
  id: string;
  description: string;
}

interface Program {
  interventions: Intervention[];
}

interface Project {
  id: string;
  name: string;
  objectives: Objective[];
  programs: Program[];
  interventionAreas: InterventionArea[];
}

interface MonthlyTargets {
  [key: string]: number;
}

interface ActivityRow {
  id: number;
  name: string;
  financialYear: string;
  objectiveId: string;
  indicatorId: string;
  interventionId: string;
  subInterventionId: string;
  interventionAreaId: string;
  levelofIntervention: string;
  locationPreview: string;
  type: string;
  startMonth: string;
  endMonth: string;
  unitOfMeasure: string;
  targetUnit: string | number; // Input often treats numbers as strings initially
  costPerUnit: string | number;
  monthlyTargets: MonthlyTargets;
  availableIndicators: Indicator[];
  availableSubInterventions: SubIntervention[];
}

interface ProjectContext {
  objectives: Objective[];
  interventions: Intervention[];
  interventionAreas: InterventionArea[];
}

// --- Constants ---
const FINANCIAL_YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028", "2028-2029"];
const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

const MONTH_INDEX_MAP: Record<string, number> = {
  "April": 3, "May": 4, "June": 5, "July": 6, "August": 7, "September": 8, 
  "October": 9, "November": 10, "December": 11, 
  "January": 0, "February": 1, "March": 2 
};

export default function BulkCreateActivity() {
  const router = useRouter();
  const { organizationId } = useOrganizationId();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    objectives: [], 
    interventions: [], 
    interventionAreas: [],
  });
  
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: session, status } = useSession()
  // -- Load Projects --
  useEffect(() => {
    if (!organizationId) return;
    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activity-options?organizationId=${organizationId}`,
               {
          headers: {
            Authorization: `Bearer ${session?.user.backendToken}`,
          },
        }
            );
            if (res.data.success) setProjects(res.data.data);
            

        } catch (err) {
            console.error("Failed to load projects", err);
        }
    };
    fetchProjects();
  }, [organizationId]);

  // -- Load Context --
  useEffect(() => {
    if (!selectedProjectId) return;
    const proj = projects.find(p => p.id === selectedProjectId);
    if (!proj) return;
    
    const flatInterventions = proj.programs?.flatMap((p) => p.interventions || []) || [];
    // Deduplicate interventions
    const uniqueInterventions = Array.from(new Map(flatInterventions.map((i) => [i.id, i])).values());
    
    setProjectContext({
      objectives: proj.objectives || [],
      interventions: uniqueInterventions,
      interventionAreas: proj.interventionAreas || [],
    });
    
    if(rows.length === 0) setRows([{ ...getEmptyRow() }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, projects]);

  // -- Helpers --
  const getEmptyRow = (): ActivityRow => ({
    id: Date.now() + Math.random(), 
    name: '',
    financialYear: '2025-2026',
    objectiveId: '', indicatorId: '', interventionId: '', subInterventionId: '', interventionAreaId: '',
    levelofIntervention: 'Village',
    locationPreview: '---', 
    type: 'General',
    startMonth: '', endMonth: '',
    unitOfMeasure: '', targetUnit: 0, costPerUnit: 0,
    monthlyTargets: { April: 0, May: 0, June: 0, July: 0, August: 0, September: 0, October: 0, November: 0, December: 0, January: 0, February: 0, March: 0 },
    availableIndicators: [], availableSubInterventions: []
  });

  const addRow = () => setRows(prev => [...prev, getEmptyRow()]);
  const removeRow = (index: number) => setRows(prev => prev.filter((_, i) => i !== index));

const updateRow = (index: number, field: keyof ActivityRow, value: any) => {
    // STEP 1: Update the field immediately (Synchronous)
    setRows(prev => {
      const newRows = [...prev];
      // Create a shallow copy of the row to avoid mutating state directly
      const row = { ...newRows[index], [field]: value };

      // --- Synchronous Logic (Interventions/Areas) ---
      // This logic is safe to keep here because it doesn't wait for a server
      
      if (field === 'interventionId') {
        const interv = projectContext.interventions.find((i) => i.id === value);
        row.availableSubInterventions = interv?.SubIntervention || [];
      }
      
      if (field === 'interventionAreaId' || field === 'levelofIntervention') {
         const areaId = field === 'interventionAreaId' ? value : row.interventionAreaId;
         const level = (field === 'levelofIntervention' ? value : row.levelofIntervention) as string;
         
         const area = projectContext.interventionAreas.find((a) => a.id === areaId);
         
         if (area) {
             const lvl = level.toLowerCase();
             let locText = area.location || 'Area';
             
             if (lvl === 'state' && area.state) locText = `State: ${area.state.name}`;
             else if (lvl === 'district' && area.district) locText = `Dist: ${area.district.name}`;
             else if (lvl === 'block' && area.blockName) locText = `Blk: ${area.blockName.name}`;
             else if (lvl === 'gram panchayat' && area.gramPanchayat) locText = `GP: ${area.gramPanchayat.name}`;
             else if (lvl === 'village' && area.villageName) locText = `Vil: ${area.villageName.name}`;
             
             row.locationPreview = locText;
         }
      }

      // If Objective changes, clear old indicators immediately so user doesn't see stale data
      if (field === 'objectiveId') {
          row.availableIndicators = [];
          row.indicatorId = ''; 
      }

      newRows[index] = row;
      return newRows;
    });

    // STEP 2: Handle API Calls (Asynchronous)
    // We do this OUTSIDE the setRows callback
    if (field === 'objectiveId') {
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/activity-indicators?objectiveId=${value}&projectId=${selectedProjectId}`)
          .then(res => { 
             // STEP 3: Update State AGAIN when data arrives
             setRows(prev => {
                 const newRows = [...prev];
                 // Safety check: make sure the row still exists
                 if (!newRows[index]) return prev;

                 newRows[index] = { 
                     ...newRows[index], 
                     availableIndicators: res.data.data 
                 };
                 return newRows;
             });
          })
          .catch(err => console.error("Failed to fetch indicators", err));
    }
  };

  const updateMonthlyTarget = (rowIndex: number, month: string, value: string) => {
    setRows(prev => {
      const newRows = [...prev];
      const val = value === '' ? 0 : parseInt(value);
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        monthlyTargets: {
            ...newRows[rowIndex].monthlyTargets,
            [month]: isNaN(val) ? 0 : val
        }
      };
      return newRows;
    });
  };

  // --- Smart Lock Logic ---
  const isMonthDisabled = (row: ActivityRow, monthName: string) => {
    if (!row.startMonth || !row.endMonth || !row.financialYear) return true;
    
    const [fyStart, fyEnd] = row.financialYear.split('-').map(Number);
    let columnYear = fyStart;
    
    if (["January", "February", "March"].includes(monthName)) columnYear = fyEnd;
    
    const colMonthIndex = MONTH_INDEX_MAP[monthName];
    // Format as YYYY-MM for string comparison
    const columnDateKey = `${columnYear}-${String(colMonthIndex + 1).padStart(2, '0')}`;
    
    return columnDateKey < row.startMonth || columnDateKey > row.endMonth;
  };

  const isFormValid = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every(row => {
      const currentSum = Object.values(row.monthlyTargets).reduce((a, b) => a + (b || 0), 0);
      const target = Number(row.targetUnit) || 0;
      return currentSum <= target && row.name.trim().length > 0 && row.objectiveId && row.interventionAreaId && row.startMonth && row.endMonth;
    });
  }, [rows]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bulk-plan-activities`, { projectId: selectedProjectId, organizationId, rows });
      toast.success('Bulk Plan Created Successfully!');
      router.push('/org-dashboard/activities');
    } catch (error: any) {
      console.error(error);
      toast.error('Error: ' + (error.response?.data?.message || 'Failed'));
    } finally {
      setLoading(false);
    }
  };

  // --- Render Selection Screen ---
  if (!selectedProjectId) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-200 shadow-xl rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Planner</h1>
          <p className="text-gray-500 text-sm">Select a project to begin bulk planning activities.</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Project</label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-600 focus:border-orange-600 block p-3 pr-8 shadow-sm transition-all"
              onChange={(e) => setSelectedProjectId(e.target.value)}
              value={selectedProjectId}
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const selectedProjectName = projects.find(p => p.id === selectedProjectId)?.name;

  // --- Render Editor ---
  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
      
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedProjectId('')} 
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            title="Change Project"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <span className="text-gray-400 font-medium whitespace-nowrap">Planning:</span> 
              <span className="text-orange-600 truncate">{selectedProjectName}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{rows.length} activities pending</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={addRow} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-orange-600 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!isFormValid || loading} 
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
              isFormValid && !loading
                ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-600 shadow-orange-200" 
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            {loading ? (
               <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"/>
            ) : (
               <CheckCircle2 className="w-4 h-4" />
            )}
            Save Plan
          </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
        <div className="relative border border-gray-200 rounded-lg shadow-sm bg-white min-w-max">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-30 shadow-sm ring-1 ring-gray-900/5">
              <tr>
                {/* Top Left Sticky Corner: High z-index needed to stay above sticky left col and sticky header */}
                <th className="p-3 border-b border-r bg-gray-50 sticky left-0 top-0 z-40 w-10"></th>
                <th className="p-3 border-b border-r min-w-[220px] font-semibold text-left">Activity Name</th>
                <th className="p-3 border-b border-r min-w-[180px] font-semibold text-left">Objective & Indicator</th>
                <th className="p-3 border-b border-r min-w-[200px] font-semibold text-left">Location & Area</th>
                <th className="p-3 border-b border-r min-w-[140px] font-semibold text-left">Details</th>
                <th className="p-3 border-b border-r min-w-[150px] font-semibold text-left bg-orange-50/50 text-orange-900">Timeline</th>
                <th className="p-3 border-b border-r min-w-[120px] font-semibold text-left bg-orange-50/50 text-orange-900">Financials</th>
                <th className="p-3 border-b border-r min-w-[130px] font-semibold text-center bg-yellow-50 text-yellow-800 border-l-4 border-l-yellow-300/50">Fiscal Year</th>
                {MONTHS.map(m => (
                  <th key={m} className="p-2 border-b border-r min-w-[80px] text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                    {m.substring(0,3)}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, idx) => {
                const currentSum = Object.values(row.monthlyTargets).reduce((a, b) => a + (b || 0), 0);
                const target = Number(row.targetUnit) || 0;
                const isOverLimit = currentSum > target;
                const costPerUnit = parseFloat(row.costPerUnit as string) || 0;
                const totalBudget = (target * costPerUnit).toFixed(2);
                
                return (
                  <tr key={row.id} className="group hover:bg-orange-50/30 transition-colors">
                    {/* Delete Action - Sticky Left Column */}
                    {/* z-index 20 ensures it floats above standard cells when scrolling horizontally */}
                    <td className="p-2 border-r bg-white group-hover:bg-orange-50 sticky left-0 z-20 text-center shadow-[1px_0_3px_rgba(0,0,0,0.05)]">
                      <button 
                        onClick={() => removeRow(idx)} 
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        tabIndex={-1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Activity Name */}
                    <td className="p-2 border-r align-top">
                      <input 
                        className="w-full p-2 bg-transparent border border-transparent hover:border-gray-200 focus:bg-white focus:border-orange-500 rounded text-sm font-medium focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:font-normal"
                        value={row.name} 
                        onChange={e => updateRow(idx, 'name', e.target.value)} 
                        placeholder="e.g. Conduct Village Meeting..." 
                      />
                      {!row.name && <div className="text-[10px] text-red-400 pl-2 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Required</div>}
                    </td>

                    {/* Objective & Indicator (Grouped) */}
                    <td className="p-2 border-r align-top space-y-2">
                      <TableSelect 
                        value={row.objectiveId} 
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRow(idx, 'objectiveId', e.target.value)}
                        placeholder="Select Objective..."
                        options={projectContext.objectives.map(o => ({ value: o.id, label: o.description }))}
                      />
                      <TableSelect 
                        value={row.indicatorId} 
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRow(idx, 'indicatorId', e.target.value)}
                        placeholder="Select Indicator..."
                        disabled={!row.objectiveId}
                        options={row.availableIndicators?.map((i) => ({ value: i.id, label: i.name }))}
                      />
                    </td>

                    {/* Location (Grouped) */}
                    <td className="p-2 border-r align-top space-y-2">
                      <div className="flex gap-1">
                        <TableSelect 
                            className="w-1/2"
                            value={row.levelofIntervention} 
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRow(idx, 'levelofIntervention', e.target.value)}
                            options={['State', 'District', 'Block', 'Gram Panchayat', 'Village'].map(l => ({ value: l, label: l }))}
                        />
                         <TableSelect 
                            className="w-1/2"
                            value={row.interventionAreaId} 
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRow(idx, 'interventionAreaId', e.target.value)}
                            placeholder="Area..."
                            options={projectContext.interventionAreas.map(a => ({ value: a.id, label: a.state?.name + ' ' + a.district?.name + ' ' + a.blockName?.name  || 'Area' }))}
                        />
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate h-6 leading-4">
                        {row.locationPreview}
                      </div>
                    </td>

                    {/* Details (Type) */}
                    <td className="p-2 border-r align-top">
                       <TableSelect 
                          value={row.type} 
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => updateRow(idx, 'type', e.target.value)}
                          options={['General', 'Training', 'Household'].map(t => ({ value: t, label: t }))}
                        />
                    </td>
                    
                    {/* Timeline */}
                    <td className="p-2 border-r align-top bg-orange-50/20 space-y-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">Start</label>
                        <input 
                            type="month" 
                            className="w-full text-xs p-1 border border-gray-200 rounded bg-white focus:border-orange-500 outline-none" 
                            value={row.startMonth} 
                            onChange={e => updateRow(idx, 'startMonth', e.target.value)} 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-gray-400 uppercase font-bold">End</label>
                        <input 
                            type="month" 
                            className="w-full text-xs p-1 border border-gray-200 rounded bg-white focus:border-orange-500 outline-none" 
                            value={row.endMonth} 
                            onChange={e => updateRow(idx, 'endMonth', e.target.value)} 
                        />
                      </div>
                    </td>
                    
                    {/* Financials / Targets */}
                    <td className="p-2 border-r align-top bg-orange-50/20 space-y-1">
                       <div className="flex items-center justify-between gap-2">
                         <span className="text-[10px] text-gray-500">Target</span>
                         <input 
                            type="number" 
                            className={cn(
                                "w-16 p-1 text-right text-xs border rounded font-bold outline-none focus:ring-1 focus:ring-orange-500", 
                                isOverLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white border-gray-200'
                            )}
                            value={row.targetUnit} 
                            onChange={e => updateRow(idx, 'targetUnit', e.target.value)} 
                          />
                       </div>
                       <div className="flex items-center justify-between gap-2">
                         <span className="text-[10px] text-gray-500">Cost/U</span>
                         <input 
                            type="number" 
                            className="w-16 p-1 text-right text-xs border border-gray-200 rounded bg-white outline-none focus:ring-1 focus:ring-orange-500" 
                            value={row.costPerUnit} 
                            onChange={e => updateRow(idx, 'costPerUnit', e.target.value)} 
                         />
                       </div>
                       <div className="pt-1 mt-1 border-t border-orange-200/50 flex justify-between items-center font-mono text-xs font-medium text-gray-700">
                         <span>₹</span>
                         <span>{totalBudget}</span>
                       </div>
                    </td>

                    {/* Financial Year */}
                    <td className="p-2 border-r align-middle bg-yellow-50 border-l-4 border-l-yellow-300">
                      <div className="relative">
                        <select 
                            className="w-full p-2 pr-6 bg-transparent font-bold text-gray-800 text-sm appearance-none outline-none cursor-pointer hover:bg-yellow-100 rounded" 
                            value={row.financialYear} 
                            onChange={e => updateRow(idx, 'financialYear', e.target.value)}
                        >
                            {FINANCIAL_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1 top-2.5 h-3 w-3 text-yellow-600 pointer-events-none" />
                      </div>
                    </td>

                    {/* MONTHLY TARGETS */}
                    {MONTHS.map(m => {
                      const isDisabled = isMonthDisabled(row, m);
                      return (
                        <td key={m} className={cn(
                          "p-1 border-r text-center transition-colors align-middle", 
                          isDisabled ? 'bg-gray-100/80' : 'bg-white'
                        )}>
                          <input 
                            type="number" 
                            disabled={isDisabled}
                            className={cn(
                                "w-full h-full min-w-[50px] text-center bg-transparent text-sm py-2 outline-none transition-all placeholder:text-gray-300",
                                isDisabled ? 'cursor-not-allowed opacity-20' : 'hover:bg-gray-50 focus:bg-orange-50 focus:font-bold',
                                !isDisabled && row.monthlyTargets[m] > 0 ? 'text-orange-700 font-semibold' : 'text-gray-600'
                            )}
                            value={row.monthlyTargets[m] || ''} 
                            onChange={e => updateMonthlyTarget(idx, m, e.target.value)} 
                            placeholder="-"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {rows.length === 0 && (
             <div className="p-10 text-center text-gray-400">
                <p>No activities added yet.</p>
                <button onClick={addRow} className="mt-2 text-orange-600 hover:underline">Add your first activity</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Internal Component: Lightweight Styled Select ---
interface TableSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string | number; label: string }[];
    placeholder?: string;
}

const TableSelect = ({ className, options, placeholder, ...props }: TableSelectProps) => (
  <div className={cn("relative", className)}>
    <select 
      className={cn(
        "w-full appearance-none bg-white border border-gray-200 text-xs rounded px-2 py-1.5 pr-6 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-gray-700 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 truncate",
        !props.value && "text-gray-400"
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value} className="text-gray-900 truncate">
          {o.label.length > 30 ? o.label.substring(0, 30) + '...' : o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-1.5 top-2 h-3 w-3 text-gray-400 pointer-events-none" />
  </div>
);