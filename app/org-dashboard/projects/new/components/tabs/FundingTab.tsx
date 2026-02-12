'use client';

import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type ProjectFormValues } from '../../lib/schema';
import { NewDonorDialog } from '../dialogs/NewDonorDialog';

interface Donor {
  id: string;
  name: string;
  type: string;
  code?: string;
}

interface FundingTabProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function FundingTab({ form }: FundingTabProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/donors');
      if (!response.ok) throw new Error('Failed to fetch donors');
      const data = await response.json();
      setDonors(data);
    } catch (error) {
      toast.error('Failed to load donors');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeFunding = () => {
    if (!form.getValues('funding') || form.getValues('funding')?.length === 0) {
      form.setValue('funding', [
        {
          donorId: '',
          amount: 0,
          year: new Date().getFullYear(),
          currency: 'INR',
        },
      ]);
    }
  };

  const clearFunding = () => {
    form.setValue('funding', [
      {
        donorId: '',
        amount: 0,
        year: new Date().getFullYear(),
        currency: 'INR',
      },
    ]);
  };

  const handleDonorCreated = (donor: Donor) => {
    setDonors([...donors, donor]);
    // Initialize funding if not already present
    initializeFunding();
    // Set the new donor as the selected donor
    form.setValue('funding.0.donorId', donor.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Project Funding</h3>
        <p className="text-sm text-muted-foreground">
          Add funding sources and amounts for the project
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Funding Source</h4>
          <div className="flex items-center gap-2">
            {/* <NewDonorDialog onDonorCreated={handleDonorCreated} /> */}
            {(!form.watch('funding') || form.watch('funding')?.length === 0) && (
              <Button type="button" variant="outline" size="sm" onClick={initializeFunding}>
                <Plus className="h-4 w-4 mr-2" />
                Add Funding
              </Button>
            )}
          </div>
        </div>

        {form.watch('funding') && form.watch('funding')?.length > 0 && (
          <div className="grid gap-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name="funding.0.donorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donor*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a donor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {donors.map((donor) => (
                        <SelectItem key={donor.id} value={donor.id}>
                          {donor.name} {donor.code ? `(${donor.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="funding.0.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="funding.0.year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Enter year"
                        min={2000}
                        max={2100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={clearFunding}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Funding
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 