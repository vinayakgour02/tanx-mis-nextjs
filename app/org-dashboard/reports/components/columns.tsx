import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ViewReportDialog } from "./view-report-dialog"
import { EditReportDialog } from "./edit-report-dialog"
import { DeleteReportDialog } from "./delete-report-dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Report = {
  id: string
  type: string
  status: string
  reportingDate: Date
  project?: { name: string } | null
  program?: { name: string } | null
  creator: {
    firstName: string
    lastName: string
  }
  interventionArea?: {
    state?: { name: string } | null
    district?: { name: string } | null
    blockName?: { name: string } | null
    villageName?: { name: string } | null
    gramPanchayat?: { name: string } | null
  } | null
  createdAt: Date
}

export const createColumns = (onReportUpdated?: () => void, onReportDeleted?: () => void): ColumnDef<Report>[] => [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue("type")}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={
            (status === "APPROVED" ? "success" :
            status === "DRAFT" ? "default" :
            status === "REJECTED" ? "warning" :
            "secondary") as any
          }>
          {status.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "project.name",
    header: "Project",
    cell: ({ row }) => row.original.project?.name || "-",
  },
  {
    accessorKey: "program.name",
    header: "Program",
    cell: ({ row }) => row.original.program?.name || "-",
  },
  {
    id: "location",
    header: "Location",
    cell: ({ row }) => {
      const area = row.original.interventionArea
      if (!area) return "-"
      
      const locationParts = [
        area.villageName?.name,
        area.gramPanchayat?.name,
        area.blockName?.name,
        area.district?.name,
        area.state?.name
      ].filter(Boolean)
      
      return locationParts.length > 0 ? locationParts.join(", ") : "-"
    },
  },
  {
    accessorKey: "creator",
    header: "Created By",
    cell: ({ row }) => `${row.original.creator.firstName} ${row.original.creator.lastName}`,
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
      const report = row.original
      
      return (
        <div className="flex items-center gap-2">
          <ViewReportDialog reportId={report.id} />
          <EditReportDialog 
            reportId={report.id} 
            onReportUpdated={onReportUpdated}
          />
          <DeleteReportDialog 
            reportId={report.id}
            reportType={report.type}
            onReportDeleted={onReportDeleted}
          />
        </div>
      )
    },
  },
]

export const columns = createColumns() 