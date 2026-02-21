"use client";

import { useEffect, useState, useCallback } from "react";
import { createColumns, type Report } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { MISLoading } from "@/components/loader";
import { CreateReportDialog } from "./components/create-report-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import Link from "next/link";
import { EditReportDialog } from "./components/edit-report-dialog";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const {
    isLoading: permLoading,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
  } = usePermissions();

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reports");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch reports: ${response.status} ${errorText}`,
        );
      }
      const data = await response.json();
      setReports(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.log("Error details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching reports",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReportCreated = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportUpdated = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReportDeleted = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  const columns = createColumns(
    setEditingId,
    handleReportUpdated,
    handleReportDeleted,
  );

  useEffect(() => {
    fetchReports();
  }, []);

  if (isLoading) {
    return <MISLoading />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reports</CardTitle>
        <div className="flex gap-2">
          {canCreate("reports") && (
            <CreateReportDialog onReportCreated={handleReportCreated} />
          )}
          <Link
            className="text-sm p-2.5 bg-black text-white rounded-md"
            href={"/org-dashboard/reports/raw"}
          >
            View Raw Data
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={reports} />
      </CardContent>

      {editingId && (
        <EditReportDialog
          reportId={editingId}
          open={!!editingId}
          onClose={() => setEditingId(null)}
          onReportUpdated={handleReportUpdated}
        />
      )}
    </Card>
  );
}
