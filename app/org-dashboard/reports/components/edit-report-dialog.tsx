"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useWatch } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, MapPin, Edit2, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRef } from "react";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// Add type definition for TrainingParticipant
type TrainingParticipant = {
  id: string
  name: string
  age: number
  gender: string
  education: string
  socialGroup: string
  designation: string
  organization: string
  mobile: string
  email: string
  isPwd: boolean
  peopleBankId?: string
}

// Add types for benefits
type Benefit = {
  id: string;
  name: string;
  unitType: string;
  reportedNumber: number;
}

// Add types for uploaded files
type UploadedFile = {
  url: string;
  publicId: string;
  originalName: string;
}

const formSchema = z.object({
  // Basic report fields
  reportingDate: z.date({
    required_error: "Activity date is required",
  }),
  reportingMonth: z.string().min(1, "Month is required"),
  reportingQuarter: z.string().min(1, "Quarter is required"),
  reportingYear: z.string().min(1, "Year is required"),

  levelofActivity: z.enum(["state", "district", "blockName", "villageName"], {
    required_error: "Level of activity is required",
  }),
  interventionAreaId: z.string().min(1, "Intervention area is required"),
  location: z.string().optional(),
  gpsCoordinates: z.string().optional(),

  unitReported: z.number().min(0, "Unit reported must be positive"),
  numberOfPeople: z.number().optional(),
  hasLeverage: z.boolean(),
  leverageSources: z.array(z.string()).optional(),
  leverageGovt: z.number().optional(),
  leverageCsr: z.number().optional(),
  leverageCommunity: z.number().optional(),
  evidenceFiles: z.array(z.any()).default([]),
  reportFiles: z.array(z.any()).default([]),
  // Training fields
  trainingDateFrom: z.date().optional(),
  trainingDateTo: z.date().optional(),
  // Infrastructure fields
  infrastructureName: z.string().optional(),
  category: z.string().optional(),
  workType: z.string().optional(),
  dprApproved: z.boolean().default(false),
  approvedDesignFollowed: z.boolean().default(false),
  designChangeDetails: z.string().optional(),
  sanctionBudget: z.number().optional(),
  expensesIncurred: z.number().optional(),
  workDescription: z.string().optional(),
  benefits: z.string().optional(),
  preConstructionPhotos: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    originalName: z.string()
  })).default([]),
  duringConstructionPhotos: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    originalName: z.string()
  })).default([]),
  postConstructionPhotos: z.array(z.object({
    url: z.string(),
    publicId: z.string(),
    originalName: z.string()
  })).default([]),
  // Household fields
  beneficiaryName: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  socialGroup: z.string().optional(),
  maleMembers: z.number().optional(),
  femaleMembers: z.number().optional(),
  totalMembers: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditReportDialogProps {
  reportId: string
  open: boolean
  onReportUpdated?: () => void
  onClose: () => void
}

export function EditReportDialog({ reportId, open, onReportUpdated, onClose }: EditReportDialogProps) {
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const participantsInitializedRef = useRef(false);
  const initialParticipantCountRef = useRef(0);
  const locationInitialized = useRef(false);


  // Hierarchical location selection state
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [selectedVillageId, setSelectedVillageId] = useState<string>('')

  // Organization and PeopleBank state
  const [organization, setOrganization] = useState<any>(null)
  const [peopleBank, setPeopleBank] = useState<any[]>([])
  const [usePeopleBank, setUsePeopleBank] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      reportingDate: new Date(),
      reportingMonth: "",
      reportingQuarter: "",
      reportingYear: "",
      levelofActivity: "state", // Default
      interventionAreaId: "",
      location: "",
      gpsCoordinates: "",
      unitReported: 0,
      numberOfPeople: undefined,
      hasLeverage: false,
      leverageSources: [],
      leverageGovt: undefined,
      leverageCsr: undefined,
      leverageCommunity: undefined,
      evidenceFiles: [],
      reportFiles: [],
      trainingDateFrom: undefined,
      trainingDateTo: undefined,
      infrastructureName: undefined,
      category: undefined,
      workType: undefined,
      dprApproved: false,
      approvedDesignFollowed: false,
      designChangeDetails: undefined,
      sanctionBudget: undefined,
      expensesIncurred: undefined,
      workDescription: undefined,
      benefits: undefined,
      preConstructionPhotos: [],
      duringConstructionPhotos: [],
      postConstructionPhotos: [],
      beneficiaryName: undefined,
      age: undefined,
      gender: undefined,
      socialGroup: undefined,
      maleMembers: undefined,
      femaleMembers: undefined,
      totalMembers: undefined,
    },
  })

  // Watch the numberOfPeople field for changes
  const numberOfPeople = form.watch("numberOfPeople");
  const levelOfActivity = useWatch({ control: form.control, name: "levelofActivity" });


  // Fetch organization data
  const { data: orgData } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const response = await fetch("/api/organizations/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch organization data")
      }
      return response.json()
    },
    enabled: open,
  })

  // Update organization state when data changes
  useEffect(() => {
    if (orgData) {
      setOrganization(orgData)
    }
  }, [orgData])




  // Fetch PeopleBank data for organizations with access
  const { data: peopleBankData, isLoading: isLoadingPeopleBank } = useQuery({
    queryKey: ["peopleBank"],
    queryFn: async () => {
      const response = await fetch("/api/people-bank")
      if (!response.ok) {
        throw new Error("Failed to fetch people bank data")
      }
      return response.json()
    },
    enabled: open && !!orgData?.hasAccesstoPeopleBank
  })

  // Update peopleBank state when data changes
  useEffect(() => {
    if (peopleBankData) {
      setPeopleBank(peopleBankData)
    }
  }, [peopleBankData])

  // Fetch report details
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ["report-edit", reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch report details")
      }
      return response.json()
    },
    enabled: open,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: interventionAreas, isLoading: isLoadingInterventionAreas } = useQuery({
    queryKey: ["interventionAreas", report?.projectId],
    queryFn: async () => {
      if (!report?.projectId) return []
      const response = await fetch(`/api/projects/${report.projectId}/intervention-areas`)
      if (!response.ok) throw new Error("Failed to fetch intervention areas")
      return response.json()
    },
    enabled: !!report?.projectId,
  })

  const getUniqueStates = () => {
    if (!interventionAreas || interventionAreas.length === 0) return []
    const uniqueStates = new Map<string, { id: string; name: string }>()
    interventionAreas.forEach((area: any) => {
      const stateId = area.stateId || area.state?.id
      const stateName = area.state?.name || area.state
      if (stateId && stateName && !uniqueStates.has(stateId)) {
        uniqueStates.set(stateId, { id: stateId, name: stateName })
      }
    })
    return Array.from(uniqueStates.values())
  }


  const getUniqueDistricts = (selectedStateId: string) => {
    if (!interventionAreas || !selectedStateId) return []
    const uniqueDistricts = new Map<string, { id: string; name: string }>()
    interventionAreas
      .filter((area: any) => (area.stateId || area.state?.id) === selectedStateId)
      .forEach((area: any) => {
        const districtId = area.districtId || area.district?.id
        const districtName = area.district?.name || area.district
        if (districtId && districtName && !uniqueDistricts.has(districtId)) {
          uniqueDistricts.set(districtId, { id: districtId, name: districtName })
        }
      })
    return Array.from(uniqueDistricts.values())
  }

  const getUniqueBlocks = (selectedStateId: string, selectedDistrictId: string) => {
    if (!interventionAreas || !selectedStateId || !selectedDistrictId) return []
    const uniqueBlocks = new Map<string, { id: string; name: string }>()
    interventionAreas
      .filter((area: any) =>
        (area.stateId || area.state?.id) === selectedStateId &&
        (area.districtId || area.district?.id) === selectedDistrictId
      )
      .forEach((area: any) => {
        const blockId = area.blockId || area.blockName?.id
        const blockName = area.blockName?.name || area.blockName
        if (blockId && blockName && !uniqueBlocks.has(blockId)) {
          uniqueBlocks.set(blockId, { id: blockId, name: blockName })
        }
      })
    return Array.from(uniqueBlocks.values())
  }

  const getUniqueVillages = (selectedStateId: string, selectedDistrictId: string, selectedBlockId: string) => {
    if (!interventionAreas || !selectedStateId || !selectedDistrictId || !selectedBlockId) return []
    const uniqueVillages = new Map<string, { id: string; name: string }>()
    interventionAreas
      .filter((area: any) =>
        (area.stateId || area.state?.id) === selectedStateId &&
        (area.districtId || area.district?.id) === selectedDistrictId &&
        (area.blockId || area.blockName?.id) === selectedBlockId
      )
      .forEach((area: any) => {
        const villageId = area.villageId || area.villageName?.id
        const villageName = area.villageName?.name || area.villageName
        if (villageId && villageName && !uniqueVillages.has(villageId)) {
          uniqueVillages.set(villageId, { id: villageId, name: villageName })
        }
      })
    return Array.from(uniqueVillages.values())
  }

  const findMatchingInterventionArea = (level: string, stateId?: string, districtId?: string, blockId?: string, villageId?: string) => {
    if (!interventionAreas) return null
    return interventionAreas.find((area: any) => {
      const aStateId = area.stateId || area.state?.id
      const aDistrictId = area.districtId || area.district?.id
      const aBlockId = area.blockId || area.blockName?.id
      const aVillageId = area.villageId || area.villageName?.id

      switch (level) {
        case "state": return aStateId === stateId
        case "district": return aStateId === stateId && aDistrictId === districtId
        case "blockName": return aStateId === stateId && aDistrictId === districtId && aBlockId === blockId
        case "villageName": return aStateId === stateId && aDistrictId === districtId && aBlockId === blockId && aVillageId === villageId
        default: return false
      }
    })
  }


  // Populate form with report data when loaded
  useEffect(() => {
    if (report) {
      form.reset({
        reportingDate: new Date(report.reportingDate),
        reportingMonth: report.reportingMonth || "",
        reportingQuarter: report.reportingQuarter || "",
        reportingYear: report.reportingYear || "",
        location: report.landscape || "",
        gpsCoordinates: report.gpsCoordinates || "",
        unitReported: report.unitReported || 0,
        numberOfPeople:
          report.numberOfPeople !== null
            ? report.numberOfPeople
            : undefined,

        hasLeverage: report.hasLeverage || false,
        leverageSources: report.leverageSources ? report.leverageSources.split(", ") : [],
        leverageGovt: report.leverageGovt || undefined,
        leverageCsr: report.leverageCsr || undefined,
        leverageCommunity: report.leverageCommunity || undefined,
        evidenceFiles: [],
        reportFiles: [],
        levelofActivity: report.levelofActivity || "state",
        interventionAreaId: report.interventionAreaId || "",
        // Training fields
        trainingDateFrom: report.trainingReport?.dateFrom ? new Date(report.trainingReport.dateFrom) : undefined,
        trainingDateTo: report.trainingReport?.dateTo ? new Date(report.trainingReport.dateTo) : undefined,
        infrastructureName: report.infrastructureReport?.infrastructureName || "",
        category: report.infrastructureReport?.category || undefined,
        workType: report.infrastructureReport?.workType || undefined,
        dprApproved: report.infrastructureReport?.dprApproved || false,
        approvedDesignFollowed: report.infrastructureReport?.approvedDesignFollowed || false,
        designChangeDetails: report.infrastructureReport?.designChangeDetails || undefined,
        sanctionBudget: report.infrastructureReport?.sanctionBudget || undefined,
        expensesIncurred: report.infrastructureReport?.expensesIncurred || undefined,
        workDescription: report.infrastructureReport?.workDescription || undefined,
        benefits: report.infrastructureReport?.benefits || undefined,
        preConstructionPhotos: report.infrastructureReport?.preConstructionPhotos ?
          JSON.parse(report.infrastructureReport.preConstructionPhotos) : [],
        duringConstructionPhotos: report.infrastructureReport?.duringConstructionPhotos ?
          JSON.parse(report.infrastructureReport.duringConstructionPhotos) : [],
        postConstructionPhotos: report.infrastructureReport?.postConstructionPhotos ?
          JSON.parse(report.infrastructureReport.postConstructionPhotos) : [],
        // Household fields
        beneficiaryName: report.householdReport?.beneficiaryName || undefined,
        age: report.householdReport?.age || undefined,
        gender: report.householdReport?.gender || undefined,
        socialGroup: report.householdReport?.socialGroup || undefined,
        maleMembers: report.householdReport?.maleMembers || undefined,
        femaleMembers: report.householdReport?.femaleMembers || undefined,
        totalMembers: report.householdReport?.totalMembers || undefined,
      })
      form.setValue("reportingMonth", report.reportingMonth)
      form.setValue("reportingQuarter", report.reportingQuarter)



      // Set participants if it's a training report
      if (report.trainingReport?.participants) {
        const loadedParticipants = report.trainingReport.participants.map((p: any) => ({
          id: p.id || Date.now().toString(),
          name: p.name,
          age: p.age,
          gender: p.gender,
          education: p.education,
          socialGroup: p.socialGroup,
          designation: p.designation,
          organization: p.organization,
          mobile: p.mobile,
          email: p.email,
          isPwd: p.isPwd || false,
          peopleBankId: p.peopleBankId || undefined,
        }));

        setParticipants(loadedParticipants);

        participantsInitializedRef.current = true;
        initialParticipantCountRef.current = loadedParticipants.length;
        form.setValue("numberOfPeople", loadedParticipants.length);


        // If any participants are from PeopleBank, enable the PeopleBank selection by default
        if (loadedParticipants.some((p: any) => p.peopleBankId)) {
          setUsePeopleBank(true);
        }
      }

      // Set benefits if it's a household report
      if (report.householdReport?.benefits) {
        setBenefits(report.householdReport.benefits.map((b: any) => ({
          id: b.id || Date.now().toString(),
          name: b.benefitType?.name || '',
          unitType: b.benefitType?.unitType || '',
          reportedNumber: b.reportedNumber || 0,
        })))
      }
    }
  }, [report, form])

if (report?.infrastructureReport) {
  setTimeout(() => {
    form.setValue(
      "category",
      report.infrastructureReport.category || ""
    );

    form.setValue(
      "workType",
      report.infrastructureReport.workType || ""
    );
  }, 0);
}

  console.log("this is report:", report)


  useEffect(() => {
    if (report?.type !== "Training") return;

    const count = numberOfPeople || 0;

    setParticipants(prev => {
      // First time: allow API load only
      if (!participantsInitializedRef.current) {
        return prev;
      }

      if (prev.length === count) return prev;

      // ➕ Add blanks
      if (count > prev.length) {
        const toAdd = count - prev.length;

        const added = Array.from({ length: toAdd }).map((_, i) => ({
          id: `${Date.now()}-${prev.length + i}`,
          name: '',
          age: 0,
          gender: '',
          education: '',
          socialGroup: '',
          designation: '',
          organization: '',
          mobile: '',
          email: '',
          isPwd: false,
        }));

        return [...prev, ...added];
      }

      if (count < prev.length) {

        return prev.slice(0, count);
      }

      return prev;
    });

  }, [numberOfPeople, report?.type]);


  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      // Prepare participants data for training reports
      const participantsData = report?.type === "Training" && participants.length > 0
        ? participants.filter(p => p.name && p.age && p.gender)
          .map(p => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
            education: p.education || '',
            socialGroup: p.socialGroup || '',
            designation: p.designation || '',
            organization: p.organization || '',
            mobile: p.mobile || '',
            email: p.email || '',
            isPwd: Boolean(p.isPwd),
            peopleBankId: p.peopleBankId || null
          }))
        : []

      // Prepare benefits data for household reports
      const benefitsData = report?.type === "Household" && benefits.length > 0
        ? benefits.filter(b => b.name && b.unitType)
        : []

      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          type: report?.type,
          status: report?.status,
          // Add participants if it's a training report
          ...(report?.type === "Training" && participantsData.length > 0 && {
            participants: participantsData,
          }),
          // Add benefits if it's a household report
          ...(report?.type === "Household" && benefitsData.length > 0 && {
            benefits: benefitsData,
          }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update report")
      }

      const updatedReport = await response.json()

      // Show success message
      const participantCount = report?.type === "Training" ? participantsData.length : 0
      const benefitCount = report?.type === "Household" ? benefitsData.length : 0

      let description = `${report?.type || "Activity"} report has been updated.`
      if (report?.type === "Training" && participantCount > 0) {
        description = `Training report updated with ${participantCount} participant${participantCount !== 1 ? 's' : ''}.`
      } else if (report?.type === "Household" && benefitCount > 0) {
        description = `Household report updated with ${benefitCount} benefit${benefitCount !== 1 ? 's' : ''}.`
      }

      toast.success("Report updated successfully!", { description })


      if (onReportUpdated) {
        onReportUpdated()
      }
    } catch (err) {
      console.error("Error updating report:", err)
      setError(err instanceof Error ? err.message : "An error occurred while updating the report")
      toast.error("Failed to update report", {
        description: err instanceof Error ? err.message : "An unexpected error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getQuarterFromMonth = (monthName: string) => {
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(monthName)

    if (monthIndex >= 0 && monthIndex <= 2) return "Q1"
    if (monthIndex >= 3 && monthIndex <= 5) return "Q2"
    if (monthIndex >= 6 && monthIndex <= 8) return "Q3"
    if (monthIndex >= 9 && monthIndex <= 11) return "Q4"
    return "Q1"
  }

  // Auto-set reporting quarter when month changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'reportingMonth' && value.reportingMonth) {
        const quarter = getQuarterFromMonth(value.reportingMonth)
        form.setValue('reportingQuarter', quarter)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  useEffect(() => {
  if (!open) {

    // Reset hierarchy state
    setSelectedStateId('');
    setSelectedDistrictId('');
    setSelectedBlockId('');
    setSelectedVillageId('');

    // Reset location init flag
    locationInitialized.current = false;

    // Reset related form values
    form.setValue("location", "");
    form.setValue("interventionAreaId", "");

    // Reset other states
    setParticipants([]);
    setBenefits([]);

    participantsInitializedRef.current = false;
    initialParticipantCountRef.current = 0;

    form.reset();
  }
}, [open]);




  const handleFileUpload = async (files: File[], folder: string): Promise<UploadedFile[]> => {
    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file ${file.name}`);
      }

      const result = await response.json();
      uploadedFiles.push(result);
    }

    return uploadedFiles;
  };

  const getAvailableMonths = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // If editing existing report → allow its month
    if (report?.reportingMonth) {
      return months;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    if (currentDay < 7) {
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

      return [
        months[previousMonth],
        months[currentMonth],
      ];
    }

    return [months[currentMonth]];
  };


  const reportingMonth = useWatch({
    control: form.control,
    name: "reportingMonth",
  })

  useEffect(() => {
    if (!reportingMonth) return

    const quarter = getQuarterFromMonth(reportingMonth)

    if (form.getValues("reportingQuarter") !== quarter) {
      form.setValue("reportingQuarter", quarter)
    }
  }, [reportingMonth])

useEffect(() => {
  if (
    locationInitialized.current ||
    !report ||
    !interventionAreas?.length ||
    !report.interventionArea
  )
    return;

  const area = report.interventionArea;

  const stateId = area.state?.id || "";
  const districtId = area.district?.id || "";
  const blockId = area.blockName?.id || "";
  const villageId = area.villageName?.id || "";

  setSelectedStateId(stateId);
  setSelectedDistrictId(districtId);
  setSelectedBlockId(blockId);
  setSelectedVillageId(villageId);

  // Build location text
  const parts = [
    area.state?.name,
    area.district?.name,
    area.blockName?.name,
    area.villageName?.name,
  ].filter(Boolean);

  const location = parts.join(" - ");

  form.setValue("location", location);
  form.setValue("interventionAreaId", report.interventionAreaId);

  locationInitialized.current = true;

}, [report, interventionAreas]);


  return (
    <Dialog key={reportId}
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Report</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoadingReport ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Report Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Report Information</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <div><strong>Type:</strong> {report?.type}</div>
                      <div><strong>Activity:</strong> {report?.activity?.name}</div>
                      <div><strong>Project:</strong> {report?.project?.name}</div>
                    </div>
                  </CardHeader>
                </Card>


                {/* Reporting Period */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reporting Period</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="reportingMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Month</FormLabel>

                          <Select
                            value={field.value}
                            onValueChange={() => { }}
                          >

                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent>
                              {getAvailableMonths().map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
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
                      name="reportingQuarter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Quarter</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted">
                                {field.value || "Auto-selected based on month"}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reportingYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Year</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter reporting year" disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="levelofActivity"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Level of Activity *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(val) => {
                                field.onChange(val);
                                form.setValue("interventionAreaId", "")
                                form.setValue("location", "")
                              }}
                              value={field.value}
                              className="flex flex-row gap-4 space-y-2"
                            >
                              <div className="flex items-center space-x-2"><RadioGroupItem value="state" id="state" /><Label htmlFor="state">State Level</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="district" id="district" /><Label htmlFor="district">District Level</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="blockName" id="blockName" /><Label htmlFor="blockName">Block Level</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="villageName" id="villageName" /><Label htmlFor="villageName">Village Level</Label></div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hierarchical Location Selection */}
                    {levelOfActivity && (
                      <div className="space-y-4">
                        {/* State Selection */}
                        <FormItem>
                          <FormLabel>Select State *</FormLabel>
                          <Select
                            value={selectedStateId}
                            onValueChange={(value) => {
                              setSelectedStateId(value)
                              // Clear downstream
                              setSelectedDistrictId('')
                              setSelectedBlockId('')
                              setSelectedVillageId('')

                              const selectedState = getUniqueStates().find(state => state.id === value)
                              if (selectedState && levelOfActivity === "state") {
                                const matchingArea = findMatchingInterventionArea("state", value)
                                if (matchingArea) {
                                  form.setValue("interventionAreaId", matchingArea.id)
                                  form.setValue("location", selectedState.name)
                                }
                              }
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                            <SelectContent>
                              {isLoadingInterventionAreas ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                getUniqueStates().map((state) => <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>)
                              }
                            </SelectContent>
                          </Select>
                        </FormItem>

                        {/* District Selection */}
                        {["district", "blockName", "villageName"].includes(levelOfActivity) && selectedStateId && (
                          <FormItem>
                            <FormLabel>Select District *</FormLabel>
                            <Select
                              value={selectedDistrictId}
                              onValueChange={(value) => {
                                setSelectedDistrictId(value)
                                setSelectedBlockId('')
                                setSelectedVillageId('')

                                const selectedDistrict = getUniqueDistricts(selectedStateId).find(district => district.id === value)
                                if (selectedDistrict && levelOfActivity === "district") {
                                  const matchingArea = findMatchingInterventionArea("district", selectedStateId, value)
                                  if (matchingArea) {
                                    form.setValue("interventionAreaId", matchingArea.id)
                                    const stateName = getUniqueStates().find(s => s.id === selectedStateId)?.name
                                    form.setValue("location", `${stateName} - ${selectedDistrict.name}`)
                                  }
                                }
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                              <SelectContent>
                                {getUniqueDistricts(selectedStateId).map((district) => (
                                  <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}

                        {/* Block Selection */}
                        {["blockName", "villageName"].includes(levelOfActivity) && selectedStateId && selectedDistrictId && (
                          <FormItem>
                            <FormLabel>Select Block *</FormLabel>
                            <Select
                              value={selectedBlockId}
                              onValueChange={(value) => {
                                setSelectedBlockId(value)
                                setSelectedVillageId('')

                                const selectedBlock = getUniqueBlocks(selectedStateId, selectedDistrictId).find(block => block.id === value)
                                if (selectedBlock && levelOfActivity === "blockName") {
                                  const matchingArea = findMatchingInterventionArea("blockName", selectedStateId, selectedDistrictId, value)
                                  if (matchingArea) {
                                    form.setValue("interventionAreaId", matchingArea.id)
                                    const stateName = getUniqueStates().find(s => s.id === selectedStateId)?.name
                                    const districtName = getUniqueDistricts(selectedStateId).find(d => d.id === selectedDistrictId)?.name
                                    form.setValue("location", `${stateName} - ${districtName} - ${selectedBlock.name}`)
                                  }
                                }
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select block" /></SelectTrigger>
                              <SelectContent>
                                {getUniqueBlocks(selectedStateId, selectedDistrictId).map((block) => (
                                  <SelectItem key={block.id} value={block.id}>{block.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}

                        {/* Village Selection */}
                        {levelOfActivity === "villageName" && selectedStateId && selectedDistrictId && selectedBlockId && (
                          <FormItem>
                            <FormLabel>Select Village *</FormLabel>
                            <Select
                              value={selectedVillageId}
                              onValueChange={(value) => {
                                setSelectedVillageId(value)
                                const selectedVillage = getUniqueVillages(selectedStateId, selectedDistrictId, selectedBlockId).find(v => v.id === value)
                                if (selectedVillage) {
                                  const matchingArea = findMatchingInterventionArea("villageName", selectedStateId, selectedDistrictId, selectedBlockId, value)
                                  if (matchingArea) {
                                    form.setValue("interventionAreaId", matchingArea.id)
                                    const stateName = getUniqueStates().find(s => s.id === selectedStateId)?.name
                                    const districtName = getUniqueDistricts(selectedStateId).find(d => d.id === selectedDistrictId)?.name
                                    const blockName = getUniqueBlocks(selectedStateId, selectedDistrictId).find(b => b.id === selectedBlockId)?.name
                                    form.setValue("location", `${stateName} - ${districtName} - ${blockName} - ${selectedVillage.name}`)
                                  }
                                }
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                              <SelectContent>
                                {getUniqueVillages(selectedStateId, selectedDistrictId, selectedBlockId).map((village) => (
                                  <SelectItem key={village.id} value={village.id}>{village.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specific Location</FormLabel>
                            <Input {...field} placeholder="Enter specific location" />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gpsCoordinates"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPS Coordinates</FormLabel>
                            <div className="flex space-x-2">
                              <Input {...field} placeholder="Format: lat,long" />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(
                                      (position) => {
                                        field.onChange(`${position.coords.latitude},${position.coords.longitude}`)
                                      },
                                      (error) => console.error("Error getting location:", error)
                                    )
                                  }
                                }}
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                {/* Units and People */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitReported"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Units Reported</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {report?.activity?.unitOfMeasure || "units"}
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfPeople"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of People (Optional)</FormLabel>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter number of people"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Leverage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Leverage Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="hasLeverage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Has leverage been mobilized?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasLeverage") && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="leverageGovt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Government Leverage (INR)</FormLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="leverageCsr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CSR Leverage (INR)</FormLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="leverageCommunity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Leverage (INR)</FormLabel>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="0"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Conditional sections based on report type */}
                {report?.type === "Training" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Training Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="trainingDateFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Training Start Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                  onChange={(e) => field.onChange(e.target.valueAsDate)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trainingDateTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Training End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                  onChange={(e) => field.onChange(e.target.valueAsDate)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        {/* ... PeopleBank Selection ... */}
                        {organization?.hasAccesstoPeopleBank && (
                          <div className="space-y-4">
                            {/* ... Checkbox and Logic ... */}
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id="usePeopleBank"
                                checked={usePeopleBank}
                                onCheckedChange={(checked) => setUsePeopleBank(checked as boolean)}
                              />
                              <Label htmlFor="usePeopleBank" className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Select participants from Youth Bank</span>
                              </Label>
                            </div>
                            {/* ... PeopleBank List ... */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Select Participants from Youth Bank</h4>
                                <div className="text-sm text-muted-foreground">
                                  {isLoadingPeopleBank ? 'Loading...' : `${peopleBank.length} people available`}
                                </div>
                              </div>

                              {isLoadingPeopleBank ? (
                                <div className="text-sm text-muted-foreground">Loading Youth Bank data...</div>
                              ) : peopleBank.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No people found in Youth Bank</div>
                              ) : (
                                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                  {peopleBank.map((person: any) => {
                                    const isSelected = participants.some(p => p.peopleBankId === person.id);
                                    return (
                                      <div key={person.id} className={`flex items-center space-x-2 p-2 rounded ${isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-muted'} ${!usePeopleBank ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                        <Checkbox
                                          id={`person-${person.id}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              const newParticipant: TrainingParticipant = {
                                                id: `${Date.now()}-${person.id}`,
                                                name: person.name,
                                                age: person.age,
                                                gender: person.gender,
                                                education: '',
                                                socialGroup: '',
                                                designation: '',
                                                organization: '',
                                                mobile: person.mobile || '',
                                                email: person.email || '',
                                                isPwd: false,
                                                peopleBankId: person.id
                                              };
                                              const updatedParticipants = [...participants, newParticipant];
                                              setParticipants(updatedParticipants);
                                              // Sync count
                                              form.setValue("numberOfPeople", updatedParticipants.length);

                                              if (!usePeopleBank) {
                                                toast.info('Youth Bank selection enabled');
                                                setUsePeopleBank(true);
                                              }
                                            } else {
                                              const updatedParticipants = participants.filter(p => p.peopleBankId !== person.id);
                                              setParticipants(updatedParticipants);
                                              // Sync count
                                              form.setValue("numberOfPeople", updatedParticipants.length);
                                            }
                                          }}
                                        />
                                        <Label htmlFor={`person-${person.id}`} className="flex-1 text-sm">
                                          <div className="font-medium">{person.name} {isSelected && <span className="text-xs text-blue-600">(Selected)</span>}</div>
                                          <div className="text-xs text-muted-foreground">
                                            Age: {person.age}, Gender: {person.gender}
                                            {person.mobile && `, Mobile: ${person.mobile}`}
                                          </div>
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Participants</h4>
                          <div className="text-sm text-muted-foreground">
                            {participants.length > 0 ? `${participants.length} participants added` : 'Adjust "Number of People" above to add participants'}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const currentCount = form.getValues("numberOfPeople") || 0;
                              form.setValue("numberOfPeople", currentCount + 1);
                            }}
                          >
                            Add Participant
                          </Button>
                        </div>

                        {participants.map((participant, index) => (
                          <div key={participant.id} className={`space-y-4 p-4 border rounded-lg ${participant.peopleBankId ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium">Participant {index + 1}{participant.peopleBankId && ' (From Youth Bank)'}</h5>
                              <div className="text-xs text-muted-foreground">
                                {participant.peopleBankId && ' (Pre-filled from Youth Bank)'}
                              </div>
                              {!participant.peopleBankId && (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="text-white"
                                  onClick={() => {
                                    const newParticipants = participants.filter((_, i) => i !== index);
                                    setParticipants(newParticipants);
                                    form.setValue("numberOfPeople", newParticipants.length);
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Name *</Label>
                                <Input
                                  value={participant.name}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].name = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter participant name"
                                  disabled={!!participant.peopleBankId}
                                />
                              </div>

                              <div>
                                <Label>Age *</Label>
                                <Input
                                  type="number"
                                  value={participant.age}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].age = parseInt(e.target.value);
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter age"
                                  disabled={!!participant.peopleBankId}
                                />
                              </div>

                              <div>
                                <Label>Gender *</Label>
                                <Select
                                  value={participant.gender}
                                  onValueChange={(value) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].gender = value;
                                    setParticipants(newParticipants);
                                  }}
                                  disabled={!!participant.peopleBankId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report?.type === "Infrastructure" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Infrastructure Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="infrastructureName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Infrastructure Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter infrastructure name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="WATER">Water Infrastructure</SelectItem>
                                  <SelectItem value="ROAD">Road Infrastructure</SelectItem>
                                  <SelectItem value="BUILDING">Building</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>

                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="workType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Type</FormLabel>
                              <Select onValueChange={field.onChange}
                                value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select work type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="new">New Construction</SelectItem>
                                  <SelectItem value="retrofitting">Retrofitting</SelectItem>
                                  <SelectItem value="restoration">Restoration</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/10">
                        <FormField
                          control={form.control}
                          name="dprApproved"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">DPR Approved</FormLabel>
                                <div className="text-xs text-muted-foreground">Detailed Project Report status</div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="approvedDesignFollowed"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Design Followed</FormLabel>
                                <div className="text-xs text-muted-foreground">Was approved design followed?</div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="designChangeDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Design Change Details</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter design change details if any"
                                className="resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sanctionBudget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sanction Budget (INR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expensesIncurred"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expenses Incurred (INR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="workDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe the work done"
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="benefits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Benefits</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe the benefits of this infrastructure"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 pt-4">
                        <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Evidence Photos</h4>

                        {/* Pre-Construction */}
                        <FormField
                          control={form.control}
                          name="preConstructionPhotos"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Pre-Construction Photos</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    {...field}
                                    value=""
                                    onChange={async (e) => {
                                      try {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) {
                                          const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/pre-construction");
                                          onChange([...(value || []), ...uploadedFiles]);
                                        }
                                      } catch (error) {
                                        toast.error("Failed to upload photos");
                                        console.error(error);
                                      }
                                    }}
                                  />
                                  {value && value.length > 0 && (
                                    <div className="grid grid-cols-3 gap-4">
                                      {value.map((file: any, index: number) => (
                                        <div key={index} className="relative group border rounded-md p-2">
                                          <div className="aspect-video w-full overflow-hidden rounded-md mb-2 bg-muted border">
                                            <img
                                              src={file.url}
                                              alt={file.originalName}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="text-xs truncate max-w-full pb-1">{file.originalName}</div>
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => {
                                                const newValue = [...value];
                                                newValue.splice(index, 1);
                                                onChange(newValue);
                                              }}
                                            >
                                              <span className="sr-only">Remove</span>
                                              &times;
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* During Construction */}
                        <FormField
                          control={form.control}
                          name="duringConstructionPhotos"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>During Construction Photos</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    {...field}
                                    value=""
                                    onChange={async (e) => {
                                      try {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) {
                                          const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/during-construction");
                                          onChange([...(value || []), ...uploadedFiles]);
                                        }
                                      } catch (error) {
                                        toast.error("Failed to upload photos");
                                        console.error(error);
                                      }
                                    }}
                                  />
                                  {value && value.length > 0 && (
                                    <div className="grid grid-cols-3 gap-4">
                                      {value.map((file: any, index: number) => (
                                        <div key={index} className="relative group border rounded-md p-2">
                                          <div className="aspect-video w-full overflow-hidden rounded-md mb-2 bg-muted border">
                                            <img
                                              src={file.url}
                                              alt={file.originalName}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="text-xs truncate max-w-full pb-1">{file.originalName}</div>
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => {
                                                const newValue = [...value];
                                                newValue.splice(index, 1);
                                                onChange(newValue);
                                              }}
                                            >
                                              <span className="sr-only">Remove</span>
                                              &times;
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Post Construction */}
                        <FormField
                          control={form.control}
                          name="postConstructionPhotos"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Post Construction Photos</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    {...field}
                                    value=""
                                    onChange={async (e) => {
                                      try {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) {
                                          const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/post-construction");
                                          onChange([...(value || []), ...uploadedFiles]);
                                        }
                                      } catch (error) {
                                        toast.error("Failed to upload photos");
                                        console.error(error);
                                      }
                                    }}
                                  />
                                  {value && value.length > 0 && (
                                    <div className="grid grid-cols-3 gap-4">
                                      {value.map((file: any, index: number) => (
                                        <div key={index} className="relative group border rounded-md p-2">
                                          <div className="aspect-video w-full overflow-hidden rounded-md mb-2 bg-muted border">
                                            <img
                                              src={file.url}
                                              alt={file.originalName}
                                              className="h-full w-full object-cover"
                                            />
                                          </div>
                                          <div className="text-xs truncate max-w-full pb-1">{file.originalName}</div>
                                          <div className="flex justify-end">
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={() => {
                                                const newValue = [...value];
                                                newValue.splice(index, 1);
                                                onChange(newValue);
                                              }}
                                            >
                                              <span className="sr-only">Remove</span>
                                              &times;
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report?.type === "Household" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Household Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="beneficiaryName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beneficiary Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter beneficiary name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Benefits Section */}
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Benefits Provided</h4>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBenefits([...benefits, {
                              id: Date.now().toString(),
                              name: '',
                              unitType: '',
                              reportedNumber: 0
                            }])}
                          >
                            Add Benefit
                          </Button>
                        </div>

                        {benefits.map((benefit, index) => (
                          <div key={benefit.id} className="space-y-4 p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <Label>Benefit Name</Label>
                                <Input
                                  value={benefit.name}
                                  onChange={(e) => {
                                    const newBenefits = [...benefits];
                                    newBenefits[index].name = e.target.value;
                                    setBenefits(newBenefits);
                                  }}
                                  placeholder="e.g., Nutritional Kit"
                                />
                              </div>

                              <div>
                                <Label>Unit Type</Label>
                                <Input
                                  value={benefit.unitType}
                                  onChange={(e) => {
                                    const newBenefits = [...benefits];
                                    newBenefits[index].unitType = e.target.value;
                                    setBenefits(newBenefits);
                                  }}
                                  placeholder="e.g., kg, INR"
                                />
                              </div>

                              <div>
                                <Label>Reported Number</Label>
                                <Input
                                  type="number"
                                  value={benefit.reportedNumber}
                                  onChange={(e) => {
                                    const newBenefits = [...benefits];
                                    newBenefits[index].reportedNumber = parseFloat(e.target.value);
                                    setBenefits(newBenefits);
                                  }}
                                  placeholder="Enter quantity"
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    const newBenefits = benefits.filter((_, i) => i !== index);
                                    setBenefits(newBenefits);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Report
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}