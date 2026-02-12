"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type IndicatorRow = {
  id: string;
  name: string;
  type: string;
  level: string;
  frequency: string;
  unitOfMeasure: string;
  project?: { name: string } | null;
  program?: { name: string } | null;
};

export function getColumns(
  onEdit: (row: IndicatorRow) => void,
  data: IndicatorRow[] = []
): ColumnDef<IndicatorRow>[] {
  const hasProjects = data.some((row) => row.project);
  const hasPrograms = data.some((row) => row.program);

  const baseColumns: ColumnDef<IndicatorRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <Badge variant="outline">{value}</Badge>;
      },
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <Badge variant="outline">{value}</Badge>;
      },
    },
    ...(hasProjects
      ? [
          {
            accessorKey: "project.name",
            header: "Project",
            cell: ({ row }) => row.original.project?.name || "-",
          } as ColumnDef<IndicatorRow>,
        ]
      : []),
    ...(hasPrograms
      ? [
          {
            accessorKey: "program.name",
            header: "Program",
            cell: ({ row }) => row.original.program?.name || "-",
          } as ColumnDef<IndicatorRow>,
        ]
      : []),
    {
      accessorKey: "frequency",
      header: "Frequency",
    },
    {
      accessorKey: "unitOfMeasure",
      header: "Unit of Measure",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return baseColumns;
}
