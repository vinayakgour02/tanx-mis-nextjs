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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import districts data
import districtsData from '@/data/districts.json';

const formSchema = z.object({
  stateId: z.string().min(1, 'State is required'),
  name: z.string().min(1, 'District name is required'),
});

type FormData = z.infer<typeof formSchema>;

interface State {
  id: string;
  name: string;
}

interface AddDistrictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDistrictDialog({ open, onOpenChange, onSuccess }: AddDistrictDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stateId: '',
      name: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchStates();
    }
  }, [open]);

  useEffect(() => {
    if (selectedState) {
      // Find the state name from states array
      const state = states.find(s => s.id === selectedState);
      if (state) {
        // Get districts for this state from the districts.json
        const districts = districtsData.districts
          .filter(district => district.state === state.name)
          .map(district => district.district)
          .sort();
        setAvailableDistricts(districts);
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedState, states]);

  const fetchStates = async () => {
    try {
      const response = await fetch('/api/states');
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      toast.error('Failed to fetch states');
    }
  };

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/districts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stateId: values.stateId,
          name: values.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create district');
      }

      toast.success('District added successfully');
      form.reset();
      setSelectedState('');
      setAvailableDistricts([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating district:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add district');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    form.reset();
    setSelectedState('');
    setAvailableDistricts([]);
    onOpenChange(false);
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    form.setValue('stateId', stateId);
    form.setValue('name', ''); // Reset district selection
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add District</DialogTitle>
          <DialogDescription>
            First select a state, then select a district from the available options.
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
                    onValueChange={handleStateChange} 
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={isLoading || !selectedState || availableDistricts.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedState 
                            ? "Select a state first" 
                            : availableDistricts.length === 0 
                              ? "No districts available" 
                              : "Select a district"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
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
                Add District
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}