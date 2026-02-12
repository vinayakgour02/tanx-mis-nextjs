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

// Schema for project intervention form with hierarchical selections
const projectInterventionSchema = z.object({
  stateId: z.string().min(1, "State is required"),
  districtId: z.string().min(1, "District is required"),
  blockId: z.string().min(1, "Block is required"),
  gramPanchayatId: z.string().min(1, "Gram Panchayat is required"),
  villageId: z.string().min(1, "Village is required"),
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

type ProjectInterventionFormData = z.infer<typeof projectInterventionSchema>;

interface State {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface Block {
  id: string;
  name: string;
}

interface GramPanchayat {
  id: string;
  name: string;
}

interface Village {
  id: string;
  name: string;
}

interface MasterInterventionArea {
  id: string;
  state: string;
  district: string;
  type: string;
  project?: {
    name: string;
    code: string;
  };
}

interface ProjectInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  masterInterventionAreas: MasterInterventionArea[];
  onAreaAdded: () => void;
}

export function ProjectInterventionDialog({
  open,
  onOpenChange,
  projectId,
  masterInterventionAreas,
  onAreaAdded,
}: ProjectInterventionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Hierarchical data states
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gramPanchayats, setGramPanchayats] = useState<GramPanchayat[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGramPanchayats, setLoadingGramPanchayats] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  
  // Selected IDs for tracking
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedGramPanchayatId, setSelectedGramPanchayatId] = useState<string>('');

  const form = useForm<ProjectInterventionFormData>({
    resolver: zodResolver(projectInterventionSchema),
    mode: "onChange",
    defaultValues: {
      stateId: '',
      districtId: '',
      blockId: '',
      gramPanchayatId: '',
      villageId: '',
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

  // Watch form values for cascading updates
  const watchedStateId = form.watch('stateId');
  const watchedDistrictId = form.watch('districtId');
  const watchedBlockId = form.watch('blockId');
  const watchedGramPanchayatId = form.watch('gramPanchayatId');
  
  // Check if required fields are filled
  const [stateId, districtId, blockId, gramPanchayatId, villageId] = form.watch(['stateId', 'districtId', 'blockId', 'gramPanchayatId', 'villageId']);
  const isFormValid = stateId && districtId && blockId && gramPanchayatId && villageId;

  // Fetch states when dialog opens
  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  // Fetch districts when state changes
  useEffect(() => {
    if (watchedStateId && watchedStateId !== selectedStateId) {
      setSelectedStateId(watchedStateId);
      fetchDistricts(watchedStateId);
      // Reset dependent selections
      form.setValue('districtId', '');
      form.setValue('blockId', '');
      form.setValue('gramPanchayatId', '');
      form.setValue('villageId', '');
      setBlocks([]);
      setGramPanchayats([]);
      setVillages([]);
    }
  }, [watchedStateId, selectedStateId, form]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (watchedDistrictId && watchedDistrictId !== selectedDistrictId) {
      setSelectedDistrictId(watchedDistrictId);
      fetchBlocks(watchedDistrictId);
      // Reset dependent selections
      form.setValue('blockId', '');
      form.setValue('gramPanchayatId', '');
      form.setValue('villageId', '');
      setGramPanchayats([]);
      setVillages([]);
    }
  }, [watchedDistrictId, selectedDistrictId, form]);

  // Fetch gram panchayats when block changes
  useEffect(() => {
    if (watchedBlockId && watchedBlockId !== selectedBlockId) {
      setSelectedBlockId(watchedBlockId);
      fetchGramPanchayats(watchedBlockId);
      // Reset dependent selections
      form.setValue('gramPanchayatId', '');
      form.setValue('villageId', '');
      setVillages([]);
    }
  }, [watchedBlockId, selectedBlockId, form]);

  // Fetch villages when gram panchayat changes
  useEffect(() => {
    if (watchedGramPanchayatId && watchedGramPanchayatId !== selectedGramPanchayatId) {
      setSelectedGramPanchayatId(watchedGramPanchayatId);
      fetchVillages(watchedGramPanchayatId);
      // Reset village selection
      form.setValue('villageId', '');
    }
  }, [watchedGramPanchayatId, selectedGramPanchayatId, form]);

  // Fetch functions for hierarchical data
  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch('/api/states');
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      } else {
        throw new Error('Failed to fetch states');
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      toast.error('Failed to fetch states');
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data);
      } else {
        throw new Error('Failed to fetch districts');
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      toast.error('Failed to fetch districts');
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (districtId: string) => {
    setLoadingBlocks(true);
    try {
      const response = await fetch(`/api/blocks?districtId=${districtId}`);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      } else {
        throw new Error('Failed to fetch blocks');
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to fetch blocks');
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchGramPanchayats = async (blockId: string) => {
    setLoadingGramPanchayats(true);
    try {
      const response = await fetch(`/api/gramPanchayats?blockId=${blockId}`);
      if (response.ok) {
        const data = await response.json();
        setGramPanchayats(data);
      } else {
        throw new Error('Failed to fetch gram panchayats');
      }
    } catch (error) {
      console.error('Error fetching gram panchayats:', error);
      toast.error('Failed to fetch gram panchayats');
      setGramPanchayats([]);
    } finally {
      setLoadingGramPanchayats(false);
    }
  };

  const fetchVillages = async (gramPanchayatId: string) => {
    setLoadingVillages(true);
    try {
      const response = await fetch(`/api/villages?gramPanchayatId=${gramPanchayatId}`);
      if (response.ok) {
        const data = await response.json();
        setVillages(data);
      } else {
        throw new Error('Failed to fetch villages');
      }
    } catch (error) {
      console.error('Error fetching villages:', error);
      toast.error('Failed to fetch villages');
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  };

  async function onSubmit(values: ProjectInterventionFormData) {
    setIsLoading(true);
    try {
      const payload = {
        projectId,
        stateId: values.stateId,
        districtId: values.districtId,
        blockId: values.blockId,
        gramPanchayatId: values.gramPanchayatId,
        villageId: values.villageId,
        totalPopulation: values.totalPopulation ? parseInt(values.totalPopulation) : null,
        malePopulation: values.malePopulation ? parseInt(values.malePopulation) : null,
        femalePopulation: values.femalePopulation ? parseInt(values.femalePopulation) : null,
        scstPopulation: values.scstPopulation ? parseInt(values.scstPopulation) : null,
        households: values.households ? parseInt(values.households) : null,
        geographicalArea: values.geographicalArea ? parseFloat(values.geographicalArea) : null,
        latitude: values.latitude ? parseFloat(values.latitude) : null,
        longitude: values.longitude ? parseFloat(values.longitude) : null,
        censusCode: values.censusCode,
      };

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
      form.reset();
      resetSelections();
      onAreaAdded();
    } catch (error) {
      console.error("Failed to save intervention area:", error);
      toast.error("Failed to add intervention area");
    } finally {
      setIsLoading(false);
    }
  }

  const resetSelections = () => {
    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedBlockId('');
    setSelectedGramPanchayatId('');
    setStates([]);
    setDistricts([]);
    setBlocks([]);
    setGramPanchayats([]);
    setVillages([]);
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    form.reset();
    resetSelections();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Intervention Area</DialogTitle>
          <DialogDescription>
            Select a state and district from the available options, then fill in the detailed information for the intervention area.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              
              {/* State Selection */}
              <FormField
                control={form.control}
                name="stateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || loadingStates}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* District Selection */}
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || loadingDistricts || !selectedStateId || districts.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedStateId 
                              ? "Select a state first" 
                              : loadingDistricts 
                                ? "Loading districts..."
                                : districts.length === 0 
                                  ? "No districts available" 
                                  : "Select district"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Block Selection */}
              <FormField
                control={form.control}
                name="blockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Block</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || loadingBlocks || !selectedDistrictId || blocks.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedDistrictId 
                              ? "Select a district first" 
                              : loadingBlocks 
                                ? "Loading blocks..."
                                : blocks.length === 0 
                                  ? "No blocks available" 
                                  : "Select block"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {blocks.map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Gram Panchayat Selection */}
              <FormField
                control={form.control}
                name="gramPanchayatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gram Panchayat</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || loadingGramPanchayats || !selectedBlockId || gramPanchayats.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedBlockId 
                              ? "Select a block first" 
                              : loadingGramPanchayats 
                                ? "Loading gram panchayats..."
                                : gramPanchayats.length === 0 
                                  ? "No gram panchayats available" 
                                  : "Select gram panchayat"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gramPanchayats.map((gp) => (
                          <SelectItem key={gp.id} value={gp.id}>
                            {gp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Village Selection */}
              <FormField
                control={form.control}
                name="villageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Village</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading || loadingVillages || !selectedGramPanchayatId || villages.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedGramPanchayatId 
                              ? "Select a gram panchayat first" 
                              : loadingVillages 
                                ? "Loading villages..."
                                : villages.length === 0 
                                  ? "No villages available" 
                                  : "Select village"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {villages.map((village) => (
                          <SelectItem key={village.id} value={village.id}>
                            {village.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              
              {/* Latitude */}
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude (Optional)</FormLabel>
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
              
              {/* Longitude */}
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="Enter longitude"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Census Code */}
              <FormField
                control={form.control}
                name="censusCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Census Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter census code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Total Population */}
              <FormField
                control={form.control}
                name="totalPopulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Population (Optional)</FormLabel>
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
              
              {/* Male Population */}
              <FormField
                control={form.control}
                name="malePopulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Male Population (Optional)</FormLabel>
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
              
              {/* Female Population */}
              <FormField
                control={form.control}
                name="femalePopulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Female Population (Optional)</FormLabel>
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
              
              {/* SC/ST Population */}
              <FormField
                control={form.control}
                name="scstPopulation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SC/ST Population (Optional)</FormLabel>
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
              
              {/* Households */}
              <FormField
                control={form.control}
                name="households"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Households (Optional)</FormLabel>
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
              
              {/* Geographical Area */}
              <FormField
                control={form.control}
                name="geographicalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geographical Area (hectares) (Optional)</FormLabel>
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
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !isFormValid}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}