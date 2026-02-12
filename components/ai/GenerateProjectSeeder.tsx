"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, FolderPlus, Target, DollarSign, Users } from "lucide-react";

interface GenerateProjectSeederProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProjectSeeder({ 
  organizationId, 
  onResult 
}: GenerateProjectSeederProps) {
  const [numProjects, setNumProjects] = useState(2);
  const [projectThemes, setProjectThemes] = useState("Education, Health, Environment, Agriculture, Women Empowerment");
  const [budget, setBudget] = useState("100000-2000000");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateProjects = async () => {
    if (!organizationId.trim()) {
      const error = "Organization ID is required";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (numProjects < 1 || numProjects > 10) {
      const error = "Number of projects must be between 1 and 10";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/ai/ai-project-seeder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          numProjects,
          projectThemes: projectThemes.trim() || undefined,
          budget: budget.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate projects");
      }

      onResult(data);
    } catch (error) {
      console.error("Error generating projects:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate projects";
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
          <Label htmlFor="numProjects">
            Number of Projects
          </Label>
          <Input
            id="numProjects"
            type="number"
            min="1"
            max="10"
            value={numProjects}
            onChange={(e) => setNumProjects(parseInt(e.target.value) || 1)}
            placeholder="Enter number (1-10)"
          />
          <p className="text-xs text-muted-foreground">
            How many projects to generate
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">
            Budget Range (INR)
          </Label>
          <Input
            id="budget"
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., 100000-2000000"
          />
          <p className="text-xs text-muted-foreground">
            Budget range in local currency (optional)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectThemes">
          Project Themes (Optional)
        </Label>
        <Textarea
          id="projectThemes"
          value={projectThemes}
          onChange={(e) => setProjectThemes(e.target.value)}
          placeholder="e.g., Education, Health, Environment, Agriculture, Women Empowerment"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated themes to focus on. AI will use these as guidance for project generation.
        </p>
      </div>

      <Button
        onClick={handleGenerateProjects}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Projects...
          </>
        ) : (
          <>
            <FolderPlus className="mr-2 h-4 w-4" />
            Generate & Create Projects
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
          <FolderPlus className="h-3 w-3" />
          <span>AI will create complete projects with basic details</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-3 w-3" />
          <span>Generates objectives and indicators for each project</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3" />
          <span>Creates funding allocation with available donors</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          <span>Connects projects to existing programs and locations</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3" />
          <span>Creates intervention areas for geographic targeting</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3" />
          <span>All projects will be saved to your organization</span>
        </div>
      </div>
    </div>
  );
}