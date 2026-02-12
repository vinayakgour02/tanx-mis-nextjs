'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';

const organizationTypes = ['NGO', 'CSR', 'TRUST', 'FOUNDATION', 'COMPANY'];

const legalStructures = [
  'SECTION_8_COMPANY',
  'TRUST',
  'SOCIETY',
  'NON_PROFIT',
  'PRIVATE_LIMITED',
  'PUBLIC_LIMITED',
  'LLP',
  'OTHER'
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['NGO', 'CSR', 'TRUST', 'FOUNDATION', 'COMPANY']),
  tagline: z.string().optional(),
  logo: z.any().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  address: z.string().optional(),
  pinCode: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  headName: z.string().optional(),
  headDesignation: z.string().optional(),
  headPhone: z.string().optional(),
  headEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  description: z.string().optional(),
  history: z.string().optional(),
  foundingPurpose: z.string().optional(),
  establishedDate: z.date().optional(),
  visionStatement: z.string().optional(),
  mission: z.string().optional(),
  coreValues: z.string().optional(),
  legalStructure: z.enum(legalStructures).optional(),
  registrationNumber: z.string().optional(),
  registrationDate: z.date().optional(),
  registrationDoc: z.any().optional(),
  panNumber: z.string().optional(),
  panDoc: z.any().optional(),
  tinNumber: z.string().optional(),
  tinDoc: z.any().optional(),
  certificate12A: z.string().optional(),
  certificate12ADoc: z.any().optional(),
  certificate80G: z.string().optional(),
  certificate80GDoc: z.any().optional(),
  csrNumber: z.string().optional(),
  csrDoc: z.any().optional(),
  fcraNumber: z.string().optional(),
  fcraDoc: z.any().optional(),
});

interface OrganizationProfileFormProps {
  initialData?: any;
  onSuccess?: () => void;
  canEdit?: boolean;
}

export function OrganizationProfileForm({ initialData, onSuccess, canEdit }: OrganizationProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isDisabled = !canEdit;


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'NGO',
      tagline: initialData?.tagline || '',
      logo: initialData?.logo || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      website: initialData?.website || '',
      linkedin: initialData?.linkedin || '',
      address: initialData?.address || '',
      pinCode: initialData?.pinCode || '',
      district: initialData?.district || '',
      state: initialData?.state || '',
      country: initialData?.country || '',
      headName: initialData?.headName || '',
      headDesignation: initialData?.headDesignation || '',
      headPhone: initialData?.headPhone || '',
      headEmail: initialData?.headEmail || '',
      description: initialData?.description || '',
      history: initialData?.history || '',
      foundingPurpose: initialData?.foundingPurpose || '',
      establishedDate: initialData?.establishedDate ? new Date(initialData.establishedDate) : undefined,
      visionStatement: initialData?.visionStatement || '',
      mission: initialData?.mission || '',
      coreValues: initialData?.coreValues || '',
      legalStructure: initialData?.legalStructure || 'SECTION_8_COMPANY',
      registrationNumber: initialData?.registrationNumber || '',
      registrationDate: initialData?.registrationDate ? new Date(initialData.registrationDate) : undefined,
      registrationDoc: initialData?.registrationDoc || '',
      panNumber: initialData?.panNumber || '',
      panDoc: initialData?.panDoc || '',
      tinNumber: initialData?.tinNumber || '',
      tinDoc: initialData?.tinDoc || '',
      certificate12A: initialData?.certificate12A || '',
      certificate12ADoc: initialData?.certificate12ADoc || '',
      certificate80G: initialData?.certificate80G || '',
      certificate80GDoc: initialData?.certificate80GDoc || '',
      csrNumber: initialData?.csrNumber || '',
      csrDoc: initialData?.csrDoc || '',
      fcraNumber: initialData?.fcraNumber || '',
      fcraDoc: initialData?.fcraDoc || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
    setIsLoading(true);
      console.log('Form values:', values); // Debug log

      const formData = new FormData();

      // Add all fields to formData
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      console.log('Submitting form...'); // Debug log
      const response = await fetch('/api/organizations/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('Response:', data); // Debug log

      toast.success('Profile updated successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const FileInput = ({ field, accept }: { field: any; accept?: string }) => (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          disabled={isDisabled}
          accept={accept || ACCEPTED_FILE_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > MAX_FILE_SIZE) {
                toast.error('File size should be less than 5MB');
                return;
              }
              if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
                toast.error('Invalid file type');
                return;
              }
              field.onChange(file);
            }
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
        />
        {typeof field.value === 'string' && field.value.startsWith('https') && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => window.open(field.value, '_blank')}
            title="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
      {field.value && (
        <p className="text-sm text-muted-foreground">
          {field.value instanceof File ? (
            <>Selected: {field.value.name}</>
          ) : field.value.startsWith('https') ? (
            <>Current: Document uploaded</>
          ) : (
            <>Selected: File selected</>
          )}
        </p>
      )}
    </div>
  );

  return (
    <Form {...form}>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Basic Info</TabsTrigger>
            <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Organization Details</TabsTrigger>
            <TabsTrigger value="legal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Legal & Registration</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tax & Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your organization's basic details
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name*</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter organization name" {...field} />
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
                      <FormLabel>Organization Type*</FormLabel>
                      <Select disabled={isDisabled} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizationTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tagline</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter organization tagline" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <FileInput  field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Information Section */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input  disabled={isDisabled} type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter website URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter LinkedIn URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Information Section */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter PIN code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter district" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Organization Head Section */}
                <FormField
                  control={form.control}
                  name="headName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Name</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter head name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headDesignation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Designation</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter head designation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Phone</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter head phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Head Email</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter head email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Organization Details</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us more about your organization's mission and history
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter organization description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="history"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>History</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter organization history" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foundingPurpose"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Founding Purpose</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter founding purpose" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="establishedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Established Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01') || isDisabled
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visionStatement"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Vision Statement</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter vision statement" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mission"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Mission</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter mission" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coreValues"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Core Values</FormLabel>
                      <FormControl>
                        <Textarea disabled={isDisabled} placeholder="Enter core values" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="legal" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Legal Registration</h3>
                <p className="text-sm text-muted-foreground">
                  Your organization's legal registration information
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="legalStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Structure</FormLabel>
                      <Select disabled={isDisabled} onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select legal structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {legalStructures.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ')}
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
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Registration Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date('1900-01-01') || isDisabled
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Tax & Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Your organization's tax and compliance documents
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter PAN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="panDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tinNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter TIN number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tinDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TIN Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate12A"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>12A Certificate Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter 12A certificate number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate12ADoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>12A Certificate Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate80G"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>80G Certificate Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter 80G certificate number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificate80GDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>80G Certificate Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="csrNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSR Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter CSR number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="csrDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSR Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fcraNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FCRA Number</FormLabel>
                      <FormControl>
                        <Input disabled={isDisabled} placeholder="Enter FCRA number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fcraDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FCRA Document</FormLabel>
                      <FormControl>
                        <FileInput field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

    <div className="flex justify-end pt-6 border-t">
  {canEdit && (
    <Button 
      type="submit" 
      disabled={isLoading}
      className="w-[200px]"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving Changes...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  )}
</div>

      </form>
    </Form>
  );
} 