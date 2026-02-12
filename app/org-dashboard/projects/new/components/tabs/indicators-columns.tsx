"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

type IndicatorData = {
  id?: string;
  name: string;
  type: string;
  level?: string;
  definition: string;
  frequency: string;
  unitOfMeasure: string;
  dataSource: string;
  baselineValue?: string;
  target?: string;
  rationale?: string;
  disaggregateBy?: string;
};

type IndicatorActionsProps = {
  onEdit: (indicator: IndicatorData) => void;
  onDelete: (indicator: IndicatorData) => void;
};

// Display mappings for enum values
const displayMappings = {
  // Indicator Types
  OUTPUT: 'Output',
  OUTCOME: 'Outcome',
  IMPACT: 'Impact',
  
  // Frequencies
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
  ONE_TIME: 'One Time',
} as const;

export const createColumns = (actions: IndicatorActionsProps): ColumnDef<IndicatorData>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <Badge variant="outline">{displayMappings[value as keyof typeof displayMappings] || value}</Badge>;
    },
  },
  {
    accessorKey: "frequency",
    header: "Frequency",
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return displayMappings[value as keyof typeof displayMappings] || value;
    },
  },
  {
    accessorKey: "unitOfMeasure",
    header: "Unit of Measure",
  },
  {
    accessorKey: "dataSource",
    header: "Data Source",
  },
  {
    accessorKey: "baselineValue",
    header: "Baseline",
  },
  {
    accessorKey: "target",
    header: "Target",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const indicator = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => actions.onEdit(indicator)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onDelete(indicator)}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export type { IndicatorData }; 