"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Constants for form options
const frequencies = ["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"] as const;
const indicatorTypes = ["OUTPUT", "OUTCOME", "IMPACT"] as const;
const unitOfMeasures = [
  "PERCENTAGE",
  "COUNT",
  "RATIO",
  "CURRENCY",
  "SCORE",
  "HOURS",
  "DAYS",
  "KILOMETERS",
  "KILOGRAMS",
  "UNITS",
  "OTHER",
] as const;

// Display mappings for enum values
const displayMappings = {
  // Indicator Types
  OUTPUT: "Output",
  OUTCOME: "Outcome",
  IMPACT: "Impact",

  // Frequencies
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
  ONE_TIME: "One Time",

  // Unit of Measures
  PERCENTAGE: "Percentage",
  COUNT: "Count",
  RATIO: "Ratio",
  CURRENCY: "Currency",
  SCORE: "Score",
  HOURS: "Hours",
  DAYS: "Days",
  KILOMETERS: "Kilometers",
  KILOGRAMS: "Kilograms",
  UNITS: "Units",
  OTHER: "Other",
} as const;

const formSchema = z.object({
  level: z.enum(["ORGANIZATION", "PROJECT", "PROGRAM"]),
  projectOrProgramId: z.string().optional(),
  objectiveId: z.string().min(1, "Please select an objective"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(indicatorTypes),
  definition: z.string().min(1, "Definition is required"),
  rationale: z.string().optional(),
  dataSource: z.string().min(1, "Data source is required"),
  frequency: z.enum(frequencies),
  unitOfMeasure: z.enum(unitOfMeasures),
  disaggregateBy: z.string().optional(),
  baselineValue: z.string().optional(),
  target: z.string().optional(),
  linkToOrgIndicator: z.boolean().optional(),
  orgIndicatorId: z.string().optional(),
  linkToProgramIndicator: z.boolean().optional(),
  parentIndicatorId: z.string().optional(), // Using existing orgIndicatorId field for program linking
});

type FormValues = z.infer<typeof formSchema>;

interface NewIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (indicator: any) => void;
  projectId?: string;
  indicator?: any; // when provided, dialog behaves in edit mode
  scope: string | undefined;
  programIds?: string[]; // New prop to pass program IDs from project
}

export function NewIndicatorDialog({ open, onOpenChange, onSuccess, projectId, indicator, scope, programIds }: NewIndicatorDialogProps) {
  const [loading, setLoading] = useState(false);

  const isEditMode = !!indicator;

  const initialDefaults = useMemo<DefaultValues<FormValues>>(() => {
    let defaultLevel: FormValues["level"] = "ORGANIZATION";

    if (scope === 'project') {
      defaultLevel = "PROJECT";
    } else if (scope === 'program') {
      defaultLevel = "PROGRAM";
    } else if (scope === 'organization') {
      defaultLevel = "ORGANIZATION";
    }

    return {
      level: defaultLevel,
      frequency: "QUARTERLY" as FormValues["frequency"],
      type: "OUTPUT" as FormValues["type"],
      unitOfMeasure: "COUNT" as FormValues["unitOfMeasure"],
      linkToOrgIndicator: false,
      linkToProgramIndicator: false,
      ...(projectId && { projectOrProgramId: projectId }),
    };
  }, [projectId, scope]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialDefaults,
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && indicator) {
        form.reset({
          level: indicator.level,
          projectOrProgramId: indicator.projectId ?? indicator.programId ?? "",
          objectiveId: indicator.objectiveId ?? "",
          name: indicator.name ?? "",
          type: indicator.type,
          definition: indicator.definition ?? "",
          rationale: indicator.rationale ?? "",
          dataSource: indicator.dataSource ?? "",
          frequency: indicator.frequency,
          unitOfMeasure: indicator.unitOfMeasure,
          disaggregateBy: indicator.disaggregateBy ?? "",
          baselineValue: indicator.baselineValue ?? "",
          target: indicator.target ?? "",
          linkToOrgIndicator: !!indicator.orgIndicatorId,
          orgIndicatorId: indicator.orgIndicatorId ?? "",
          linkToProgramIndicator: !!indicator.orgIndicatorId, // Reusing orgIndicatorId for program linking
          parentIndicatorId: indicator.orgIndicatorId ?? "",
        });
      } else {
        form.reset(initialDefaults);
      }
    }
  }, [open, isEditMode, indicator, form, initialDefaults]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/indicators/options?type=projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: open && !projectId,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const res = await fetch("/api/indicators/options?type=programs");
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
    enabled: open,
  });

  const selectedLevel = form.watch("level");
  const selectedProjectOrProgramId = form.watch("projectOrProgramId");
  const linkToOrgIndicator = form.watch("linkToOrgIndicator");
  const linkToProgramIndicator = form.watch("linkToProgramIndicator");

  const { data: objectives = [] } = useQuery({
    queryKey: ["objectives", selectedLevel, selectedProjectOrProgramId],
    queryFn: async () => {
      let queryParam = "";
      if (selectedLevel === "PROJECT") queryParam = `projectId=${selectedProjectOrProgramId}`;
      else if (selectedLevel === "PROGRAM") queryParam = `programId=${selectedProjectOrProgramId}`;
      else if (selectedLevel === "ORGANIZATION") queryParam = `organizationId=organization`;

      const res = await fetch(`/api/indicators/options?type=objectives&${queryParam}`);
      if (!res.ok) throw new Error("Failed to fetch objectives");
      const data = await res.json();
      return data;
    },
    enabled: open && (selectedLevel === "ORGANIZATION" || !!selectedProjectOrProgramId),
  });

  // Fetch organization indicators when scope is program and link option is enabled
  const { data: organizationIndicators = [] } = useQuery({
    queryKey: ["organizationIndicators"],
    queryFn: async () => {
      const res = await fetch("/api/org-dashboard/indicator");
      if (!res.ok) throw new Error("Failed to fetch organization indicators");
      return res.json();
    },
    enabled: open && scope === "program" && linkToOrgIndicator,
  });

  // Fetch program indicators when scope is project and link option is enabled
  const { data: programIndicators = [] } = useQuery({
    queryKey: ["programIndicators", programIds],
    queryFn: async () => {
      if (!programIds || programIds.length === 0) {
        return [];
      }
      
      const programIndicatorsPromises = programIds.map(async (programId) => {
        const res = await fetch(`/api/indicators/programs?programId=${programId}`);
        if (!res.ok) throw new Error(`Failed to fetch indicators for program ${programId}`);
        return res.json();
      });
      
      const results = await Promise.all(programIndicatorsPromises);
      return results.flat(); // Flatten array of arrays
    },
    enabled: open && scope === "project" && linkToProgramIndicator && programIds && programIds.length > 0,
  });

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      const payload = {
        ...values,
        projectId: values.level === "PROJECT" ? values.projectOrProgramId : undefined,
        programId: values.level === "PROGRAM" ? values.projectOrProgramId : undefined,
        organizationId: values.level === "ORGANIZATION" ? 'organization' : undefined,
        // For project indicators linking to program indicators, use orgIndicatorId field
        orgIndicatorId: values.linkToOrgIndicator && values.orgIndicatorId ? values.orgIndicatorId 
                      : values.linkToProgramIndicator && values.parentIndicatorId ? values.parentIndicatorId 
                      : undefined,
      };

      let url: string
      let method: "POST" | "PATCH"

      if (scope === "organization") {
        url = isEditMode
          ? `/api/org-dashboard/indicator/${indicator.id}`
          : "/api/org-dashboard/indicator"
      } else {
        url = isEditMode
          ? `/api/indicators/${indicator.id}`
          : "/api/indicators"
      }

      method = isEditMode ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(isEditMode ? "Failed to update indicator" : "Failed to create indicator");
      }

      const saved = await response.json();
      onSuccess(saved);
      form.reset(initialDefaults);
    } catch (error) {
      console.error(isEditMode ? "Error updating indicator:" : "Error creating indicator:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Indicator" : "Create New Indicator"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details and save changes." : "Fill in the details below to create a new indicator."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Indicator Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={!!projectId || isEditMode}
                    >
                      {(!scope || scope === 'organization') && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="ORGANIZATION" />
                          </FormControl>
                          <FormLabel className="font-normal">Organization</FormLabel>
                        </FormItem>
                      )}

                      {(!scope || scope === 'project') && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="PROJECT" />
                          </FormControl>
                          <FormLabel className="font-normal">Project</FormLabel>
                        </FormItem>
                      )}

                      {(!scope || scope === 'program') && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="PROGRAM" />
                          </FormControl>
                          <FormLabel className="font-normal">Program</FormLabel>
                        </FormItem>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={form.control}
              name="projectOrProgramId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Select {selectedLevel === "PROJECT" ? "Project" : selectedLevel === "PROGRAM" ? "Program" : "N/A"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    disabled={!!projectId || isEditMode || selectedLevel === "ORGANIZATION"}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${selectedLevel === "PROJECT" ? "project" : "program"}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedLevel === "PROJECT" && projects.length
                        ? projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                        : selectedLevel === "PROGRAM" && programs.length
                          ? programs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                          : selectedLevel === "ORGANIZATION"
                            ? <SelectItem value="__org__" disabled>Organization-level</SelectItem>
                            : <SelectItem value="__none__" disabled>No options</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
  control={form.control}
  name="objectiveId"
  render={({ field }) => (
    <FormItem className="w-[45rem]"> {/* control width here */}
      <FormLabel>Select Objective</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger className="w-[45rem]"> {/* width applied here */}
            <SelectValue placeholder="Select an objective" />
          </SelectTrigger>
        </FormControl>
        <SelectContent className="w-[45rem]"> {/* dropdown width matches */}
          {objectives.length > 0 ? (
            objectives.map((objective: any) => (
              <SelectItem key={objective.id} value={objective.id}>
                {objective.description}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__none__" disabled>
              No objectives available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>


            {/* Organization Indicator Linking - Only for Program scope */}
            {scope === "program" && selectedLevel === "PROGRAM" && (
              <>
                <FormField
                  control={form.control}
                  name="linkToOrgIndicator"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Link to Organization Indicator</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value === "yes");
                            if (value === "no") {
                              form.setValue("orgIndicatorId", "");
                            }
                          }}
                          value={field.value ? "yes" : "no"}
                          className="flex flex-row space-x-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {linkToOrgIndicator && (
                  <FormField
                    control={form.control}
                    name="orgIndicatorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Organization Indicator</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an organization indicator" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizationIndicators.length > 0 ? (
                              organizationIndicators.map((orgIndicator: any) => (
                                <SelectItem key={orgIndicator.id} value={orgIndicator.id}>
                                  {orgIndicator.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__none__" disabled>
                                No organization indicators available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Program Indicator Linking - Only for Project scope */}
            {scope === "project" && selectedLevel === "PROJECT" && programIds && programIds.length > 0 && (
              <>
                <FormField
                  control={form.control}
                  name="linkToProgramIndicator"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Link to Program Indicator</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value === "yes");
                            if (value === "no") {
                              form.setValue("parentIndicatorId", "");
                            }
                          }}
                          value={field.value ? "yes" : "no"}
                          className="flex flex-row space-x-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {linkToProgramIndicator && (
                  <FormField
                    control={form.control}
                    name="parentIndicatorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Program Indicator</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a program indicator" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programIndicators.length > 0 ? (
                              programIndicators.map((progIndicator: any) => (
                                <SelectItem key={progIndicator.id} value={progIndicator.id}>
                                  {progIndicator.name} ({progIndicator.program?.name})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__none__" disabled>
                                No program indicators available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indicator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter indicator name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {indicatorTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {displayMappings[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="definition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Definition</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define how this indicator is measured..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rationale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rationale (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter rationale"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter data source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {displayMappings[freq]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit of measure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unitOfMeasures.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {displayMappings[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baselineValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baseline Value (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter baseline value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter target value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Indicator")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 