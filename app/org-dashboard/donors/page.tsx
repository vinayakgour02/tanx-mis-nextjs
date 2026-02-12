"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, Users, Building, Heart, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

interface Donor {
    id: string;
    name: string;
    code?: string | null;
    type?: "Government" | "NGO" | "CSR" | "Trust" | "Other" | null;
    description?: string | null;
}

// Form schema
const donorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().optional(),
    type: z.enum(["Government", "NGO", "CSR", "Trust", "Other"]).optional(),
    description: z.string().optional(),
});
type DonorFormValues = z.infer<typeof donorSchema>;

// Type icon mapping
const getTypeIcon = (type: string | null | undefined) => {
    switch (type) {
        case "Government":
            return <Building className="w-4 h-4" />;
        case "NGO":
            return <Heart className="w-4 h-4" />;
        case "CSR":
            return <Building className="w-4 h-4" />;
        case "Trust":
            return <Building className="w-4 h-4" />;
        default:
            return <Users className="w-4 h-4" />;
    }
};

// Type color mapping
const getTypeBadgeVariant = (type: string | null | undefined) => {
    switch (type) {
        case "Government":
            return "outline";
        case "NGO":
            return "outline";
        case "Trust":
            return "outline";
        case "CSR":
            return "outline";
        default:
            return "destructive";
    }
};

export default function DonorsManager() {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDonor, setEditDonor] = useState<Donor | null>(null);
    const { can } = usePermissions();

// Permission check
const canCreateDonor =
  can("organization.donor", "write") ||
  can("organization.donor", "create") ||
  can("organization.donor", "admin") ||
  can("donors", "create") ||
  can("donors", "admin");

const canEditDonor =
  can("organization.donor", "write") ||
  can("organization.donor", "update") ||
  can("organization.donor", "admin") ||
  can("donors", "update") ||
  can("donors", "admin");

const canDeleteDonor =
  can("organization.donor", "write") ||
  can("organization.donor", "delete") ||
  can("organization.donor", "admin") ||
  can("donors", "delete") ||
  can("donors", "admin");


    // Fetch donors
    const { data: donors = [], isFetching } = useQuery({
        queryKey: ["donors"],
        queryFn: async (): Promise<Donor[]> => {
            const res = await fetch("/api/donors");
            if (!res.ok) throw new Error("Failed to fetch donors");
            return res.json();
        },
    });

    const donorTypes = ["Government", "NGO", "CSR", "Trust", "Other"] as const;

    const donorStats = donorTypes.map((type) => ({
        type,
        count: donors.filter((d) => d.type === type).length,
    }));

    // Map type → colors/icons for stat cards
    const typeStyles: Record<string, { icon: any, color: string }> = {
        Government: { icon: <Building className="w-5 h-5" />, color: "bg-blue-50 text-blue-700" },
        NGO: { icon: <Heart className="w-5 h-5" />, color: "bg-pink-50 text-pink-700" },
        CSR: { icon: <Briefcase className="w-5 h-5" />, color: "bg-purple-50 text-purple-700" },
        Trust: { icon: <Users className="w-5 h-5" />, color: "bg-green-50 text-green-700" },
        Other: { icon: <Users className="w-5 h-5" />, color: "bg-gray-50 text-gray-700" },
    };

    // Create or update donor mutation
    const saveDonorMutation = useMutation({
        mutationFn: async (donor: DonorFormValues & { id?: string }) => {
            const res = await fetch(donor.id ? `/api/donors/${donor.id}` : "/api/donors", {
                method: donor.id ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(donor),
            });
            if (!res.ok) throw new Error("Failed to save donor");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["donors"] });
            setDialogOpen(false);
            toast.success("Donor List updated")
            setEditDonor(null);
        },
    });

    // Delete donor mutation
    const deleteDonorMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/donors/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete donor");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["donors"] })
            toast.success("Donor Deleted!")
        },
    });

    // Form
    const form = useForm<DonorFormValues>({
        resolver: zodResolver(donorSchema),
        defaultValues: { name: "", code: "", type: "NGO", description: "" },
    });

    const onOpenCreate = () => {
        form.reset({ name: "", code: "", type: "NGO", description: "" });
        setEditDonor(null);
        setDialogOpen(true);
    };

    const onOpenEdit = (donor: Donor) => {
        form.reset({
            name: donor.name,
            code: donor.code || "",
            type: donor.type || "NGO",
            description: donor.description || "",
        });
        setEditDonor(donor);
        setDialogOpen(true);
    };

    const onSubmit = (values: DonorFormValues) => {
        saveDonorMutation.mutate({ ...values, id: editDonor?.id });
    };

    // Enhanced columns with better styling
    const columns: ColumnDef<Donor, any>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="font-medium text-gray-900">{row.getValue("name")}</div>
            ),
        },
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => {
                const code = row.getValue("code");
                return code ? (
                    <Badge variant="outline" className="font-mono text-xs">
                        {String(code)}
                    </Badge>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type");
                return type ? (
                    <div className="flex items-center gap-2">
                        {getTypeIcon(String(type))}
                        <Badge variant={getTypeBadgeVariant((String(type)))} className="text-xs">
                            {(String(type))}
                        </Badge>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const description = row.getValue("description");
                return description ? (
                    <div className="max-w-xs truncate text-gray-600 text-sm" title={String(description)}>
                        {String(description)}
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                );
            },
        },
       {
  id: "actions",
  header: "Actions",
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      {canEditDonor && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
          onClick={() => onOpenEdit(row.original)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      )}

      {canDeleteDonor && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
          onClick={() => deleteDonorMutation.mutate(row.original.id)}
          disabled={deleteDonorMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  ),
}

    ];

    return (
        <div className="min-h-screen ">
            <div className="container mx-auto py-8 space-y-8">
                {/* Header Section */}
                {/* Header Section */}
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold bg-white text-black">Donors Management</h1>
                        <p className="text-gray-600">
                            Manage your organization's donors and funding sources
                        </p>
                    </div>
                    {canCreateDonor && (
                    <Button
                        onClick={onOpenCreate}
                        className="bg-black text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Donor
                    </Button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                    {donorStats
                        .filter((stat) => stat.count > 0) // only show if count > 0
                        .map((stat) => {
                            const style = typeStyles[stat.type];
                            return (
                                <Card
                                    key={stat.type}
                                    className={`shadow-md border-0 ${style.color} p-4 flex items-center gap-4`}
                                >
                                    {style.icon}
                                    <div>
                                        <p className="text-sm font-medium">{stat.type}</p>
                                        <p className="text-2xl font-bold">{stat.count}</p>
                                    </div>
                                </Card>
                            );
                        })}
                </div>


                {/* Main Data Table */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    {/* <CardHeader class */}
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={donors}
                            loading={isFetching}
                        />
                    </CardContent>
                </Card>

                {/* Enhanced Dialog Form */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                        <DialogHeader className="pb-6">
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                                {editDonor ? "Edit Donor" : "Add New Donor"}
                            </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <div className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Donor Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter donor name"
                                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Donor Code
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter unique code (optional)"
                                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Donor Type
                                            </FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                        <SelectValue placeholder="Select donor type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {donorTypes.map((type) => (
                                                            <SelectItem key={type} value={type}>
                                                                <div className="flex items-center gap-2">
                                                                    {getTypeIcon(type)}
                                                                    {type}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">
                                                Description
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter donor description (optional)"
                                                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                        className="px-6"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={saveDonorMutation.isPending}
                                        className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {saveDonorMutation.isPending ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </div>
                                        ) : (
                                            editDonor ? "Update Donor" : "Add Donor"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}