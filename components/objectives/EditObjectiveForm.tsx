'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateObjective } from '@/app/actions/objectives';

const formSchema = z.object({
  id: z.string(),
  type: z.enum(['Project', 'Program', 'Organization']),
  level: z.string().min(1, 'Level is required'),
  description: z.string().min(1, 'Description is required'),
  projectId: z.string().nullable().optional(),
  programId: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
});

interface EditObjectiveFormProps {
  scope: 'organization' | 'program' | 'project';
  objective: {
    id: string;
    type: 'Project' | 'Program' | 'Organization';
    level: string;
    description: string;
    projectId?: string | null;
    programId?: string | null;
    organizationId?: string | null;
  };
  organizationId?: string;
  projects: { id: string; name: string }[];
  programs: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function EditObjectiveForm({
  scope,
  objective,
  organizationId,
  projects,
  programs,
  onSuccess,
}: EditObjectiveFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...objective,
      // force organization type if scope is organization
      type: scope === 'organization' ? 'Organization' : objective.type,
      organizationId: objective.organizationId ?? organizationId ?? null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await updateObjective(values);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update objective', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );
  const filteredPrograms = programs.filter((p) =>
    p.name.toLowerCase().includes(programSearch.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              {scope === 'organization' ? (
                <p className="text-sm text-muted-foreground">Organization</p>
              ) : (
                <p className="text-sm text-muted-foreground">{field.value}</p>
              )}
            </FormItem>
          )}
        />

        {/* Level */}
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Impact">Impact</SelectItem>
                    <SelectItem value="Outcome">Outcome</SelectItem>
                    <SelectItem value="Output">Output</SelectItem>
                    <SelectItem value="Activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Select (only if scope is not program or organization) */}
        {scope === 'project' && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ''}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Search projects..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                        />
                      </div>
                      {filteredProjects.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No projects found
                        </SelectItem>
                      ) : (
                        filteredProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Program Select (only if scope is project) */}
        {scope === 'program' && (
          <FormField
            control={form.control}
            name="programId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPrograms.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No programs found
                      </SelectItem>
                    ) : (
                      filteredPrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Objective'}
        </Button>
      </form>
    </Form>
  );
}
