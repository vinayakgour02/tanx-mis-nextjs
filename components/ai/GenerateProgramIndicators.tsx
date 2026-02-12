"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Target, TrendingUp } from "lucide-react";

interface GenerateProgramIndicatorsProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProgramIndicators({ 
  organizationId, 
  onResult 
}: GenerateProgramIndicatorsProps) {
  const [numIndicatorsPerProgram, setNumIndicatorsPerProgram] = useState(3);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateIndicators = async () => {
    if (!organizationId.trim()) {
      const error = "Organization ID is required";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (numIndicatorsPerProgram < 1 || numIndicatorsPerProgram > 10) {
      const error = "Number of indicators per program must be between 1 and 10";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/ai/ai-program-indicators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          numIndicatorsPerProgram,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate program indicators");
      }

      onResult(data);
    } catch (error) {
      console.error("Error generating program indicators:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate program indicators";
      setLocalError(errorMessage);
      onResult(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="numIndicators">
          Number of Indicators per Program
        </Label>
        <Input
          id="numIndicators"
          type="number"
          min="1"
          max="10"
          value={numIndicatorsPerProgram}
          onChange={(e) => setNumIndicatorsPerProgram(parseInt(e.target.value) || 1)}
          placeholder="Enter number (1-10)"
        />
        <p className="text-sm text-muted-foreground">
          Each program's objectives will get this many indicators
        </p>
      </div>

      <Button
        onClick={handleGenerateIndicators}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Program Indicators...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            Generate & Insert Program Indicators
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
          <TrendingUp className="h-3 w-3" />
          <span>AI will analyze each program's context (theme, sector, budget)</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3" />
          <span>Indicators will be generated for each objective within programs</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3" />
          <span>All indicators will be saved as program-level indicators</span>
        </div>
      </div>
    </div>
  );
}