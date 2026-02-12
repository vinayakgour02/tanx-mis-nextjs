"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  KeyRound,
  Eye,
  Edit2,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { staticSidebarItems } from "../../components/navigation-config";
import type { TeamMember } from "@/types/team";

// --- Schema Definitions ---
const formSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  roleType: z.enum(["ngo", "donor"]),
  role: z.enum([
    "ngo_admin",
    "mel",
    "program_department",
    "project_manager_ngo",
    "me_officer",
    "field_agent",
    "donor_admin",
  ]),
  permissions: z
    .array(
      z.object({
        resource: z.string(),
        action: z.enum(["read", "write", "admin"]),
      })
    )
    .optional(),
});

const ngoRoles = [
  { value: "ngo_admin", label: "NGO Admin" },
  { value: "program_department", label: "Program Head" },
  { value: "project_manager_ngo", label: "Project Manager" },
  { value: "mel", label: "MEL Manager" },
  { value: "me_officer", label: "MIS Officer" },
  { value: "field_agent", label: "Field Agent" },
];

const donorRoles = [{ value: "donor_admin", label: "Donor Admin" }];

const steps = [
  { id: "personal", title: "Personal Info", icon: User },
  { id: "role", title: "Role & Type", icon: Shield },
  { id: "permissions", title: "Access Control", icon: KeyRound },
];

interface EditTeamMemberDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: TeamMember) => void;
}

export function EditTeamMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: EditTeamMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({});

  const initialRoleType = useMemo(() => {
    if (!member) return "ngo" as const;
    const m = member.memberships[0];
    return m?.donorRole ? ("donor" as const) : ("ngo" as const);
  }, [member]);

  const initialRole = useMemo(() => {
    if (!member) return "ngo_admin" as const;
    const m = member.memberships[0];
    return (m?.ngoRole || m?.donorRole || "ngo_admin") as any;
  }, [member]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      userId: member?.id || "",
      email: member?.email || "",
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      roleType: initialRoleType,
      role: initialRole,
      permissions: [],
    },
  });

  const roleType = form.watch("roleType");
  const totalSteps = roleType === "donor" ? 2 : 3;

  // Load Permissions
  useEffect(() => {
    if (!member) return;
    const map: Record<string, string> = {};
    const perms = member.memberships[0]?.permissions || [];
    perms.forEach((p) => { map[p.resource] = p.action; });
    setSelectedPermissions(map);
  }, [member]);

  useEffect(() => {
    if (roleType === "donor") {
      setSelectedPermissions({});
      form.setValue("permissions", []);
    }
  }, [roleType, form]);

  const flattenSidebarItems = (items: any[], parentKey = ""): any[] => {
    return items.flatMap((item) => {
      const key = parentKey 
        ? `${parentKey}.${item.requiredPermission?.resource || item.title.toLowerCase().replace(/\s+/g, "_")}` 
        : (item.requiredPermission?.resource || item.title.toLowerCase().replace(/\s+/g, "_"));

      const current = item.requiredPermission
        ? [{ title: item.title, resource: key, action: item.requiredPermission.action }]
        : [];

      const children = item.children ? flattenSidebarItems(item.children, key) : [];
      return [...current, ...children];
    });
  };

  const allPermissions = useMemo(() => [
    ...flattenSidebarItems(staticSidebarItems),
    { title: "Asset Handover", resource: "asset-handovers", action: "admin" },
  ], []);

  const updateFormPermissions = (permissions: Record<string, string>) => {
    const typed = Object.entries(permissions).map(([resource, action]) => ({
      resource,
      action: action as "read" | "write" | "admin",
    }));
    form.setValue("permissions", typed);
  };

  const handlePermissionToggle = (resource: string, enabled: boolean) => {
    const newPermissions = { ...selectedPermissions };
    if (enabled) {
      newPermissions[resource] = "read"; // Default to read
    } else {
      delete newPermissions[resource];
    }
    setSelectedPermissions(newPermissions);
    updateFormPermissions(newPermissions);
  };

  const handleActionChange = (resource: string, action: string) => {
    const newPermissions = { ...selectedPermissions, [resource]: action };
    setSelectedPermissions(newPermissions);
    updateFormPermissions(newPermissions);
  };

  const handleNext = async () => {
    const fields =
      currentStep === 0 ? ["email", "firstName", "lastName"]
      : currentStep === 1 ? ["roleType", "role"]
      : [];
    
    const valid = await form.trigger(fields as any);
    if (valid && currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => setCurrentStep(currentStep - 1);

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
    form.reset();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const body = {
        userId: values.userId,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        roleType: values.roleType,
        role: values.role,
        permissions: values.permissions || [],
      };

      const resp = await fetch("/api/org/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update team member");
      }

      onSuccess(await resp.json() as TeamMember);
      toast.success("Team member updated successfully");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update team member");
    } finally {
      setIsLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50/50 border-b border-slate-100">
          <DialogTitle className="text-xl">Edit Team Member</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
             {steps.slice(0, totalSteps).map((step, idx) => {
               const Icon = step.icon;
               const isActive = idx === currentStep;
               const isCompleted = idx < currentStep;
               
               return (
                 <div key={step.id} className="flex items-center flex-1 last:flex-none">
                   <div 
                     className={cn(
                       "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                       isActive ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200" : 
                       isCompleted ? "text-green-600 bg-green-50" : "text-slate-400"
                     )}
                   >
                     <Icon className="w-4 h-4" />
                     <span className="hidden sm:inline">{step.title}</span>
                   </div>
                   {idx < totalSteps - 1 && (
                     <div className={cn("h-0.5 flex-1 mx-2", isCompleted ? "bg-green-200" : "bg-slate-100")} />
                   )}
                 </div>
               );
             })}
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
              
              {/* --- Step 1: Personal Info --- */}
              {currentStep === 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-slate-50 text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* --- Step 2: Role Selection --- */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="roleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ngo">NGO Member</SelectItem>
                            <SelectItem value="donor">Donor / Funder</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(roleType === "ngo" ? ngoRoles : donorRoles).map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-2">
                          Roles define the default dashboard layout and feature visibility.
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- Step 3: Permissions --- */}
              {currentStep === 2 && roleType === "ngo" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-900">Resource Permissions</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {Object.keys(selectedPermissions).length} enabled
                    </span>
                  </div>
                  
                  <ScrollArea className="h-[320px] pr-4 -mr-4 border rounded-lg bg-slate-50/30 p-2">
                    <div className="space-y-2">
                      {allPermissions.map((perm, i) => {
                        const isEnabled = selectedPermissions.hasOwnProperty(perm.resource);
                        const currentAction = selectedPermissions[perm.resource];

                        return (
                          <div 
                            key={i}
                            
                            className={cn(
                              "p-3 rounded-lg border transition-all",
                              isEnabled ? "bg-white border-orange-200 shadow-sm" : "bg-transparent border-transparent hover:bg-white hover:border-slate-100"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Switch 
                                  checked={isEnabled}
                                  onCheckedChange={(c) => handlePermissionToggle(perm.resource, c)}
                                  className="data-[state=checked]:bg-orange-600"
                                />
                                <span className={cn("text-sm font-medium", isEnabled ? "text-slate-900" : "text-slate-500")}>
                                  {perm.title}
                                </span>
                              </div>
                            </div>

                            {isEnabled && (
                              <div className="mt-3 ml-12 flex gap-1">
                                {[
                                  { value: "read", label: "Read", icon: Eye },
                                  { value: "write", label: "Write", icon: Edit2 },
                                  { value: "admin", label: "Admin", icon: ShieldAlert }
                                ].map((opt) => {
                                  const Icon = opt.icon;
                                  const isActive = currentAction === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => handleActionChange(perm.resource, opt.value)}
                                      className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                                        isActive 
                                          ? "bg-orange-50 border-orange-200 text-orange-700 shadow-sm" 
                                          : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                                      )}
                                    >
                                      <Icon className="w-3 h-3" />
                                      {opt.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* --- Footer Navigation --- */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 sm:justify-between flex-row items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? handleClose : handleBack}
            className="text-slate-500 hover:text-slate-800"
          >
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep === totalSteps - 1 ? (
             <Button 
               onClick={form.handleSubmit(onSubmit)} 
               disabled={isLoading}
               className="bg-orange-600 hover:bg-orange-700 text-white"
             >
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Save Changes
             </Button>
          ) : (
             <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800 text-white">
               Next Step <ArrowRight className="h-4 w-4 ml-2" />
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}