"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

type SerializedProgram = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  baseline: string | null;
  target: string | null;
  status: string;
  priority: string;
  sector: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProgramViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: SerializedProgram | null;
};

export function ProgramViewDialog({
  open,
  onOpenChange,
  program,
}: ProgramViewDialogProps) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {program.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Program details and key information
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Grid Layout for details */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <InfoRow label="Status">
            <Badge
              variant={
                program.status === "Active" ? "default" : "secondary"
              }
            >
              {program.status}
            </Badge>
          </InfoRow>

          <InfoRow label="Priority">
             <Badge
                  variant=
                      "outline"
                      className={`${program.priority === "HIGH" ? 'bg-green-500' : program.priority === "MEDIUM" ? 'bg-yellow-500' : 'bg-amber-500'}`}
                >
                  {program.priority}
                </Badge>
          </InfoRow>

          <InfoRow label="Budget">
            {program.budget
              ? new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(Number(program.budget))
              : "-"}
          </InfoRow>

          <InfoRow label="Start Date">
            {program.startDate
              ? format(new Date(program.startDate), "MMM d, yyyy")
              : "-"}
          </InfoRow>

          <InfoRow label="End Date">
            {program.endDate
              ? format(new Date(program.endDate), "MMM d, yyyy")
              : "-"}
          </InfoRow>

          <InfoRow label="Sector">{program.sector || "-"}</InfoRow>
          <InfoRow label="Theme">{program.theme || "-"}</InfoRow>
        </div>

        <Separator className="my-4" />

        {/* Description */}
        <div>
          <p className="font-semibold mb-1">Description</p>
          <p className="text-muted-foreground text-sm max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed">
            {program.description || "No description available."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reusable row for label + value
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-medium text-muted-foreground">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
