"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { getColumns, IndicatorRow } from "../../indicators/columns";
import { NewIndicatorDialog } from "../../indicators/_components/new-indicator-dialog";
import { DataTable } from "../../indicators/data-table";

async function getIndicators() {
  const res = await fetch("/api/indicators/programs");
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

  const { data: indicators, refetch } = useQuery({
    queryKey: ["indicators"],
    queryFn: getIndicators,
  });

  const serializedIndicators: IndicatorRow[] = useMemo(() => (
    indicators?.map((indicator: any) => ({
      ...indicator,
      createdAt: new Date(indicator.createdAt).toISOString(),
      updatedAt: new Date(indicator.updatedAt).toISOString(),
      baselineDate: indicator.baselineDate ? new Date(indicator.baselineDate).toISOString() : null,
    })) || []
  ), [indicators]);

  const columns = useMemo(() => getColumns((row) => {
    setSelected(row);
    setEditOpen(true);
  }), []);

  const canCreate = can('indicators', 'create') || can('indicators', 'admin');

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Program Indicators</CardTitle>
          {/* {canCreate && ( */}
            <Button onClick={() => setDialogOpen(true)}>Add New Program Indicator</Button>
          {/* )} */}
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={serializedIndicators} />
        </CardContent>
      </Card>
      {/* {canCreate && ( */}
        <NewIndicatorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            setDialogOpen(false);
            refetch();
          }}
          scope='program'
        />
      {/* )} */}
      {/* Edit dialog shown only if user can create/admin */}
      {/* {canCreate && ( */}
        <NewIndicatorDialog
          open={editOpen}
           scope='program'
          onOpenChange={setEditOpen}
          onSuccess={() => {
            setEditOpen(false);
            setSelected(null);
            refetch();
          }}
          indicator={selected as any}
        />
      {/* )} */}
    </div>
  );
}