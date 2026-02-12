"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Activity, Zap, Target } from "lucide-react";

interface GenerateProgramActivitiesProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProgramActivities({ 
  organizationId, 
  onResult 
}: GenerateProgramActivitiesProps) {
  const [numInterventionsPerObjective, setNumInterventionsPerObjective] = useState(2);
  const [numSubInterventionsPerIntervention, setNumSubInterventionsPerIntervention] = useState(3);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateActivities = async () => {
    if (!organizationId.trim()) {
      const error = "Organization ID is required";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (numInterventionsPerObjective < 1 || numInterventionsPerObjective > 5) {
      const error = "Number of interventions per objective must be between 1 and 5";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (numSubInterventionsPerIntervention < 1 || numSubInterventionsPerIntervention > 8) {
      const error = "Number of sub-interventions per intervention must be between 1 and 8";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/ai/ai-program-activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          numInterventionsPerObjective,
          numSubInterventionsPerIntervention,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate program activities");
      }

      onResult(data);
    } catch (error) {
      console.error("Error generating program activities:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate program activities";
      setLocalError(errorMessage);
      onResult(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numInterventions">
            Interventions per Objective
          </Label>
          <Input
            id="numInterventions"
            type="number"
            min="1"
            max="5"
            value={numInterventionsPerObjective}
            onChange={(e) => setNumInterventionsPerObjective(parseInt(e.target.value) || 1)}
            placeholder="Enter number (1-5)"
          />
          <p className="text-xs text-muted-foreground">
            Each objective will get this many interventions
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numSubInterventions">
            Sub-Interventions per Intervention
          </Label>
          <Input
            id="numSubInterventions"
            type="number"
            min="1"
            max="8"
            value={numSubInterventionsPerIntervention}
            onChange={(e) => setNumSubInterventionsPerIntervention(parseInt(e.target.value) || 1)}
            placeholder="Enter number (1-8)"
          />
          <p className="text-xs text-muted-foreground">
            Each intervention will get this many sub-interventions
          </p>
        </div>
      </div>

      <Button
        onClick={handleGenerateActivities}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Program Activities...
          </>
        ) : (
          <>
            <Activity className="mr-2 h-4 w-4" />
            Generate & Insert Program Activities
          </>
        )}
      </Button>

      {localError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3" />
          <span>AI will analyze program context and objectives</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3" />
          <span>Interventions will be linked to relevant indicators</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3" />
          <span>Sub-interventions will be automatically created</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3" />
          <span>All activities will be saved to your programs</span>
        </div>
      </div>
    </div>
  );
}