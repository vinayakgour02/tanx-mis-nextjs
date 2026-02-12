import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';

interface GenerateProjectActivitiesProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProjectActivities({ organizationId, onResult }: GenerateProjectActivitiesProps) {
  const [loading, setLoading] = useState(false);
  const [numActivitiesPerProject, setNumActivitiesPerProject] = useState(3);

  const handleGenerate = async () => {
    if (!organizationId.trim()) {
      toast.error('Organization ID is required');
      return;
    }

    if (numActivitiesPerProject < 1 || numActivitiesPerProject > 10) {
      toast.error('Number of activities per project must be between 1 and 10');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/ai-project-activity-seeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          organizationId, 
          numActivitiesPerProject 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      toast.success(`Successfully generated ${data.summary.totalActivities} activities across ${data.summary.projectsProcessed} projects`);
      onResult(data);
    } catch (err) {
      console.error('Error generating project activities:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate project activities';
      toast.error(errorMessage);
      onResult(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="numActivitiesPerProject" className="text-sm font-medium">
          Activities per Project
        </Label>
        <Input
          id="numActivitiesPerProject"
          type="number"
          min="1"
          max="10"
          value={numActivitiesPerProject}
          onChange={(e) => setNumActivitiesPerProject(parseInt(e.target.value) || 3)}
          placeholder="Enter number of activities per project"
        />
        <p className="text-xs text-muted-foreground">
          Number of activities to generate for each project (1-10)
        </p>
      </div>
      
      <Button
        onClick={handleGenerate}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Project Activities...
          </>
        ) : (
          <>
            <Activity className="mr-2 h-4 w-4" />
            Generate Project Activities
          </>
        )}
      </Button>
      
      {loading && (
        <div className="text-xs text-muted-foreground">
          This may take a few moments while AI generates activities for each project...
        </div>
      )}
    </div>
  );
}