"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Project } from "@prisma/client";

// Admin form schema - only state, district, and type
const adminFormSchema = z.object({
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  type: z.string().min(1, "Type is required"),
});

// Regular user form schema - all fields with conditional validation
const userFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  type: z.string().min(1, "Type is required"),
  blockName: z.string().min(1, "Block name is required"),
  gramPanchayat: z.string().min(1, "Gram Panchayat is required"),
  villageName: z.string().min(1, "Village name is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  censusCode: z.string().optional(),
  totalPopulation: z.string().optional(),
  malePopulation: z.string().optional(),
  femalePopulation: z.string().optional(),
  scstPopulation: z.string().optional(),
  households: z.string().optional(),
  geographicalArea: z.string().optional(),
});

type AdminFormData = z.infer<typeof adminFormSchema>;
type UserFormData = z.infer<typeof userFormSchema>;

interface AddInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  admin?: boolean
}

export function AddInterventionDialog({
  open,
  onOpenChange,
  projectId,
  admin
}: AddInterventionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [states] = useState<string[]>([
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal"
  ]);


  // Create forms based on admin status
  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      state: '',
      district: '',
      type: '',
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      projectId: '',
      state: '',
      district: '',
      type: '',
      blockName: '',
      gramPanchayat: '',
      villageName: '',
      latitude: '',
      longitude: '',
      censusCode: '',
      totalPopulation: '',
      malePopulation: '',
      femalePopulation: '',
      scstPopulation: '',
      households: '',
      geographicalArea: '',
    },
  });

  // Use the appropriate form based on admin status
  const form = admin ? adminForm : userForm;



  useEffect(() => {
    if (projectId && !admin) {
      userForm.setValue('projectId', projectId);
    }
  }, [projectId, userForm, admin]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      }
    }

    if (open && !projectId && !admin) {
      fetchProjects();
    }
  }, [open, projectId, admin]);



  async function onSubmit(values: AdminFormData | UserFormData) {
    setIsLoading(true);
    try {
      // Create payload with base values
      const payload: any = {
        state: values.state,
        district: values.district,
        type: values.type,
      };

      // Add additional fields for non-admin users
      if (!admin) {
        const userValues = values as UserFormData;
        payload.projectId = userValues.projectId;
        payload.blockName = userValues.blockName;
        payload.gramPanchayat = userValues.gramPanchayat;
        payload.villageName = userValues.villageName;
        payload.totalPopulation = userValues.totalPopulation ? parseInt(userValues.totalPopulation) : null;
        payload.malePopulation = userValues.malePopulation ? parseInt(userValues.malePopulation) : null;
        payload.femalePopulation = userValues.femalePopulation ? parseInt(userValues.femalePopulation) : null;
        payload.scstPopulation = userValues.scstPopulation ? parseInt(userValues.scstPopulation) : null;
        payload.households = userValues.households ? parseInt(userValues.households) : null;
        payload.geographicalArea = userValues.geographicalArea ? parseFloat(userValues.geographicalArea) : null;
        payload.latitude = userValues.latitude ? parseFloat(userValues.latitude) : null;
        payload.longitude = userValues.longitude ? parseFloat(userValues.longitude) : null;
        payload.censusCode = userValues.censusCode;
      }

      const response = await fetch("/api/intervention-areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create intervention area");
      }

      toast.success("Intervention area added successfully");
      onOpenChange(false);
      if (admin) {
        adminForm.reset();
      } else {
        userForm.reset();
      }
    } catch (error) {
      console.error("Failed to save intervention area:", error);
      toast.error("Failed to add intervention area");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Intervention Area</DialogTitle>
          <DialogDescription>
            {admin 
              ? "Fill in the basic details for the intervention area."
              : "Fill in the detailed information for the new intervention area."
            }
          </DialogDescription>
        </DialogHeader>
        {admin ? (
          <Form {...adminForm}>
            <form onSubmit={adminForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!projectId && !admin && (
                <FormField
                  control={userForm.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* State Field */}
              <FormField
                control={adminForm.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* District Field */}
              <FormField
                control={adminForm.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter district name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Type Field */}
              <FormField
                control={adminForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="RURAL">Rural</SelectItem>
                        <SelectItem value="URBAN">Urban</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
            </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {!projectId && (
                  <FormField
                    control={userForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Project</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* State Field */}
                <FormField
                  control={userForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* District Field */}
                <FormField
                  control={userForm.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter district name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Type Field */}
                <FormField
                  control={userForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RURAL">Rural</SelectItem>
                          <SelectItem value="URBAN">Urban</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Additional fields for non-admin users */}
                <FormField
                  control={userForm.control}
                  name="blockName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter block name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="gramPanchayat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gram Panchayat</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter gram panchayat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="villageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter village name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.000001"
                          placeholder="Enter latitude"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0000t01"
                          placeholder="Enter longitude"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="censusCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Census Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter census code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="totalPopulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter total population"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="malePopulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Male Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter male population"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="femalePopulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Female Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter female population"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="scstPopulation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SC/ST Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter SC/ST population"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="households"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Households</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter number of households"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="geographicalArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geographical Area (hectares)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter geographical area"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 