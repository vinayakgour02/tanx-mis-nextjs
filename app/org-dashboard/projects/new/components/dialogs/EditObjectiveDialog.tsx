'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const objectiveLevels = ['GOAL', 'OUTCOME', 'OUTPUT', 'ACTIVITY'] as const;

const formSchema = z.object({
  code: z.string().optional(),
  level: z.enum(objectiveLevels),
  description: z.string().min(1, 'Description is required'),
  orderIndex: z.number().optional().default(0),
});

interface Objective {
  id: string;
  code: string;
  level: string;
  description: string;
  orderIndex: number;
}

interface EditObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (objective: Objective) => void;
  objective: Objective | null;
}

export function EditObjectiveDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  objective 
}: EditObjectiveDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: 'OUTCOME' as const,
      orderIndex: 0,
    },
  });

  // Update form when objective changes
  useEffect(() => {
    if (objective) {
      form.reset({
        code: objective.code || '',
        level: objective.level as any,
        description: objective.description,
        orderIndex: objective.orderIndex,
      });
    }
  }, [objective, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!objective) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/objectives/${objective.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update objective');
      }

      const updatedObjective = await response.json();
      onSuccess(updatedObjective);
      onOpenChange(false);
      toast.success('Objective updated successfully');
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update objective');
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Objective</DialogTitle>
          <DialogDescription>
            Update the objective details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter objective code" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {objectiveLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0) + level.slice(1).toLowerCase()}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter objective description"
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
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter order index"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Objective'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 