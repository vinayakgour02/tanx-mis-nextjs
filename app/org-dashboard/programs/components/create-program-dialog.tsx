"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachYearOfInterval, startOfYear, endOfYear } from "date-fns";
import { createProgram, updateProgram } from "../actions";
import { Calendar } from "@/components/ui/calendar";

// ---------------- Schema ----------------
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  budget: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "ACTIVE",
    "CLOSED",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  sector: z.string().optional(),
  theme: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ProgramFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    budget?: string | null;
    status: string;
    priority: string;
    sector?: string | null;
    theme?: string | null;
  };
};

export function ProgramFormDialog({
  open,
  onOpenChange,
  initialData,
}: ProgramFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      budget: "",
      status: "DRAFT",
      priority: "MEDIUM",
      sector: "",
      theme: "",
    },
  });

  const [dropdown, setDropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>(
      "dropdown"
    )

  // Pre-fill form when editing
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
        budget: initialData.budget || "",
        status: (initialData.status as FormValues["status"]) || "DRAFT",
        priority: (initialData.priority as FormValues["priority"]) || "MEDIUM",
        sector: initialData.sector || "",
        theme: initialData.theme || "",
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);

      if (initialData) {
        await updateProgram(initialData.id, values);
        toast.success("Program updated successfully");
      } else {
        await createProgram(values);
        toast.success("Program created successfully");
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to save program");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[30rem] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Program" : "Create New Program"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the program details below."
              : "Create a new program by filling out the form below."}
          </DialogDescription>
        </DialogHeader>
        <Form<FormValues> {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Program name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Program description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Dates */}
         <div className="grid grid-cols-2 gap-4">
  {/* Start Date */}
  <FormField
    control={form.control}
    name="startDate"
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel>Start Date</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="min-w-[300px] p-2" align="start">
            <Calendar
              mode="single"
              selected={field.value as Date}
              onSelect={field.onChange}
              defaultMonth={field.value ?? new Date()}
              captionLayout="dropdown"
              disabled={(date) => date < new Date("1900-01-01")}
              className="rounded-md border shadow-sm"
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* End Date */}
  <FormField
    control={form.control}
    name="endDate"
    render={({ field }) => (
      <FormItem className="flex flex-col">
        <FormLabel>End Date</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="min-w-[300px] p-2" align="start">
            <Calendar
              mode="single"
              selected={field.value as Date}
              onSelect={field.onChange}
              defaultMonth={field.value ?? new Date()}
              captionLayout="dropdown"
              disabled={(date) => date < new Date("1900-01-01")}
              className="rounded-md border shadow-sm"
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

            {/* Budget + Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="Budget" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Priority + Sector */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sector" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Theme */}
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SDG Theme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SDG Theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SDG 1 - No Poverty">SDG 1 - No Poverty</SelectItem>
                      <SelectItem value="SDG 2 - Zero Hunger">SDG 2 - Zero Hunger</SelectItem>
                      <SelectItem value="SDG 3 - Good Health and Well-being">SDG 3 - Good Health and Well-being</SelectItem>
                      <SelectItem value="SDG 4 - Quality Education">SDG 4 - Quality Education</SelectItem>
                      <SelectItem value="SDG 5 - Gender Equality">SDG 5 - Gender Equality</SelectItem>
                      <SelectItem value="SDG 6 - Clean Water and Sanitation">SDG 6 - Clean Water and Sanitation</SelectItem>
                      <SelectItem value="SDG 7 - Affordable and Clean Energy">SDG 7 - Affordable and Clean Energy</SelectItem>
                      <SelectItem value="SDG 8 - Decent Work and Economic Growth">SDG 8 - Decent Work and Economic Growth</SelectItem>
                      <SelectItem value="SDG 9 - Industry, Innovation, and Infrastructure">SDG 9 - Industry, Innovation, and Infrastructure</SelectItem>
                      <SelectItem value="SDG 10 - Reduced Inequalities">SDG 10 - Reduced Inequalities</SelectItem>
                      <SelectItem value="SDG 11 - Sustainable Cities and Communities">SDG 11 - Sustainable Cities and Communities</SelectItem>
                      <SelectItem value="SDG 12 - Responsible Consumption and Production">SDG 12 - Responsible Consumption and Production</SelectItem>
                      <SelectItem value="SDG 13 - Climate Action">SDG 13 - Climate Action</SelectItem>
                      <SelectItem value="SDG 14 - Life Below Water">SDG 14 - Life Below Water</SelectItem>
                      <SelectItem value="SDG 15 - Life on Land">SDG 15 - Life on Land</SelectItem>
                      <SelectItem value="SDG 16 - Peace, Justice and Strong Institutions">SDG 16 - Peace, Justice and Strong Institutions</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit */}
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Program" : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
