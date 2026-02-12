"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GenerateProgramsProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GeneratePrograms({ organizationId, onResult }: GenerateProgramsProps) {
  const [numPrograms, setNumPrograms] = useState(5);
  const [programThemes, setProgramThemes] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGeneratePrograms = async () => {
    if (!organizationId.trim()) {
      const error = "Organization ID is required";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    if (numPrograms < 1 || numPrograms > 10) {
      const error = "Number of programs must be between 1 and 10";
      setLocalError(error);
      onResult(null, error);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await fetch("/api/ai/ai-program-seeder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          numPrograms,
          programThemes: programThemes.trim() || undefined,
          budget: budget.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate programs");
      }

      toast.success(`Successfully generated ${data.summary.totalPrograms} programs`, {
        description: `Created programs for organization: ${data.summary.organizationName}`,
      });

      onResult(data);
    } catch (error) {
      console.error("Error generating programs:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate programs";
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numPrograms">
            Number of Programs (1-10)
          </Label>
          <Input
            id="numPrograms"
            type="number"
            min="1"
            max="10"
            value={numPrograms}
            onChange={(e) => setNumPrograms(Number(e.target.value))}
            placeholder="5"
          />
          <p className="text-xs text-muted-foreground">
            How many programs to generate
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
        <Label htmlFor="programThemes">
          Program Themes (Optional)
        </Label>
        <Textarea
          id="programThemes"
          value={programThemes}
          onChange={(e) => setProgramThemes(e.target.value)}
          placeholder="e.g., Education, Health, Environment, Agriculture, Women Empowerment"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated themes to focus on. AI will use these as guidance for program generation.
        </p>
      </div>

      <Button
        onClick={handleGeneratePrograms}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Programs...
          </>
        ) : (
          `Generate ${numPrograms} Programs`
        )}
      </Button>
    </div>
  );
}