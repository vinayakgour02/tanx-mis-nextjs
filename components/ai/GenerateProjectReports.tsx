"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Users, Target, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface GenerateProjectReportsProps {
  organizationId: string;
  onResult: (data: any, error?: string) => void;
}

export default function GenerateProjectReports({ organizationId, onResult }: GenerateProjectReportsProps) {
  const [loading, setLoading] = useState(false);
  const [reportsPerActivity, setReportsPerActivity] = useState(2);
  const [reportStatus, setReportStatus] = useState("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!organizationId.trim()) {
      setError("Organization ID is required");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/ai/ai-project-report-seeder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: organizationId.trim(),
          reportsPerActivity,
          reportStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate reports");
      }

      setResult(data);
      onResult(data);

      toast.success("Reports generated successfully!", {
        description: `Created ${data.summary.totalReports} reports for ${data.summary.totalActivitiesProcessed} activities across ${data.summary.projectsProcessed} projects.`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate reports";
      setError(errorMessage);
      onResult(null, errorMessage);

      toast.error("Failed to generate reports", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Section */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="reportsPerActivity" className="text-sm font-medium">
            Reports per Activity
          </Label>
          <Select
            value={reportsPerActivity.toString()}
            onValueChange={(value) => setReportsPerActivity(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select number of reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Report per Activity</SelectItem>
              <SelectItem value="2">2 Reports per Activity</SelectItem>
              <SelectItem value="3">3 Reports per Activity</SelectItem>
              <SelectItem value="4">4 Reports per Activity</SelectItem>
              <SelectItem value="5">5 Reports per Activity</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Number of progress reports to generate for each activity
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportStatus" className="text-sm font-medium">
            Report Status
          </Label>
          <Select
            value={reportStatus}
            onValueChange={setReportStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select report status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Default status for generated reports
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={loading || !organizationId.trim()}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Reports...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Generate Project Reports
          </>
        )}
      </Button>

      {/* Information Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This will generate realistic progress reports for all active projects and their activities. 
          Reports will include location data, progress metrics, and participant information for training activities.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Reports Generated Successfully
            </CardTitle>
            <CardDescription>
              Generated {result.summary.totalReports} reports for {result.summary.totalActivitiesProcessed} activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{result.summary.totalReports}</div>
                <div className="text-xs text-blue-600">Total Reports</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{result.summary.totalActivitiesProcessed}</div>
                <div className="text-xs text-green-600">Activities Covered</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{result.summary.totalPeopleReached}</div>
                <div className="text-xs text-purple-600">People Reached</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{result.summary.projectsProcessed}</div>
                <div className="text-xs text-orange-600">Projects</div>
              </div>
            </div>

            {/* Report Types Breakdown */}
            {Object.keys(result.summary.reportTypes).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Report Types Generated:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.summary.reportTypes).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status Breakdown */}
            {Object.keys(result.summary.reportsByStatus).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Reports by Status:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.summary.reportsByStatus).map(([status, count]) => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Project Breakdown */}
            {Object.keys(result.summary.reportsPerProject).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Reports per Project:</h4>
                <div className="grid gap-1 text-xs">
                  {Object.entries(result.summary.reportsPerProject).map(([project, count]) => (
                    <div key={project} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                      <span className="truncate">{project}</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {count as number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training-specific metrics */}
            {result.summary.trainingReports > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Training Reports:</h4>
                <div className="text-sm text-muted-foreground">
                  Generated {result.summary.trainingReports} training reports with {result.summary.totalParticipants} total participants
                </div>
              </div>
            )}

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="text-sm">
                <span className="font-medium">Total Units Reported:</span>
                <span className="ml-2">{result.summary.totalUnitReported.toLocaleString()}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Avg Reports/Activity:</span>
                <span className="ml-2">
                  {(result.summary.totalReports / Math.max(result.summary.totalActivitiesProcessed, 1)).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}