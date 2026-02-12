"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface Program {
  id: string;
  name: string;
}

export function InterventionTemplateDownloader() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch("/api/programs");
        const data = await res.json();
        setPrograms(data);
      } catch (err) {
        toast.error("Failed to fetch programs");
      }
    };
    fetchPrograms();
  }, []);

  const handleDownload = async () => {
    if (!selectedProgram) {
      toast.error("Please select a program before downloading.");
      return;
    }

    setLoading(true);
    try {
      // Call server API to generate Excel
      const res = await fetch(`/api/export-excel?programId=${selectedProgram}`);
      if (!res.ok) throw new Error("Failed to generate Excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "Intervention_Bulk_Template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Excel template downloaded successfully!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download Excel template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Program</DialogTitle>
            <DialogDescription>
              Choose the program for which you want to download the Excel template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program..." />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={loading || !selectedProgram}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}