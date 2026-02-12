'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  stateId: z.string().min(1, 'State is required'),
  districtId: z.string().min(1, 'District is required'),
  blockId: z.string().min(1, 'Block is required'),
  gramPanchayatId: z.string().min(1, 'Gram Panchayat is required'),
  name: z.string().min(1, 'Village name is required'),
});

type FormData = z.infer<typeof formSchema>;

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

interface AddVillageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddVillageDialog({ open, onOpenChange, onSuccess }: AddVillageDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gramPanchayats, setGramPanchayats] = useState<GramPanchayat[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGramPanchayats, setLoadingGramPanchayats] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stateId: '',
      districtId: '',
      blockId: '',
      gramPanchayatId: '',
      name: '',
    },
  });

  const watchedStateId = form.watch('stateId');
  const watchedDistrictId = form.watch('districtId');
  const watchedBlockId = form.watch('blockId');

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  useEffect(() => {
    if (watchedStateId && watchedStateId !== selectedStateId) {
      setSelectedStateId(watchedStateId);
      fetchDistricts(watchedStateId);
      // Reset dependent selections when state changes
      form.setValue('districtId', '');
      form.setValue('blockId', '');
      form.setValue('gramPanchayatId', '');
      setBlocks([]);
      setGramPanchayats([]);
    }
  }, [watchedStateId, selectedStateId, form]);

  useEffect(() => {
    if (watchedDistrictId && watchedDistrictId !== selectedDistrictId) {
      setSelectedDistrictId(watchedDistrictId);
      fetchBlocks(watchedDistrictId);
      // Reset dependent selections when district changes
      form.setValue('blockId', '');
      form.setValue('gramPanchayatId', '');
      setGramPanchayats([]);
    }
  }, [watchedDistrictId, selectedDistrictId, form]);

  useEffect(() => {
    if (watchedBlockId && watchedBlockId !== selectedBlockId) {
      setSelectedBlockId(watchedBlockId);
      fetchGramPanchayats(watchedBlockId);
      // Reset gram panchayat selection when block changes
      form.setValue('gramPanchayatId', '');
    }
  }, [watchedBlockId, selectedBlockId, form]);

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

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/villages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gramPanchayatId: values.gramPanchayatId,
          name: values.name,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create village';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast.success(`Village "${values.name}" added successfully`);
      form.reset();
      setSelectedStateId('');
      setSelectedDistrictId('');
      setSelectedBlockId('');
      setDistricts([]);
      setBlocks([]);
      setGramPanchayats([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating village:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add village');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    form.reset();
    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedBlockId('');
    setDistricts([]);
    setBlocks([]);
    setGramPanchayats([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Village</DialogTitle>
          <DialogDescription>
            Select a state, district, block, and gram panchayat, then enter the village name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectValue placeholder={loadingStates ? "Loading states..." : "Select a state"} />
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
                                : "Select a district"
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
                                : "Select a block"
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
                                : "Select a gram panchayat"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gramPanchayats.map((gramPanchayat) => (
                        <SelectItem key={gramPanchayat.id} value={gramPanchayat.id}>
                          {gramPanchayat.name}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Village Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter village name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Village
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}