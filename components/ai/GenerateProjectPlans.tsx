import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Calendar, Target } from 'lucide-react';
import { format } from 'date-fns';

interface GenerateProjectPlansProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

// Helper function to generate fiscal year options
function generateFiscalYearOptions() {
  const currentYear = new Date().getFullYear();
  const options = [];
  
  // Generate 5 years: 2 past, current, 2 future
  for (let i = -2; i <= 2; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    const label = `FY ${startYear}-${String(endYear % 100).padStart(2, "0")}`;
    options.push({
      value: `${startYear}`,
      label,
      startDate: new Date(startYear, 3, 1), // April 1st
      endDate: new Date(endYear, 2, 31, 23, 59, 59) // March 31st
    });
  }
  
  return options;
}

export default function GenerateProjectPlans({ organizationId, onResult }: GenerateProjectPlansProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');
  const [targetDistributionStrategy, setTargetDistributionStrategy] = useState('even');
  const [includeOnlyActiveProjects, setIncludeOnlyActiveProjects] = useState(true);

  const fiscalYearOptions = generateFiscalYearOptions();
  const currentFY = fiscalYearOptions.find(fy => {
    const now = new Date();
    return now >= fy.startDate && now <= fy.endDate;
  });

  const handleGenerate = async () => {
    if (!organizationId.trim()) {
      toast.error('Organization ID is required');
      return;
    }

    if (!selectedFiscalYear) {
      toast.error('Please select a fiscal year');
      return;
    }

    const selectedFY = fiscalYearOptions.find(fy => fy.value === selectedFiscalYear);
    if (!selectedFY) {
      toast.error('Invalid fiscal year selected');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/ai-project-plan-seeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId,
          planYearStart: selectedFY.startDate.toISOString(),
          planYearEnd: selectedFY.endDate.toISOString(),
          targetDistributionStrategy,
          includeOnlyActiveProjects
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      toast.success(`Successfully generated ${data.summary.totalPlans} plans across ${data.summary.projectsProcessed} projects for ${selectedFY.label}`);
      onResult(data);
    } catch (err) {
      console.error('Error generating project plans:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate project plans';
      toast.error(errorMessage);
      onResult(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fiscalYear" className="text-sm font-medium">
          Fiscal Year
        </Label>
        <Select value={selectedFiscalYear} onValueChange={setSelectedFiscalYear}>
          <SelectTrigger>
            <SelectValue placeholder="Select fiscal year" />
          </SelectTrigger>
          <SelectContent>
            {fiscalYearOptions.map((fy) => (
              <SelectItem key={fy.value} value={fy.value}>
                {fy.label} {fy === currentFY && '(Current)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Plans will be created for activities that overlap with the selected fiscal year
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDistribution" className="text-sm font-medium">
          Target Distribution Strategy
        </Label>
        <Select value={targetDistributionStrategy} onValueChange={setTargetDistributionStrategy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="even">Even Distribution</SelectItem>
            <SelectItem value="weighted">Weighted (Higher in middle months)</SelectItem>
            <SelectItem value="frontloaded">Front-loaded (Higher in early months)</SelectItem>
            <SelectItem value="backloaded">Back-loaded (Higher in later months)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How monthly targets should be distributed across the fiscal year
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="activeProjects"
            checked={includeOnlyActiveProjects}
            onChange={(e) => setIncludeOnlyActiveProjects(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="activeProjects" className="text-sm font-medium">
            Include only ACTIVE projects
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          When checked, only creates plans for projects with ACTIVE status
        </p>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={loading || !organizationId.trim() || !selectedFiscalYear}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Project Plans...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            Generate Project Plans
          </>
        )}
      </Button>
      
      {loading && (
        <div className="text-xs text-muted-foreground">
          This may take a few moments while AI generates plans for each project activity...
        </div>
      )}
    </div>
  );
}