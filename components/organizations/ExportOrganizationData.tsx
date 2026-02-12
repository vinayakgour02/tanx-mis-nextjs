"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportOrganizationDataProps {
  organizationId: string;
  organizationName: string;
}

export function ExportOrganizationData({ organizationId, organizationName }: ExportOrganizationDataProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Export completed successfully!", {
        description: `Downloaded ${filename}`,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Organization Data
        </CardTitle>
        <CardDescription>
          Export all organization data to Excel format with human-readable references
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Export Includes:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <ul className="space-y-1">
              <li>• Organization Objectives</li>
              <li>• Organization Indicators</li>
              <li>• Donors</li>
              <li>• Intervention Coverage</li>
              <li>• Programs</li>
              <li>• Program Objectives</li>
            </ul>
            <ul className="space-y-1">
              <li>• Program Indicators</li>
              <li>• Program Interventions</li>
              <li>• Projects</li>
              <li>• Project Activities</li>
              <li>• Project Plans</li>
              <li>• Reports</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-amber-900 mb-1">Note:</h4>
          <p className="text-xs text-amber-800">
            All references use human-readable names/codes instead of database IDs. 
            Each data type is exported to a separate sheet in the Excel file.
          </p>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}