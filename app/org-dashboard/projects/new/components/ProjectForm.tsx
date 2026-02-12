'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectSchema, type ProjectFormValues, objectiveLevels } from '../lib/schema';
import { BasicDetailsTab } from './tabs/BasicDetailsTab';
import { ProgramObjectivesTab } from './tabs/ProgramObjectivesTab';
import { IndicatorsTab } from './tabs/IndicatorsTab';
import { FundingTab } from './tabs/FundingTab';
import { TeamTab } from './tabs/TeamTab';
import { ProjectPreview } from './ProjectPreview';
import { InterventionAreasTab } from '../../[id]/components/InterventionAreasTab';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ProjectFormProps {
  initialData?: any;
  projectId?: string;
  onSuccess: (projectId: string) => void;
}

// Lightweight type for programs list in the selector
type ProgramLite = {
  id: string;
  name: string;
  theme?: string | null;
  sector?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export function ProjectForm({ initialData, projectId, onSuccess }: ProjectFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);

  // NEW: programs list state for multi-select tab
  const [programsList, setProgramsList] = useState<ProgramLite[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [programsSearch, setProgramsSearch] = useState('');

  // Load project data if projectId is provided
  useEffect(() => {
    if (projectId && !initialData) {
      const loadProjectData = async () => {
        try {
          setIsLoadingProject(true);
          const response = await fetch(`/api/projects/${projectId}`);
          if (!response.ok) {
            throw new Error('Failed to load project data');
          }
          const projectData = await response.json();

          // Transform the data to match form structure
          const transformedData = {
            ...projectData,
            totalBudget: projectData.totalBudget ? Number(projectData.totalBudget) : undefined,
            directBeneficiaries: projectData.directBeneficiaries ? Number(projectData.directBeneficiaries) : undefined,
            indirectBeneficiaries: projectData.indirectBeneficiaries ? Number(projectData.indirectBeneficiaries) : undefined,
            startDate: projectData.startDate ? new Date(projectData.startDate) : undefined,
            endDate: projectData.endDate ? new Date(projectData.endDate) : undefined,

            // 🔁 NEW: map programs -> programIds
            programIds: Array.isArray(projectData.programs)
              ? projectData.programs.map((p: any) => p.id)
              : [],

            objectives:
              projectData.objectives?.map((obj: any) => ({
                ...obj,
                orderIndex: Number(obj.orderIndex),
                level: obj.level?.toUpperCase() as (typeof objectiveLevels)[number],
              })) || [],
            indicators:
              projectData.indicators?.map((ind: any) => ({
                ...ind,
                baselineValue: ind.baselineValue || undefined,
                target: ind.target || undefined,
              })) || [],
            funding:
              projectData.funding?.map((fund: any) => ({
                ...fund,
                amount: Number(fund.amount),
                year: Number(fund.year),
              })) || [],
            team: projectData.team || [],
          };

          form.reset(transformedData);
        } catch (error) {
          console.error('Error loading project data:', error);
          toast.error('Failed to load project data');
        } finally {
          setIsLoadingProject(false);
        }
      };

      loadProjectData();
    }
  }, [projectId, initialData]);

  // Transform initial data to correct types (also map to programIds)
  const transformedInitialData = initialData
    ? {
        ...initialData,
        totalBudget: initialData.totalBudget ? Number(initialData.totalBudget) : undefined,
        directBeneficiaries: initialData.directBeneficiaries ? Number(initialData.directBeneficiaries) : undefined,
        indirectBeneficiaries: initialData.indirectBeneficiaries ? Number(initialData.indirectBeneficiaries) : undefined,
        startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,

        // 🔁 NEW: prefer programIds if present, else map from programs[]
        programIds: Array.isArray(initialData.programIds)
          ? initialData.programIds
          : Array.isArray(initialData.programs)
          ? initialData.programs.map((p: any) => p.id)
          : [],

        objectives:
          initialData.objectives?.map((obj: any) => ({
            ...obj,
            orderIndex: Number(obj.orderIndex),
            level: obj.level?.toUpperCase() as (typeof objectiveLevels)[number],
          })) || [],
        indicators:
          initialData.indicators?.map((ind: any) => ({
            ...ind,
            baselineValue: ind.baselineValue || undefined,
            target: ind.target || undefined,
          })) || [],
        funding:
          initialData.funding?.map((fund: any) => ({
            ...fund,
            amount: Number(fund.amount),
            year: Number(fund.year),
          })) || [],
        team: initialData.team || [],
      }
    : {
        status: 'DRAFT',
        currency: 'INR',
        // ❌ programId removed
        // ✅ NEW:
        programIds: [] as string[],
        theme: null,
        objectives: [],
        indicators: [],
        funding: [],
        team: [],
      };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: transformedInitialData as ProjectFormValues,
    mode: 'onChange',
    criteriaMode: 'all',
  });

  // keep local projectId in sync if parent prop changes via URL
  useEffect(() => {
    setCurrentProjectId(projectId);
  }, [projectId]);

  // 🧭 TAB VALIDATION MAP — moved programIds into the new `projectForm` tab
  const tabToFields: Record<string, (keyof ProjectFormValues)[]> = {
    basic: ['name', 'description', 'startDate', 'endDate', 'totalBudget', 'currency'],
    projectForm: ['programIds'], // NEW TAB
    objectives: ['objectives'],
    indicators: ['indicators'],
    funding: ['funding'],
    team: ['team'],
    areas: [],
    preview: [],
  } as const;

  // Insert `projectForm` after `basic`
  const orderedTabs = ['basic', 'projectForm', 'objectives', 'indicators', 'funding', 'team', 'areas', 'preview'] as const;

  const getNextTab = (tab: string) => {
    const idx = orderedTabs.indexOf(tab as any);
    return idx >= 0 && idx < orderedTabs.length - 1 ? (orderedTabs[idx + 1] as string) : 'preview';
  };

  // 🔁 Programs fetch for the selector tab
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setIsLoadingPrograms(true);
        // Adjust this endpoint if yours is different:
        const res = await fetch('/api/programs');
        if (!res.ok) throw new Error('Failed to load programs');
        const data: ProgramLite[] = await res.json();
        setProgramsList(data || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load programs list');
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  const filteredPrograms = useMemo(() => {
    const q = programsSearch.trim().toLowerCase();
    if (!q) return programsList;
    return programsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.theme ?? '').toLowerCase().includes(q) ||
        (p.sector ?? '').toLowerCase().includes(q)
    );
  }, [programsList, programsSearch]);

  const createOrUpdateProject = async (): Promise<string | undefined> => {
    const values = form.getValues();
    try {
      setIsSubmitting(true);
      const { objectives: _omitObjectives, indicators: _omitIndicators, ...rest } = values as any;

      // Ensure `programIds` is included in payload
      const payload = {
        ...rest,
        status: values.status || 'DRAFT',
        programIds: values.programIds ?? [],
      } as any;

      if (!currentProjectId) {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Create project error:', response.status, errorData);
          throw new Error(`Failed to create project: ${response.status}`);
        }

        const data = await response.json();
        setCurrentProjectId(data.id);
        onSuccess(data.id);
        toast.success('Project created');
        return data.id as string;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${currentProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // includes programIds
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Update project error:', response.status, errorData);
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const data = await response.json();
      toast.success('Project saved');
      return data.id as string;
    } catch (error) {
      console.error('Error in createOrUpdateProject:', error);
      toast.error((error as Error).message || 'Failed to save project');
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (_values: ProjectFormValues) => {
    await createOrUpdateProject();
  };

  const saveAsDraft = async () => {
    try {
      setIsDraftSaving(true);
      const values = form.getValues();
      values.status = 'DRAFT';
      const id = await createOrUpdateProject();
      if (id) toast.success('Project saved as draft');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleTabChange = (value: string) => {
    const currentFields = tabToFields[activeTab] || [];
    form.trigger(currentFields as any).then((valid) => {
      if (!valid) {
        toast.error('Please fix validation errors before switching tabs');
        return;
      }
      setActiveTab(value);
      createOrUpdateProject().catch((err) => {
        console.error('Error saving project:', err);
      });
    });
  };

  const handleNextClick = async () => {
    const fields = tabToFields[activeTab] || [];
    const ok = await form.trigger(fields as any, { shouldFocus: true });
    if (!ok) {
      toast.error('Please fix validation errors before proceeding');
      return;
    }

    const next = getNextTab(activeTab);
    setActiveTab(next);

    createOrUpdateProject().catch((err) => {
      console.error('Error saving project:', err);
      toast.error('Failed to save progress');
    });

    const nextFields = tabToFields[next] || [];
    if (nextFields.length > 0) form.trigger(nextFields as any);
  };

  const isLastTab = activeTab === 'preview';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {isLoadingProject && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading project data...</span>
          </div>
        </div>
      )}

      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="w-full bg-muted/50 p-1">
                <TabsTrigger
                  value="basic"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Basic Details
                </TabsTrigger>

                {/* NEW TAB */}
                <TabsTrigger
                  value="projectForm"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Project Form
                </TabsTrigger>

                <TabsTrigger
                  value="objectives"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Objectives
                </TabsTrigger>
                <TabsTrigger
                  value="indicators"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Indicators
                </TabsTrigger>
                <TabsTrigger
                  value="funding"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Funding
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Team
                </TabsTrigger>
                <TabsTrigger
                  value="areas"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Areas
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm cursor-pointer"
                  disabled={isLoadingProject}
                >
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <BasicDetailsTab form={form} />
              </TabsContent>

              {/* NEW: Project Form tab with multi-select for Programs */}
              <TabsContent value="projectForm">
                <Card className="p-4 md:p-6 space-y-6">
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Choose Programs</h3>
                    <p className="text-sm text-muted-foreground">
                      Select one or more programs associated with this project.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search programs..."
                        value={programsSearch}
                        onChange={(e) => setProgramsSearch(e.target.value)}
                      />
                      {isLoadingPrograms && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <div className="max-h-64 overflow-auto border rounded-lg p-3 space-y-2">
                      {filteredPrograms.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No programs found.</p>
                      ) : (
                        filteredPrograms.map((p) => {
                          const selected = (form.watch('programIds') || []).includes(p.id);
                          return (
                            <label key={p.id} className="flex items-start gap-3 cursor-pointer">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const cur = new Set(form.getValues('programIds') || []);
                                  if (checked) cur.add(p.id);
                                  else cur.delete(p.id);
                                  form.setValue('programIds', Array.from(cur), {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {[p.theme, p.sector].filter(Boolean).join(' • ')}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <h3 className="text-md font-semibold">Review Selection</h3>
                    <div className="flex flex-wrap gap-2">
                      {(form.watch('programIds') || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No programs selected yet.</p>
                      ) : (
                        (form.watch('programIds') || []).map((id: string) => {
                          const prog = programsList.find((p) => p.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="px-2 py-1">
                              {prog?.name ?? id}
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                </Card>
              </TabsContent>

              <TabsContent value="objectives">
                <ProgramObjectivesTab form={form} projectId={currentProjectId} />
              </TabsContent>

              <TabsContent value="indicators">
                <IndicatorsTab form={form} projectId={currentProjectId} />
              </TabsContent>

              <TabsContent value="funding">
                <FundingTab form={form} />
              </TabsContent>

              <TabsContent value="team">
                <TeamTab form={form} />
              </TabsContent>

              <TabsContent value="areas">
                <InterventionAreasTab projectId={currentProjectId || ''} />
              </TabsContent>

              <TabsContent value="preview">
                <ProjectPreview form={form} />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={saveAsDraft}
                disabled={isSubmitting || isDraftSaving || isLoadingProject}
              >
                {isDraftSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              {isLastTab ? (
                <Button type="submit" disabled={isSubmitting || isDraftSaving || isLoadingProject}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isSubmitting || isDraftSaving || isLoadingProject}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Next
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="lg:col-span-1">
        <ProjectPreview form={form} />
      </div>
    </div>
  );
}
