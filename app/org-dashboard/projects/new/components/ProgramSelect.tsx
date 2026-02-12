'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { ProjectFormValues } from '../lib/schema';
import { Loader2 } from 'lucide-react';

interface Program {
  id: string;
  name: string;
}

interface ProgramSelectProps {
  form: UseFormReturn<ProjectFormValues>;
}

export function ProgramSelect({ form }: ProgramSelectProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs');
        if (!response.ok) throw new Error('Failed to fetch programs');
        const data = await response.json();
        setPrograms(data);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading programs...
      </div>
    );
  }

  return (
    <FormField
      control={form.control}
      name="programId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Program *</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(value)} 
            value={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 