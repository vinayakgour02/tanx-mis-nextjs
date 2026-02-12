"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SeedLocationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeedLocationsDialog({ open, onOpenChange }: SeedLocationsDialogProps) {
  const [orgId, setOrgId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSeed() {
    if (!orgId?.trim()) {
      toast("Organization ID is required");
      return;
    }
    if (!prompt?.trim()) {
      toast("Prompt is required");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/seed-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, prompt }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to seed locations");
      }

      setResult(data.createdStates);
      toast("Locations seeded successfully!");
    } catch (err: any) {
      console.error("Location seeding error:", err);
      toast(`Error seeding locations: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seed Locations with AI</DialogTitle>
          <DialogDescription>
            Enter your organization ID and a prompt describing the states, districts, blocks, gram panchayats, and villages you want to create. The AI will generate realistic names.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block mb-1 font-medium">Organization ID</label>
            <Input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="Enter organization ID"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Prompt for Locations</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Generate 3 states, each with 2–3 districts, each with 2 blocks, etc."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSeed} disabled={loading}>
              {loading ? "Seeding..." : "Seed Locations"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-semibold mb-2">Seeded States:</h4>
              <ul className="list-disc list-inside space-y-1 max-h-64 overflow-y-auto">
                {result.map((s: any) => (
                  <li key={s.id}>
                    {s.name} ({s.districts?.length ?? 0} districts)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
