"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "./data-table";
import { getColumns, IndicatorRow } from "./columns";
import { NewIndicatorDialog } from "./_components/new-indicator-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2, PlusCircle } from "lucide-react";

async function getIndicators() {
  const res = await fetch("/api/org-dashboard/indicator");
  if (!res.ok) {
    throw new Error("Failed to fetch indicators");
  }
  return res.json();
}

export default function IndicatorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<IndicatorRow | null>(null);
  const { can } = usePermissions();

  const { data: indicators, isLoading, refetch } = useQuery({
    queryKey: ["indicators"],
    queryFn: getIndicators,
  });

  const serializedIndicators: IndicatorRow[] = useMemo(
    () =>
      indicators?.map((indicator: any) => ({
        ...indicator,
        createdAt: new Date(indicator.createdAt).toISOString(),
        updatedAt: new Date(indicator.updatedAt).toISOString(),
        baselineDate: indicator.baselineDate
          ? new Date(indicator.baselineDate).toISOString()
          : null,
      })) || [],
    [indicators]
  );

  const columns = useMemo(
    () =>
      getColumns((row) => {
        setSelected(row);
        setEditOpen(true);
      }),
    []
  );

  const scope = "organization";

  const canCreate =
  scope === "organization"
    ? can("indicators", "create") || can("indicators", "admin")
    : can("organization.indicators", "write") ||
      can("organization.indicators", "create") ||
      can("organization.indicators", "admin");

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-md border">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">
              Organization Indicators
            </CardTitle>
            <CardDescription>
              Manage performance indicators for your organization
            </CardDescription>
          </div>
          {canCreate && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Indicator
            </Button>
          )} 
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading indicators...
            </div>
          ) : serializedIndicators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
              <p className="text-sm">No indicators found.</p>
              {canCreate && (
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  Add your first indicator
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable columns={columns} data={serializedIndicators} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      {canCreate && (
        <NewIndicatorDialog
          scope="organization"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            setDialogOpen(false);
            refetch();
          }}
        />
      )}

      {/* Edit dialog */}
      {canCreate && (
        <NewIndicatorDialog
          scope="organization"
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            setEditOpen(false);
            setSelected(null);
            refetch();
          }}
          indicator={selected as any}
        />
      )}
    </div>
  );
}
