"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GenerateOrgIndicatorsProps {
  organizationId: string;
  onResult?: (data: any, error?: string) => void;
}

export default function GenerateOrgIndicators({ organizationId, onResult }: GenerateOrgIndicatorsProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/ai/ai-org-indicators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          prompt: "Create multiple indicators for each objective related to this organization",
          numIndicatorsPerObjective: 3,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        onResult?.(null, error.error || "Failed to generate indicators");
        return;
      }

      const data = await res.json();
      onResult?.(data, undefined);

    } catch (err) {
      console.error(err);
      onResult?.(null, err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading || !organizationId.trim()}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate Indicators via AI"
      )}
    </Button>
  );
}
