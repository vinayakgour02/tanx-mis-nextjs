"use client";

import React, { useState } from "react";
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
import { toast } from "sonner";
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
  linkToProgramIndicator: z.boolean().optional(),
  parentIndicatorId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditIndicatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (indicator: any) => void;
  indicator: any;
  projectId?: string; // Add projectId for API calls
  programIds?: string[]; // New prop to pass program IDs from project
}

export function EditIndicatorDialog({
  open,
  onOpenChange,
  onSuccess,
  indicator,
  projectId,
  programIds,
}: EditIndicatorDialogProps) {
  const [loading, setLoading] = useState(false);

  // Fetch program indicators when link option is enabled
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
    enabled: open && programIds && programIds.length > 0,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: indicator?.name || "",
      type: indicator?.type || "OUTPUT",
      definition: indicator?.definition || "",
      rationale: indicator?.rationale || "",
      dataSource: indicator?.dataSource || "",
      frequency: indicator?.frequency || "QUARTERLY",
      unitOfMeasure: indicator?.unitOfMeasure || "COUNT",
      disaggregateBy: indicator?.disaggregateBy || "",
      baselineValue: indicator?.baselineValue || "",
      target: indicator?.target || "",
      linkToProgramIndicator: !!indicator?.orgIndicatorId,
      parentIndicatorId: indicator?.orgIndicatorId || "",
    },
  });

  const linkToProgramIndicator = form.watch("linkToProgramIndicator");

  // Reset form when indicator changes
  React.useEffect(() => {
    if (indicator && open) {
      form.reset({
        name: indicator.name || "",
        type: indicator.type || "OUTPUT",
        definition: indicator.definition || "",
        rationale: indicator.rationale || "",
        dataSource: indicator.dataSource || "",
        frequency: indicator.frequency || "QUARTERLY",
        unitOfMeasure: indicator.unitOfMeasure || "COUNT",
        disaggregateBy: indicator.disaggregateBy || "",
        baselineValue: indicator.baselineValue || "",
        target: indicator.target || "",
        linkToProgramIndicator: !!indicator.orgIndicatorId,
        parentIndicatorId: indicator.orgIndicatorId || "",
      });
    }
  }, [indicator, open, form]);

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);
      
      // If indicator has an ID, make API call to update it
      if (indicator?.id && projectId) {
        const payload = {
          ...values,
          projectId,
          level: 'PROJECT',
          objectiveId: indicator.objectiveId, // Include the original objectiveId
          // For project indicators linking to program indicators, use orgIndicatorId field
          orgIndicatorId: values.linkToProgramIndicator && values.parentIndicatorId ? values.parentIndicatorId : undefined,
        };

        const response = await fetch(`/api/indicators/${indicator.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to update indicator');
        }

        const updatedIndicator = await response.json();
        onSuccess(updatedIndicator);
        toast.success('Indicator updated successfully!');
      } else {
        // For form-only indicators (not yet saved), just update locally
        const updatedIndicator = {
          ...indicator,
          ...values,
          objectiveId: indicator.objectiveId, // Preserve the original objectiveId
          orgIndicatorId: values.linkToProgramIndicator && values.parentIndicatorId ? values.parentIndicatorId : undefined,
        };
        onSuccess(updatedIndicator);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating indicator:", error);
      toast.error('Failed to update indicator. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Edit Indicator</DialogTitle>
          <DialogDescription>
            Update the indicator details and save changes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Program Indicator Linking - Only for Project scope */}
            {programIds && programIds.length > 0 && (
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

            <FormItem>
              <FormLabel>Objective</FormLabel>
              <FormControl>
                <ObjectiveDisplay objectiveId={indicator?.objectiveId || ""} />
              </FormControl>
            </FormItem>

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

              <FormField
                control={form.control}
                name="disaggregateBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disaggregate By (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gender, Age Group" {...field} />
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ObjectiveDisplay({ objectiveId }: { objectiveId: string }) {
  const { data: objective, isLoading, error } = useQuery({
    queryKey: ["objective", objectiveId],
    queryFn: async () => {
      if (!objectiveId) return null;
      const res = await fetch(`/api/objectives/${objectiveId}`);
      if (!res.ok) throw new Error("Failed to fetch objective");
      return res.json();
    },
    enabled: !!objectiveId,
  });

  if (isLoading) return <Input placeholder="Loading objective..." readOnly />;
  if (error || !objective) return <Input placeholder="Objective not found" readOnly />;
  
  return (
    <Input 
      value={objective.description || objective.name || ""}
      readOnly
    />
  );
}