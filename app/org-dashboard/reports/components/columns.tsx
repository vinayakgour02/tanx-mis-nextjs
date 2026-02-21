import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ViewReportDialog } from "./view-report-dialog";
import { DeleteReportDialog } from "./delete-report-dialog";
import { Button } from "@/components/ui/button";

export type Report = {
  id: string;
  type: string;
  status: string;
  levelofActivity: string;
  reportingDate: Date;
  project?: { name: string } | null;
  activity?: { name: string } | null;
  creator: {
    firstName: string;
    lastName: string;
  };
  interventionArea?: {
    state?: { name: string } | null;
    district?: { name: string } | null;
    blockName?: { name: string } | null;
    villageName?: { name: string } | null;
    gramPanchayat?: { name: string } | null;
  } | null;
  createdAt: Date;
};

const getLocationByLevel = (
  area: Report["interventionArea"],
  level?: string,
) => {
  if (!area) return "-";

  const map: Record<string, (string | undefined)[]> = {
    state: [area.state?.name],

    district: [area.district?.name, area.state?.name],

    blockName: [area.blockName?.name, area.district?.name, area.state?.name],

    gramPanchayat: [
      area.gramPanchayat?.name,
      area.blockName?.name,
      area.district?.name,
      area.state?.name,
    ],

    villageName: [
      area.villageName?.name,
      area.gramPanchayat?.name,
      area.blockName?.name,
      area.district?.name,
      area.state?.name,
    ],
  };

  const parts = map[level ?? ""] || [
    area.villageName?.name,
    area.gramPanchayat?.name,
    area.blockName?.name,
    area.district?.name,
    area.state?.name,
  ];

  return parts.filter(Boolean).join(", ") || "-";
};

export const createColumns = (
  onEdit: (id: string) => void,
  onReportUpdated?: () => void,
  onReportDeleted?: () => void,
): ColumnDef<Report>[] => [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("type")}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            (status === "APPROVED"
              ? "success"
              : status === "DRAFT"
                ? "default"
                : status === "REJECTED"
                  ? "warning"
                  : "secondary") as any
          }
        >
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "project.name",
    header: "Project",
    cell: ({ row }) => row.original.project?.name || "-",
  },
  {
    accessorKey: "activity.name",
    header: "Activity",
    cell: ({ row }) => row.original.activity?.name || "-",
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const area = row.original.interventionArea;
      const level = row.original.levelofActivity;

      return getLocationByLevel(area, level);
    },
  },
  {
    accessorKey: "creator",
    header: "Created By",
    cell: ({ row }) =>
      `${row.original.creator.firstName} ${row.original.creator.lastName}`,
  },
  {
    accessorKey: "reportingDate",
    header: "Reporting Date",
    cell: ({ row }) => format(new Date(row.original.reportingDate), "PPP"),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const report = row.original;

      return (
        <div className="flex items-center gap-2">
          <ViewReportDialog reportId={report.id} />
          <Button size="sm" variant="outline" onClick={() => onEdit(report.id)}>
            Edit
          </Button>

          <DeleteReportDialog
            reportId={report.id}
            reportType={report.type}
            onReportDeleted={onReportDeleted}
          />
        </div>
      );
    },
  },
];
