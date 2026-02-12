"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DeleteReportDialogProps {
  reportId: string;
  reportType?: string;
  onReportDeleted?: () => void;
}

export function DeleteReportDialog({ reportId, reportType, onReportDeleted }: DeleteReportDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete report")
      }

      toast.success("Report deleted successfully!")
      
      // Trigger parent callback to refresh data
      if (onReportDeleted) {
        onReportDeleted()
      }
    } catch (error) {
      console.error("Error deleting report:", error)
      toast.error("Failed to delete report", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Report</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this {reportType || "report"}? This action cannot be undone and will permanently remove the report and all associated data including attachments, participants, and other related information.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Report"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}