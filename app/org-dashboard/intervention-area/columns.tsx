"use client";

import { ColumnDef } from "@tanstack/react-table";
import { InterventionArea } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./data-table-column-header";

type InterventionAreaWithProject = InterventionArea & {
  project: {
    name: string;
    code: string | null;
  };
};

export const columns: ColumnDef<InterventionAreaWithProject>[] = [
  {
    accessorKey: "serialNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Serial No." />
    ),
  },
  {
    accessorKey: "state",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="State" />
    ),
  },
  {
    accessorKey: "district",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="District" />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Area Type" />
    ),
  },
  {
    accessorKey: "selectedForYear",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Year" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "APPROVED"
              ? "success"
              : status === "PLANNED"
              ? "default"
              : "destructive"
          }
        >
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
]; 