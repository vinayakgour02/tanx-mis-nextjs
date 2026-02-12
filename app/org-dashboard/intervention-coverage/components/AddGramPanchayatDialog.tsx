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
  name: z.string().min(1, 'Gram Panchayat name is required'),
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

interface AddGramPanchayatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddGramPanchayatDialog({ open, onOpenChange, onSuccess }: AddGramPanchayatDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stateId: '',
      districtId: '',
      blockId: '',
      name: '',
    },
  });

  const watchedStateId = form.watch('stateId');
  const watchedDistrictId = form.watch('districtId');

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
      setBlocks([]);
    }
  }, [watchedStateId, selectedStateId, form]);

  useEffect(() => {
    if (watchedDistrictId && watchedDistrictId !== selectedDistrictId) {
      setSelectedDistrictId(watchedDistrictId);
      fetchBlocks(watchedDistrictId);
      // Reset block selection when district changes
      form.setValue('blockId', '');
    }
  }, [watchedDistrictId, selectedDistrictId, form]);

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

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/gramPanchayats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockId: values.blockId,
          name: values.name,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create gram panchayat';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast.success(`Gram Panchayat "${values.name}" added successfully`);
      form.reset();
      setSelectedStateId('');
      setSelectedDistrictId('');
      setDistricts([]);
      setBlocks([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating gram panchayat:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add gram panchayat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    form.reset();
    setSelectedStateId('');
    setSelectedDistrictId('');
    setDistricts([]);
    setBlocks([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Gram Panchayat</DialogTitle>
          <DialogDescription>
            Select a state, district, and block, then enter the gram panchayat name.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gram Panchayat Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter gram panchayat name" 
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
                Add Gram Panchayat
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}