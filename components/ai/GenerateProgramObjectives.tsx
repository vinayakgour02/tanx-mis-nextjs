"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GenerateProgramObjectivesProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProgramObjectives({ organizationId, onResult }: GenerateProgramObjectivesProps) {
  const [objectivesPerProgram, setObjectivesPerProgram] = useState(3);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateObjectives = async () => {
    if (!organizationId.trim()) {
      const error = "Organization ID is required";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (objectivesPerProgram < 1 || objectivesPerProgram > 8) {
      const error = "Number of objectives per program must be between 1 and 8";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/ai/ai-program-objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          objectivesPerProgram,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate program objectives");
      }

      toast.success(`Successfully generated ${data.summary.totalObjectives} objectives`, {
        description: `Created objectives for ${data.summary.programsProcessed} programs in organization: ${data.summary.organizationName}`,
      });

      onResult(data);
    } catch (error) {
      console.error("Error generating program objectives:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate program objectives";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      onResult(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {localError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {localError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="objectivesPerProgram">
          Objectives per Program (1-8)
        </Label>
        <Input
          id="objectivesPerProgram"
          type="number"
          min="1"
          max="8"
          value={objectivesPerProgram}
          onChange={(e) => setObjectivesPerProgram(Number(e.target.value))}
          placeholder="3"
        />
        <p className="text-xs text-muted-foreground">
          How many objectives to generate for each active program
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">What this generates:</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• SMART objectives for each active program</li>
          <li>• Multiple levels: Impact, Outcome, Output, Activity</li>
          <li>• Aligned with program theme and sector</li>
          <li>• Unique codes for easy identification (e.g., EDU-OBJ-01)</li>
          <li>• Comprehensive descriptions (100-200 words)</li>
          <li>• Proper hierarchy and order indexing</li>
        </ul>
      </div>

      <div className="bg-amber-50 p-3 rounded-md">
        <h4 className="text-sm font-medium text-amber-900 mb-1">Note:</h4>
        <p className="text-xs text-amber-800">
          Only active programs will be processed. Each objective will be linked to its respective program and will be created at the program level (not project level).
        </p>
      </div>

      <Button
        onClick={handleGenerateObjectives}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Objectives...
          </>
        ) : (
          `Generate ${objectivesPerProgram} Objectives per Program`
        )}
      </Button>
    </div>
  );
}