'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { staticSidebarItems } from "../../components/navigation-config"

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  roleType: z.enum(['ngo', 'donor']),
  role: z.enum([
    'ngo_admin',
    'mel',
    'program_department',
    'project_manager_ngo',
    'me_officer',
    'field_agent',
    'donor_admin'
  ]),
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.enum(['read', 'write', 'admin'])
  })).optional(),
  password: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface AddTeamMemberDialogProps {
  onSuccess: (member: any) => void;
}

const ngoRoles = [
  { value: 'ngo_admin', label: 'NGO Admin' },
  { value: 'program_department', label: 'Program Head' },
  { value: 'project_manager_ngo', label: 'Project Manager' },
  { value: 'mel', label: 'MEL Manager' },
  { value: 'me_officer', label: 'MIS officer' },
  { value: 'field_agent', label: 'Field Agent' }
];

const donorRoles = [
  { value: 'donor_admin', label: 'Donor Admin' }
];

const actions = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
  { value: 'admin', label: 'Admin' }
];

const steps = [
  { id: 'personal', title: 'Personal Information' },
  { id: 'role', title: 'Role Selection' },
  { id: 'permissions', title: 'Permissions' }
];

export function AddTeamMemberDialog({ onSuccess }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({});
  const [passwordMode, setPasswordMode] = useState<'system' | 'custom'>('system');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      roleType: 'ngo',
      role: 'ngo_admin',
      permissions: [],
      password: ''
    }
  });

  const router = useRouter();
  const roleType = form.watch('roleType');
  const totalSteps = roleType === 'donor' ? 2 : 3;

  // Reset permissions when switching to donor
  useEffect(() => {
    if (roleType === 'donor') {
      setSelectedPermissions({});
      form.setValue('permissions', []);
    }
  }, [roleType, form]);

  const handlePermissionChange = (checked: boolean, resource: string) => {
    const newPermissions = { ...selectedPermissions };
    if (checked) {
      newPermissions[resource] = 'read';
    } else {
      delete newPermissions[resource];
    }
    setSelectedPermissions(newPermissions);
    updateFormPermissions(newPermissions);
  };

  const handleActionChange = (resource: string, action: string) => {
    const newPermissions = { ...selectedPermissions };
    newPermissions[resource] = action;
    setSelectedPermissions(newPermissions);
    updateFormPermissions(newPermissions);
  };

  const updateFormPermissions = (permissions: Record<string, string>) => {
    const typed = Object.entries(permissions).map(([resource, action]) => ({
      resource,
      action: action as 'read' | 'write' | 'admin',
    }));
    form.setValue('permissions', typed);
  };

 // ✅ Only include top-level items that have requiredPermission
const flattenSidebarItems = (items: any[]) => {
  return items
    .filter((item) => item.requiredPermission) // only top-level items with permission
    .map((item) => ({
      title: item.title,
      resource: item.requiredPermission.resource,
      action: item.requiredPermission.action,
    }));
};


  const allPermissions = flattenSidebarItems(staticSidebarItems);

const handleSubmit = async (values: FormValues, e?: React.BaseSyntheticEvent) => {
 
  e?.preventDefault();
  e?.stopPropagation();
    try {
      setIsLoading(true);
      const body: any = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        roleType: values.roleType === 'ngo' ? 'ngoRole' : 'donorRole',
        role: values.role,
        permissions: values.permissions || [],
      };

      if (passwordMode === 'custom' && values.password) {
        body.password = values.password;
      }

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to create team member');

      const member = await response.json();
      onSuccess(member);
      setOpen(false);
      router.refresh();

      if (passwordMode === 'system') {
        toast.success(`User created. Default password: tanx123`);
      } else {
        toast.success('Team member added successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    const fields =
      currentStep === 0 ? ['email', 'firstName', 'lastName'] :
      currentStep === 1 ? ['roleType', 'role'] : [];

    const valid = await form.trigger(fields as any);
    if (valid && currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentStep(0);
    setSelectedPermissions({});
    setPasswordMode('system');
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="relative mb-8">
          <div className="absolute top-4 w-full h-0.5 bg-gray-200" />
          <div className="relative flex justify-between">
            {steps.slice(0, totalSteps).map((step, i) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border',
                    i <= currentStep ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-500'
                  )}
                >
                  {i + 1}
                </div>
                <div className="mt-2 text-xs font-medium text-gray-600">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
  <form
    onSubmit={form.handleSubmit(handleSubmit)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && e.target instanceof HTMLElement && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    }}
    className="space-y-4"
  >
    {/* Step 1: Personal Info */}
    {currentStep === 0 && (
      <div className="space-y-4">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email*</FormLabel>
            <FormControl><Input placeholder="Enter email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name*</FormLabel>
              <FormControl><Input placeholder="First name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name*</FormLabel>
              <FormControl><Input placeholder="Last name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>
    )}

    {/* Step 2: Role */}
    {currentStep === 1 && (
      <div className="space-y-4">
        <FormField control={form.control} name="roleType" render={({ field }) => (
          <FormItem>
            <FormLabel>Role Type*</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="donor">Donor</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Role*</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {(roleType === 'ngo' ? ngoRoles : donorRoles).map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    )}

    {/* Step 3: Permissions */}
    {currentStep === 2 && roleType === 'ngo' && (
      <div className="space-y-4">
        <FormLabel>Permissions</FormLabel>
        <div className="max-h-[300px] overflow-y-auto space-y-3">
          {allPermissions.map((perm) => {
            const checked = selectedPermissions.hasOwnProperty(perm.resource);
            return (
              <div key={perm.resource} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={perm.resource}
                    checked={checked}
                    onCheckedChange={(c) => handlePermissionChange(c as boolean, perm.resource)}
                  />
                  <label htmlFor={perm.resource} className="text-sm font-medium">{perm.title}</label>
                </div>
                {checked && (
                  <RadioGroup
                    value={selectedPermissions[perm.resource]}
                    onValueChange={(val) => handleActionChange(perm.resource, val)}
                    className="flex space-x-4 ml-6"
                  >
                    {actions.map((a) => (
                      <div key={a.value} className="flex items-center space-x-1">
                        <RadioGroupItem value={a.value} id={`${perm.resource}-${a.value}`} />
                        <label htmlFor={`${perm.resource}-${a.value}`} className="text-xs">{a.label}</label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Only the submit button stays inside the form */}
    {currentStep === totalSteps - 1 && (
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Team Member'}
        </Button>
      </div>
    )}
  </form>

  {/* Navigation Buttons Outside Form (so they don’t trigger submit) */}
  <div className="flex justify-between pt-4">
    <Button onClick={currentStep === 0 ? handleClose : handleBack} variant="outline">
      {currentStep === 0 ? 'Cancel' : <><ArrowLeft className="h-4 w-4 mr-2" />Back</>}
    </Button>

    {currentStep < totalSteps - 1 && (
      <Button onClick={handleNext}>
        Next <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    )}
  </div>
</Form>

      </DialogContent>
    </Dialog>
  );
}
