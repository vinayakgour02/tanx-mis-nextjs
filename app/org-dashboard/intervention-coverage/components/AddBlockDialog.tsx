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
  name: z.string().min(1, 'Block name is required'),
  areaType: z.enum(['URBAN', 'RURAL'], {
    errorMap: () => ({ message: 'Area type is required' }),
  }),
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

interface AddBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddBlockDialog({ open, onOpenChange, onSuccess }: AddBlockDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stateId: '',
      districtId: '',
      name: '',
      areaType: 'RURAL',
    },
  });

  const watchedStateId = form.watch('stateId');

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  useEffect(() => {
    if (watchedStateId && watchedStateId !== selectedStateId) {
      setSelectedStateId(watchedStateId);
      fetchDistricts(watchedStateId);
      // Reset district selection when state changes
      form.setValue('districtId', '');
    }
  }, [watchedStateId, selectedStateId, form]);

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

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          districtId: values.districtId,
          name: values.name,
          areaType: values.areaType,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create block';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast.success(`Block "${values.name}" (${values.areaType}) added successfully`);
      form.reset();
      setSelectedStateId('');
      setDistricts([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add block');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    form.reset();
    setSelectedStateId('');
    setDistricts([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>
            Select a state and district, then enter the block details.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter block name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area type" />
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
                Add Block
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}