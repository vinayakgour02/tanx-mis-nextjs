"use client";

import GenerateOrgIndicators from "@/components/ai/GenerateOrgIndicators";
import GenerateProgramIndicators from "@/components/ai/GenerateProgramIndicators";
import GenerateProgramActivities from "@/components/ai/GenerateProgramActivities";
import GenerateProgramObjectives from "@/components/ai/GenerateProgramObjectives";
import GeneratePrograms from "@/components/ai/GeneratePrograms";
import GenerateProjectSeeder from "@/components/ai/GenerateProjectSeeder";
import GenerateProjectActivities from "@/components/ai/GenerateProjectActivities";
import GenerateProjectPlans from "@/components/ai/GenerateProjectPlans";
import GenerateProjectReports from "@/components/ai/GenerateProjectReports";
import { SeedLocationsDialog } from "@/components/ai/locationSeeder";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AISeederPage() {
  const [orgId, setOrgId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const handleSeed = async () => {
    if (!orgId.trim()) {
      setError("Organization ID is required");
      return;
    }
    if (!prompt.trim()) {
      setError("Prompt is required");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const res = await fetch("/api/ai-seeder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, prompt }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }
      
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Request failed");
    }
    setLoading(false);
  };

  const handleIndicatorResult = (data: any, error?: string) => {
    if (error) {
      setError(error);
    } else {
      setResult({ type: 'indicators', data });
    }
  };

  const handleActivityResult = (data: any, error?: string) => {
    if (error) {
      setError(error);
    } else {
      setResult({ type: 'activities', data });
    }
  };

  const handleProjectResult = (data: any, error?: string) => {
    if (error) {
      setError(error);
    } else {
      setResult({ type: 'projects', data });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Seeder Tool</h1>
        <p className="text-muted-foreground">
          Generate objectives, indicators, activities, programs, projects, plans, reports, and locations for your organization using AI
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-10">
        {/* Objectives Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Objectives</CardTitle>
            <CardDescription>
              Create multiple objectives for your organization based on a custom prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                placeholder={`e.g. "Create 8 objectives for women's health program"`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleSeed}
              disabled={loading || !orgId.trim() || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Objectives...
                </>
              ) : (
                "Generate & Insert Objectives"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Indicators Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Indicators</CardTitle>
            <CardDescription>
              Generate indicators for existing objectives in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateOrgIndicators 
              organizationId={orgId} 
              onResult={handleIndicatorResult}
            />
          </CardContent>
        </Card>

        {/* Program Indicators Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Program Indicators</CardTitle>
            <CardDescription>
              Generate indicators for all programs and their objectives in your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProgramIndicators 
              organizationId={orgId} 
              onResult={handleIndicatorResult}
            />
          </CardContent>
        </Card>

        {/* Program Objectives Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Program Objectives</CardTitle>
            <CardDescription>
              Generate SMART objectives for each active program with different levels and comprehensive descriptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProgramObjectives 
              organizationId={orgId} 
              onResult={handleIndicatorResult}
            />
          </CardContent>
        </Card>

        {/* Program Activities Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Program Activities</CardTitle>
            <CardDescription>
              Generate interventions and sub-interventions for all program objectives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProgramActivities 
              organizationId={orgId} 
              onResult={handleActivityResult}
            />
          </CardContent>
        </Card>

        {/* Programs Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Programs</CardTitle>
            <CardDescription>
              Create comprehensive programs with themes, budgets, and timelines for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GeneratePrograms 
              organizationId={orgId} 
              onResult={handleProjectResult}
            />
          </CardContent>
        </Card>

        {/* Project Seeder */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Projects</CardTitle>
            <CardDescription>
              Create complete projects with objectives, indicators, funding, intervention areas, and program connections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProjectSeeder 
              organizationId={orgId} 
              onResult={handleProjectResult}
            />
          </CardContent>
        </Card>

        {/* Project Activities Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Project Activities</CardTitle>
            <CardDescription>
              Generate activities for each project with objectives, indicators, interventions, and budget details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProjectActivities 
              organizationId={orgId} 
              onResult={handleActivityResult}
            />
          </CardContent>
        </Card>

        {/* Project Plans Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Project Plans</CardTitle>
            <CardDescription>
              Generate monthly activity plans for each project with intelligent target distribution across fiscal years
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProjectPlans 
              organizationId={orgId} 
              onResult={handleProjectResult}
            />
          </CardContent>
        </Card>

        {/* Project Reports Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Project Reports</CardTitle>
            <CardDescription>
              Generate realistic progress reports for all projects and their activities with detailed metrics and participant data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <GenerateProjectReports 
              organizationId={orgId} 
              onResult={handleProjectResult}
            />
          </CardContent>
        </Card>

        {/* Location Seeder */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Locations</CardTitle>
            <CardDescription>
              Generate states, districts, blocks, gram panchayats, and villages for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization ID</label>
              <Input
                placeholder="Enter organization ID"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setLocationDialogOpen(true)}
              disabled={!orgId.trim()}
              className="w-full"
            >
              Generate Locations
            </Button>
          </CardContent>
        </Card>
      </div>

      <SeedLocationsDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generation Completed
              {result.type && (
                <Badge variant="secondary" className="ml-2">
                  {result.type}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {result.created?.length || result.data?.created?.length || result.summary?.totalProjects || result.summary?.totalInterventions || result.summary?.totalIndicators || 0} items created successfully
              {result.summary?.totalSubInterventions && (
                <span className="block text-xs mt-1">Including {result.summary.totalSubInterventions} sub-interventions</span>
              )}
              {result.summary?.totalProjects && (
                <span className="block text-xs mt-1">
                  {result.summary.totalProjects} projects with {result.summary.totalObjectives} objectives, {result.summary.totalIndicators} indicators, and {result.summary.totalInterventionAreas} intervention areas
                </span>
              )}
              {result.summary?.totalPlans && (
                <span className="block text-xs mt-1">
                  {result.summary.totalPlans} plans generated for {result.summary.planYearRange?.label} with {result.summary.totalMonthlyTargets} total monthly targets
                </span>
              )}
              {result.summary?.totalReports && (
                <span className="block text-xs mt-1">
                  {result.summary.totalReports} reports generated for {result.summary.totalActivitiesProcessed} activities with {result.summary.totalPeopleReached} people reached
                </span>
              )}
              {result.summary?.totalPrograms && (
                <span className="block text-xs mt-1">
                  {result.summary.totalPrograms} programs generated for organization {result.summary.organizationName}
                </span>
              )}
              {result.summary?.totalObjectives && (
                <span className="block text-xs mt-1">
                  {result.summary.totalObjectives} objectives generated for {result.summary.programsProcessed} programs in organization {result.summary.organizationName}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}