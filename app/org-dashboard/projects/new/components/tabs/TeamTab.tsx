'use client';

import { useEffect, useState } from 'react';
import { UseFormReturn, Path } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type ProjectFormValues } from '../../lib/schema';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberships: {
    ngoRole?: string;
  }[];
}

interface TeamTabProps {
  form: UseFormReturn<ProjectFormValues>;
}

export const projectRoles = [
  'program_head',
  'project_manager',
  'MEL_manager',
  'MIS_officer',
  'field_agent',
] as const;

export function TeamTab({ form }: TeamTabProps) {
  const [orgMembers, setOrgMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrgMembers();
  }, []);

  const fetchOrgMembers = async () => {
    try {
      const response = await fetch('/api/org/team');
      if (!response.ok) throw new Error('Failed to fetch organization members');
      const data = await response.json();
      setOrgMembers(data);
    } catch (error) {
      toast.error('Failed to load organization members');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTeamMember = () => {
    const currentTeam = form.getValues('team') || [];
    form.setValue('team', [
      ...currentTeam,
      {
        userId: '',
        role: 'field_agent',
      },
    ], { shouldValidate: true, shouldTouch: true });
  };

  const removeTeamMember = (index: number) => {
    const currentTeam = form.getValues('team') || [];
    form.setValue(
      'team',
      currentTeam.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Project Team</h3>
        <p className="text-sm text-muted-foreground">
          Add team members and assign their roles in the project
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Team Members</h4>
          <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {form.watch('team')?.map((_, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg">
            <FormField
              control={form.control}
              name={`team.${index}.userId` as Path<ProjectFormValues>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Member*</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orgMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} - {member.email}
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
              name={`team.${index}.role` as Path<ProjectFormValues>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Role*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={String(field.value || "")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => removeTeamMember(index)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Team Member
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 