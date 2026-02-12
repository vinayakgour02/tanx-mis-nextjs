"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, MapPin, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

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

// Add these types at the top with other type definitions
type UploadedFile = {
  url: string;
  publicId: string;
  originalName: string;
};

// Update type definitions for benefits
type Benefit = {
  id: string;
  name: string;
  unitType: string;
  reportedNumber: number;
}

// Create dynamic form schema that changes based on activity type
const createFormSchema = (activityType?: string) => {
  return z.object({
    // Project and Activity Selection
    projectId: z.string().min(1, "Project is required"),
    interventionId: z.string().min(1, "Intervention is required"),
    subInterventionId: z.string().min(1, "Sub-intervention is required"),
    activityId: z.string().min(1, "Activity is required"),
    // Level of Activity
    levelofActivity: z.enum(["state", "district", "blockName", "villageName"], {
      required_error: "Level of activity is required",
    }),
    // Activity Date
    reportingDate: z.date({
      required_error: "Activity date is required",
    }),
    // Reporting Period
    reportingMonth: z.string().min(1, "Month is required"),
    reportingQuarter: z.string().min(1, "Quarter is required"),
    reportingYear: z.string().min(1, "Year is required"),
    // Location
    interventionAreaId: z.string().min(1, "Intervention area is required"),
    location: z.string().optional(),
    gpsCoordinates: z.string().optional(),
    // Units and People
    unitReported: z.number().min(0, "Unit reported must be positive"),
    numberOfPeople: activityType === "Training"
      ? z.number().min(1, "Number of people is required for training activities and must be at least 1")
      : z.number().optional(),
    // Leverage
    hasLeverage: z.boolean(),
    leverageSources: z.array(z.string()).optional(),
    leverageGovt: z.number().optional(),
    leverageCsr: z.number().optional(),
    leverageCommunity: z.number().optional(),
    // Attachments
    evidenceFiles: z.array(z.any()).default([]),
    reportFiles: z.array(z.any()).default([]),
    // Training Report Fields
    trainingDateFrom: activityType === "Training"
      ? z.date({ required_error: "Training start date is required" })
      : z.date().optional(),
    trainingDateTo: activityType === "Training"
      ? z.date({ required_error: "Training end date is required" })
      : z.date().optional(),
    // Infrastructure Report Fields
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
    // Household Report Fields
    beneficiaryName: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    socialGroup: z.string().optional(),
    maleMembers: z.number().optional(),
    femaleMembers: z.number().optional(),
    totalMembers: z.number().optional(),
  });
};

// Default schema for non-training activities
const formSchema = createFormSchema();

type FormValues = z.infer<typeof formSchema>;

interface CreateReportDialogProps {
  onReportCreated?: () => void;
  reportId?: string; // For edit mode
  mode?: 'create' | 'edit';
}

export function CreateReportDialog({ onReportCreated, reportId, mode = 'create' }: CreateReportDialogProps = {}) {
  const [open, setOpen] = useState(false)
  // Update the participants state initialization
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Organization and PeopleBank state
  const [organization, setOrganization] = useState<any>(null)
  const [peopleBank, setPeopleBank] = useState<any[]>([])
  const [usePeopleBank, setUsePeopleBank] = useState(false)

  // Hierarchical location selection state
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [selectedVillageId, setSelectedVillageId] = useState<string>('')

  // Helper functions for date and reporting period logic
  const getAvailableMonths = () => {
    const now = new Date()
    const currentMonth = now.getMonth() // 0-based (0 = January)
    const currentDay = now.getDate()

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    // If today is before the 7th of the month, show both previous and current month
    if (currentDay < 7) {
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
      return [
        months[previousMonth],
        months[currentMonth]
      ]
    }

    // Otherwise, only show current month
    return [months[currentMonth]]
  }

  // Helper function to get intervention area display based on level
  const getInterventionAreaDisplay = (area: any, level: string) => {
    switch (level) {
      case "state":
        return area.state?.name || area.state
      case "district":
        return `${area.state?.name || area.state} - ${area.district?.name || area.district}`
      case "blockName":
        return `${area.state?.name || area.state} - ${area.district?.name || area.district} - ${area.blockName?.name || area.blockName}`
      case "villageName":
        return `${area.state?.name || area.state} - ${area.district?.name || area.district} - ${area.blockName?.name || area.blockName} - ${area.villageName?.name || area.villageName} - ${area.gramPanchayat?.name || area.gramPanchayat}`
      default:
        return `${area.state?.name || area.state} - ${area.district?.name || area.district} - ${area.blockName?.name || area.blockName} - ${area.villageName?.name || area.villageName} - ${area.gramPanchayat?.name || area.gramPanchayat}`
    }
  }

  // Helper function to get unique states from intervention areas
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

  // Helper function to get unique districts for a selected state
  const getUniqueDistricts = (selectedStateId: string) => {
    if (!interventionAreas || interventionAreas.length === 0 || !selectedStateId) return []

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

  // Helper function to get unique blocks for a selected state and district
  const getUniqueBlocks = (selectedStateId: string, selectedDistrictId: string) => {
    if (!interventionAreas || interventionAreas.length === 0 || !selectedStateId || !selectedDistrictId) return []

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

  // Helper function to get unique villages for a selected state, district, and block
  const getUniqueVillages = (selectedStateId: string, selectedDistrictId: string, selectedBlockId: string) => {
    if (!interventionAreas || interventionAreas.length === 0 || !selectedStateId || !selectedDistrictId || !selectedBlockId) return []

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

  // Helper function to find intervention area based on selected location and level
  const findMatchingInterventionArea = (level: string, stateId?: string, districtId?: string, blockId?: string, villageId?: string) => {
    if (!interventionAreas || interventionAreas.length === 0) return null

    return interventionAreas.find((area: any) => {
      switch (level) {
        case "state":
          return (area.stateId || area.state?.id) === stateId
        case "district":
          return (area.stateId || area.state?.id) === stateId &&
            (area.districtId || area.district?.id) === districtId
        case "blockName":
          return (area.stateId || area.state?.id) === stateId &&
            (area.districtId || area.district?.id) === districtId &&
            (area.blockId || area.blockName?.id) === blockId
        case "villageName":
          return (area.stateId || area.state?.id) === stateId &&
            (area.districtId || area.district?.id) === districtId &&
            (area.blockId || area.blockName?.id) === blockId &&
            (area.villageId || area.villageName?.id) === villageId
        default:
          return false
      }
    })
  }



  const getQuarterFromMonth = (monthName: string) => {
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(monthName)

    // Financial year quarters: Apr-Jun=Q1, Jul-Sep=Q2, Oct-Dec=Q3, Jan-Mar=Q4
    if (monthIndex >= 3 && monthIndex <= 5) return "Q1" // April to June
    if (monthIndex >= 6 && monthIndex <= 8) return "Q2" // July to September
    if (monthIndex >= 9 && monthIndex <= 11) return "Q3" // October to December
    if (monthIndex >= 0 && monthIndex <= 2) return "Q4" // January to March
    return "Q1" // fallback
  }

  const getCurrentFinancialYear: any = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Financial year starts from April (month 3)
    // If current month is Jan-Mar, we're in the previous financial year
    if (currentMonth >= 3) {
      return `FY${(currentYear % 100).toString().padStart(2, '0')}`
    } else {
      return `FY${((currentYear - 1) % 100).toString().padStart(2, '0')}`
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // Type assertion needed due to complex form structure
    defaultValues: {
      projectId: "",
      interventionId: "",
      subInterventionId: "",
      activityId: "",
      levelofActivity: "state" as const,
      reportingDate: new Date(),
      reportingMonth: "",
      reportingQuarter: "",
      reportingYear: getCurrentFinancialYear(),
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

  const projectId = useWatch({ control: form.control, name: "projectId" })
  const interventionId = useWatch({ control: form.control, name: "interventionId" })
  const subInterventionId = useWatch({ control: form.control, name: "subInterventionId" })
  const activityId = useWatch({ control: form.control, name: "activityId" })
  const numberOfPeople = useWatch({ control: form.control, name: "numberOfPeople" })
  const levelOfActivity = useWatch({ control: form.control, name: "levelofActivity" })


  // Auto-set reporting quarter when month changes
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
    enabled: !!orgData?.hasAccesstoPeopleBank
  })

  // Update peopleBank state when data changes
  useEffect(() => {
    if (peopleBankData) {
      setPeopleBank(peopleBankData)
    }
  }, [peopleBankData])

  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      return response.json()
    },
  })

  // Fetch interventions for the selected project
  const { data: interventions, isLoading: isLoadingInterventions } = useQuery({
    queryKey: ["project-interventions", form.watch("projectId")],
    queryFn: async () => {
      const projectId = form.watch("projectId")
      if (!projectId) return []

      const response = await fetch(`/api/projects/${projectId}/interventions`)
      if (!response.ok) {
        throw new Error("Failed to fetch interventions")
      }
      return response.json()
    },
    enabled: !!projectId,
  })

  // Fetch sub-interventions for the selected intervention
  const { data: subInterventions, isLoading: isLoadingSubInterventions } = useQuery({
    queryKey: ["intervention-subinterventions", form.watch("projectId"), form.watch("interventionId")],
    queryFn: async () => {
      const projectId = form.watch("projectId")
      const interventionId = form.watch("interventionId")
      if (!projectId || !interventionId) return []

      const response = await fetch(`/api/projects/${projectId}/interventions/${interventionId}/sub-interventions`)
      if (!response.ok) {
        throw new Error("Failed to fetch sub-interventions")
      }
      return response.json()
    },
    enabled: !!(projectId && interventionId),
  })

  // Fetch activities for the selected sub-intervention
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["subintervention-activities", form.watch("projectId"), form.watch("interventionId"), form.watch("subInterventionId")],
    queryFn: async () => {
      const projectId = form.watch("projectId")
      const interventionId = form.watch("interventionId")
      const subInterventionId = form.watch("subInterventionId")

      if (!projectId || !interventionId || !subInterventionId) return []

      const response = await fetch(`/api/projects/${projectId}/activities?interventionId=${interventionId}&subInterventionId=${subInterventionId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch activities")
      }
      return response.json()
    },
    enabled: !!(projectId && interventionId && subInterventionId),
  })

  // Fetch intervention areas based on selected project
  const { data: interventionAreas, isLoading: isLoadingInterventionAreas } = useQuery({
    queryKey: ["interventionAreas", form.watch("projectId")],
    queryFn: async () => {
      const projectId = form.watch("projectId")
      if (!projectId) return []

      const response = await fetch(`/api/projects/${projectId}/intervention-areas`)
      if (!response.ok) {
        throw new Error("Failed to fetch intervention areas")
      }
      return response.json()
    },
    enabled: !!projectId,
  })

  // Get selected activity details
  const selectedActivity = activities?.find((activity: any) => activity.id === form.watch("activityId"))

  useEffect(() => {
    if (!projectId) return

    form.setValue("interventionId", "")
    form.setValue("subInterventionId", "")
    form.setValue("activityId", "")
  }, [projectId])


  useEffect(() => {
    if (!interventionId) return

    form.setValue("subInterventionId", "")
    form.setValue("activityId", "")
  }, [interventionId])


  useEffect(() => {
    if (!subInterventionId) return

    form.setValue("activityId", "")
  }, [subInterventionId])

  useEffect(() => {
    if (selectedActivity?.type !== "Training") {
      setParticipants([])
      return
    }

    if (!numberOfPeople || numberOfPeople < 1) {
      setParticipants([])
      return
    }

    setParticipants((prev) => {
      if (prev.length === numberOfPeople) return prev

      // Add
      if (prev.length < numberOfPeople) {
        const extra = Array.from(
          { length: numberOfPeople - prev.length },
          (_, i) => ({
            id: `${Date.now()}-${i}`,
            name: "",
            age: 0,
            gender: "",
            education: "",
            socialGroup: "",
            designation: "",
            organization: "",
            mobile: "",
            email: "",
            isPwd: false,
          })
        )

        return [...prev, ...extra]
      }

      // Remove
      return prev.slice(0, numberOfPeople)
    })
  }, [numberOfPeople, selectedActivity?.type])



  // Reset intervention area and location state when level of activity changes
  React.useEffect(() => {
    form.setValue("interventionAreaId", "")
    form.setValue("location", "")
    setSelectedStateId('')
    setSelectedDistrictId('')
    setSelectedBlockId('')
    setSelectedVillageId('')
  }, [levelOfActivity])

  // Reset dependent location selections when higher level changes
  React.useEffect(() => {
    if (selectedStateId) {
      setSelectedDistrictId('')
      setSelectedBlockId('')
      setSelectedVillageId('')
    }
  }, [selectedStateId])

  React.useEffect(() => {
    if (selectedDistrictId) {
      setSelectedBlockId('')
      setSelectedVillageId('')
    }
  }, [selectedDistrictId])

  React.useEffect(() => {
    if (selectedBlockId) {
      setSelectedVillageId('')
    }
  }, [selectedBlockId])

  // Handle PeopleBank toggle
  useEffect(() => {
    const current = form.getValues("numberOfPeople")

    if (current !== participants.length) {
      form.setValue("numberOfPeople", participants.length)
    }
  }, [participants.length])


  const resetDialogState = () => {
    setParticipants([])
    setBenefits([])
    setError(null)
    setSelectedStateId('')
    setSelectedDistrictId('')
    setSelectedBlockId('')
    setSelectedVillageId('')
    setOrganization(null)
    setPeopleBank([])
    setUsePeopleBank(false)
    form.reset({
      projectId: "",
      interventionId: "",
      subInterventionId: "",
      activityId: "",
      levelofActivity: "state" as const,
      reportingDate: new Date(),
      reportingMonth: "",
      reportingQuarter: "",
      reportingYear: getCurrentFinancialYear(),
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
    })
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      // Validation for Training activities
      if (selectedActivity?.type === "Training") {
        const numberOfPeople = data.numberOfPeople || 0
        if (numberOfPeople < 1) {
          setError("Number of people is required for training activities and must be at least 1.")
          setIsLoading(false)
          return
        }

        if (!data.trainingDateFrom || !data.trainingDateTo) {
          setError("Training start date and end date are required for training activities.")
          setIsLoading(false)
          return
        }

        // When using PeopleBank, we still need to validate that we have the correct number of participants
        // The difference is that PeopleBank participants are pre-filled, while manual participants need to be completed
        if (participants.length !== numberOfPeople) {
          setError(`You must provide details for exactly ${numberOfPeople} participants. Currently you have ${participants.length} participants.`)
          setIsLoading(false)
          return
        }

        const incompleteParticipants = participants.filter(p => (!p.name || !p.age || !p.gender) && !p.peopleBankId)
        if (incompleteParticipants.length > 0) {
          setError(`Please fill in all required fields (Name, Age, Gender) for all ${numberOfPeople} participants.`)
          setIsLoading(false)
          return
        }
      }
      // Upload evidence files
      const evidenceUploads = await Promise.all(
        (data.evidenceFiles || []).map(async (file: File) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", "reports/evidence")

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload evidence file")
          }

          return response.json()
        }),
      )

      // Upload report files
      const reportUploads = await Promise.all(
        (data.reportFiles || []).map(async (file: File) => {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", "reports/attendance")

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload report file")
          }

          return response.json()
        }),
      )

      // Prepare participants data for training reports
      const participantsData = selectedActivity?.type === "Training" && participants.length > 0
        ? participants.filter(p => p.name && p.age && p.gender) // Only include participants with required fields
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

      // Create report with file URLs and benefits
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          type: selectedActivity?.type || "OTHER",
          unitType: selectedActivity?.unitOfMeasure,
          status: "DRAFT",
          interventionId: data.interventionId,
          subInterventionId: data.subInterventionId,
          levelofActivity: data.levelofActivity, // Add this field
          attachments: [
            ...evidenceUploads.map((upload) => ({
              type: "EVIDENCE",
              url: upload.url,
              filename: upload.publicId,
              originalName: upload.originalName,
            })),
            ...reportUploads.map((upload) => ({
              type: "REPORT",
              url: upload.url,
              filename: upload.publicId,
              originalName: upload.originalName,
            })),
          ],
          // Add participants if it's a training report
          ...(selectedActivity?.type === "Training" && participantsData.length > 0 && {
            participants: participantsData,
          }),
          // Add infrastructure details if it's an infrastructure report
          ...(selectedActivity?.type === "Infrastructure" && {
            infrastructureReport: {
              create: {
                infrastructureName: data.infrastructureName,
                category: data.category,
                workType: data.workType,
                dprApproved: data.dprApproved,
                approvedDesignFollowed: data.approvedDesignFollowed,
                designChangeDetails: data.designChangeDetails,
                sanctionBudget: data.sanctionBudget,
                expensesIncurred: data.expensesIncurred,
                workDescription: data.workDescription,
                benefits: data.benefits,
                preConstructionPhotos: JSON.stringify(data.preConstructionPhotos),
                duringConstructionPhotos: JSON.stringify(data.duringConstructionPhotos),
                postConstructionPhotos: JSON.stringify(data.postConstructionPhotos),
                infrastructureUniqueId: `INF-${Date.now()}`,
              },
            },
          }),
          // Add household details if it's a household report
          ...(selectedActivity?.type === "Household" && {
            householdReport: {
              create: {
                beneficiaryName: data.beneficiaryName,
                age: data.age,
                gender: data.gender,
                socialGroup: data.socialGroup,
                maleMembers: data.maleMembers,
                femaleMembers: data.femaleMembers,
                totalMembers: data.totalMembers,
                benefits: {
                  create: benefits.map(benefit => ({
                    benefitType: {
                      create: {
                        name: benefit.name,
                        unitType: benefit.unitType
                      }
                    },
                    reportedNumber: benefit.reportedNumber
                  }))
                }
              },
            },
          }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create report")
      }

      const createdReport = await response.json()

      // Show success message
      const participantCount = selectedActivity?.type === "Training" ? participantsData.length : 0
      toast.success("Report created successfully!", {
        description: selectedActivity?.type === "Training" && participantCount > 0
          ? `Training report saved with ${participantCount} participant${participantCount !== 1 ? 's' : ''}.`
          : `${selectedActivity?.type || "Activity"} report has been saved.`
      })

      // Reset dialog state
      resetDialogState()
      setOpen(false)

      // Trigger parent callback to refresh data
      if (onReportCreated) {
        onReportCreated()
      }
    } catch (err) {
      console.error("Error creating report:", err)
      setError(err instanceof Error ? err.message : "An error occurred while creating the report")
      toast.error("Failed to create report", {
        description: err instanceof Error ? err.message : "An unexpected error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetDialogState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add/Update Progress</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add/Update'} Progress</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project and Activity Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project & Activity</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[20rem]">
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingProjects ? (
                              <SelectItem value="loading" disabled>
                                Loading projects...
                              </SelectItem>
                            ) : (
                              projects?.map((project: any) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interventionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervention</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch("projectId")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select intervention" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {!form.watch("projectId") ? (
                              <SelectItem value="none" disabled>
                                Select a project first
                              </SelectItem>
                            ) : isLoadingInterventions ? (
                              <SelectItem value="loading" disabled>
                                Loading interventions...
                              </SelectItem>
                            ) : interventions?.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No interventions available
                              </SelectItem>
                            ) : (
                              interventions?.map((intervention: any) => (
                                <SelectItem key={intervention.id} value={intervention.id}>
                                  {intervention.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subInterventionId"
                    render={({ field }) => (
                      <FormItem >
                        <FormLabel>Sub-intervention</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch("interventionId")}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[50%]">
                              <SelectValue placeholder="Select sub-intervention" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-[50%]">
                            {!form.watch("interventionId") ? (
                              <SelectItem value="none" disabled>
                                Select an intervention first
                              </SelectItem>
                            ) : isLoadingSubInterventions ? (
                              <SelectItem value="loading" disabled>
                                Loading sub-interventions...
                              </SelectItem>
                            ) : subInterventions?.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No sub-interventions available
                              </SelectItem>
                            ) : (
                              subInterventions?.map((subIntervention: any) => (
                                <SelectItem key={subIntervention.id} value={subIntervention.id}>
                                  {subIntervention.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!form.watch("subInterventionId")}
                        >
                          <FormControl>
                            <SelectTrigger >
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-48">
                            {!form.watch("subInterventionId") ? (
                              <SelectItem value="none" disabled>
                                Select intervention and sub-intervention first
                              </SelectItem>
                            ) : isLoadingActivities ? (
                              <SelectItem value="loading" disabled>
                                Loading activities...
                              </SelectItem>
                            ) : !activities?.length ? (
                              <SelectItem value="none" disabled>
                                No activities available
                              </SelectItem>
                            ) : (
                              activities.map((activity: any) => (
                                <SelectItem key={activity.id} value={activity.id}>
                                  {activity.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {/* Show activity type if available */}
                        {selectedActivity && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Activity Type:</span> {selectedActivity.type}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Activity Date */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Date of Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="reportingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                            onChange={(e) => field.onChange(e.target.valueAsDate)}
                            max={new Date().toISOString().split('T')[0]} // Prevent future dates
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Reporting Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reporting Period</CardTitle>
                  <div className="text-sm text-muted-foreground mt-2">
                    {getAvailableMonths().length > 1 ? (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertDescription>
                          Since today is before the 7th of the month, you can report for either the previous month or current month.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription>
                          Reporting for the current month only.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reportingMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Month</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted">
                              {field.value}
                            </div>
                          </div>
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row gap-4 space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="state" id="state" />
                              <Label htmlFor="state">State Level</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="district" id="district" />
                              <Label htmlFor="district">District Level</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="blockName" id="blockName" />
                              <Label htmlFor="blockName">Block Level</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="villageName" id="villageName" />
                              <Label htmlFor="villageName">Village Level</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Hierarchical Location Selection based on Level */}
                  {form.watch("levelofActivity") && (
                    <div className="space-y-4">
                      {/* State Selection - Always shown first */}
                      <FormItem>
                        <FormLabel>Select State *</FormLabel>
                        <Select
                          value={selectedStateId}
                          onValueChange={(value) => {
                            setSelectedStateId(value)
                            const selectedState = getUniqueStates().find(state => state.id === value)
                            if (selectedState && form.watch("levelofActivity") === "state") {
                              // Find the intervention area for this state
                              const matchingArea = findMatchingInterventionArea("state", value)
                              if (matchingArea) {
                                form.setValue("interventionAreaId", matchingArea.id)
                                form.setValue("location", selectedState.name)
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingInterventionAreas ? (
                              <SelectItem value="loading" disabled>
                                Loading states...
                              </SelectItem>
                            ) : getUniqueStates().length === 0 ? (
                              <SelectItem value="none" disabled>
                                No states available
                              </SelectItem>
                            ) : (
                              getUniqueStates().map((state) => (
                                <SelectItem key={state.id} value={state.id}>
                                  {state.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormItem>

                      {/* District Selection - Shown for district, block, and village levels */}
                      {["district", "blockName", "villageName"].includes(form.watch("levelofActivity")) && selectedStateId && (
                        <FormItem>
                          <FormLabel>Select District *</FormLabel>
                          <Select
                            value={selectedDistrictId}
                            onValueChange={(value) => {
                              setSelectedDistrictId(value)
                              const selectedDistrict = getUniqueDistricts(selectedStateId).find(district => district.id === value)
                              if (selectedDistrict && form.watch("levelofActivity") === "district") {
                                // Find the intervention area for this state and district
                                const matchingArea = findMatchingInterventionArea("district", selectedStateId, value)
                                if (matchingArea) {
                                  form.setValue("interventionAreaId", matchingArea.id)
                                  const stateName = getUniqueStates().find(s => s.id === selectedStateId)?.name
                                  form.setValue("location", `${stateName} - ${selectedDistrict.name}`)
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select district" />
                            </SelectTrigger>
                            <SelectContent>
                              {getUniqueDistricts(selectedStateId).length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No districts available
                                </SelectItem>
                              ) : (
                                getUniqueDistricts(selectedStateId).map((district) => (
                                  <SelectItem key={district.id} value={district.id}>
                                    {district.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}

                      {/* Block Selection - Shown for block and village levels */}
                      {["blockName", "villageName"].includes(form.watch("levelofActivity")) && selectedStateId && selectedDistrictId && (
                        <FormItem>
                          <FormLabel>Select Block *</FormLabel>
                          <Select
                            value={selectedBlockId}
                            onValueChange={(value) => {
                              setSelectedBlockId(value)
                              const selectedBlock = getUniqueBlocks(selectedStateId, selectedDistrictId).find(block => block.id === value)
                              if (selectedBlock && form.watch("levelofActivity") === "blockName") {
                                // Find the intervention area for this state, district, and block
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select block" />
                            </SelectTrigger>
                            <SelectContent>
                              {getUniqueBlocks(selectedStateId, selectedDistrictId).length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No blocks available
                                </SelectItem>
                              ) : (
                                getUniqueBlocks(selectedStateId, selectedDistrictId).map((block) => (
                                  <SelectItem key={block.id} value={block.id}>
                                    {block.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}

                      {/* Village Selection - Shown only for village level */}
                      {form.watch("levelofActivity") === "villageName" && selectedStateId && selectedDistrictId && selectedBlockId && (
                        <FormItem>
                          <FormLabel>Select Village *</FormLabel>
                          <Select
                            value={selectedVillageId}
                            onValueChange={(value) => {
                              setSelectedVillageId(value)
                              const selectedVillage = getUniqueVillages(selectedStateId, selectedDistrictId, selectedBlockId).find(v => v.id === value)
                              if (selectedVillage) {
                                // Find the intervention area for this state, district, block, and village
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select village" />
                            </SelectTrigger>
                            <SelectContent>
                              {getUniqueVillages(selectedStateId, selectedDistrictId, selectedBlockId).length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No villages available
                                </SelectItem>
                              ) : (
                                getUniqueVillages(selectedStateId, selectedDistrictId, selectedBlockId).map((village) => (
                                  <SelectItem key={village.id} value={village.id}>
                                    {village.name}
                                  </SelectItem>
                                ))
                              )}
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
                            <Input {...field} placeholder="Format: lat,long (e.g., 12.9716,77.5946)" />
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
                                    (error) => {
                                      console.error("Error getting location:", error)
                                    },
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
                            {selectedActivity?.unitOfMeasure || "units"}
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
                        <FormLabel>
                          Number of People {selectedActivity?.type === "Training" ? "*" : "(Optional)"}
                        </FormLabel>
                        <Input
                          type="number"
                          {...field}
                          min={selectedActivity?.type === "Training" ? 1 : 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || (selectedActivity?.type === "Training" ? 1 : 0)
                            field.onChange(value)
                          }}
                          placeholder={selectedActivity?.type === "Training" ? "Enter number of participants (minimum 1)" : "Enter number of people"}
                        />
                        {selectedActivity?.type === "Training" && (
                          <div className="text-sm text-muted-foreground">
                            For training activities, you must specify the number of participants and provide their details.
                          </div>
                        )}
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

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Evidence/Means of Verification</Label>
                    <FormField
                      control={form.control}
                      name="evidenceFiles"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                field.onChange(files)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Activity Report/Attendance</Label>
                    <FormField
                      control={form.control}
                      name="reportFiles"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                field.onChange(files)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Add conditional rendering based on activity type */}
              {selectedActivity?.type === "Training" && (
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
                            <FormLabel>Training Start Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                onChange={(e) => field.onChange(e.target.valueAsDate)}
                                max={new Date().toISOString().split('T')[0]} // Prevent future dates
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
                            <FormLabel>Training End Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                onChange={(e) => field.onChange(e.target.valueAsDate)}
                                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* PeopleBank selection for organizations with access */}
                    {organization?.hasAccesstoPeopleBank && (
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
                    )}

                    {usePeopleBank && organization?.hasAccesstoPeopleBank && (
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
                            {peopleBank.map((person: any) => (
                              <div key={person.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                                <Checkbox
                                  id={`person-${person.id}`}
                                  checked={participants.some(p => p.peopleBankId === person.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Add person to participants
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

                                      // Update the numberOfPeople field in the form to match the participants count
                                      form.setValue("numberOfPeople", updatedParticipants.length);
                                    } else {
                                      // Remove person from participants
                                      const updatedParticipants = participants.filter(p => p.peopleBankId !== person.id);
                                      setParticipants(updatedParticipants);

                                      // Update the numberOfPeople field in the form to match the participants count
                                      form.setValue("numberOfPeople", updatedParticipants.length);
                                    }
                                  }}
                                />
                                <Label htmlFor={`person-${person.id}`} className="flex-1 text-sm">
                                  <div className="font-medium">{person.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Age: {person.age}, Gender: {person.gender}
                                    {person.mobile && `, Mobile: ${person.mobile}`}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Participants</h4>
                        <div className="text-sm text-muted-foreground">
                          {form.watch("numberOfPeople") ? (
                            `${participants.length} of ${form.watch("numberOfPeople")} participants added`
                          ) : (
                            "Set number of people above to add participants"
                          )}
                        </div>
                      </div>

                      {!form.watch("numberOfPeople") && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          Please specify the "Number of People" above to add participant details.
                        </div>
                      )}

                      {form.watch("numberOfPeople") && participants.length === 0 && (
                        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          Participant slots will be automatically created based on the number of people specified above.
                        </div>
                      )}

                      {participants.length > 0 && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                          Please fill in the required details for all {form.watch("numberOfPeople")} participants below.
                        </div>
                      )}

                      {participants.map((participant, index) => (
                        <div key={participant.id} className="space-y-4 p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium">Participant {index + 1}{participant.peopleBankId && ' (From Youth Bank)'}</h5>
                            <div className="text-xs text-muted-foreground">
                              Required fields: Name, Age, Gender
                              {participant.peopleBankId && ' (Pre-filled from Youth Bank)'}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
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
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Age *</FormLabel>
                              <FormControl>
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
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select
                                value={participant.gender}
                                onValueChange={(value) => {
                                  const newParticipants = [...participants];
                                  newParticipants[index].gender = value;
                                  setParticipants(newParticipants);
                                }}
                                disabled={!!participant.peopleBankId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Education</FormLabel>
                              <FormControl>
                                <Input
                                  value={participant.education}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].education = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter education"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Social Group</FormLabel>
                              <Select
                                value={participant.socialGroup}
                                onValueChange={(value) => {
                                  const newParticipants = [...participants];
                                  newParticipants[index].socialGroup = value;
                                  setParticipants(newParticipants);
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select social group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SC">SC</SelectItem>
                                  <SelectItem value="ST">ST</SelectItem>
                                  <SelectItem value="OBC">OBC</SelectItem>
                                  <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Designation</FormLabel>
                              <FormControl>
                                <Input
                                  value={participant.designation}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].designation = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter designation"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Organization</FormLabel>
                              <FormControl>
                                <Input
                                  value={participant.organization}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].organization = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter organization"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Mobile</FormLabel>
                              <FormControl>
                                <Input
                                  value={participant.mobile}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].mobile = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter mobile number"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  value={participant.email}
                                  onChange={(e) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].email = e.target.value;
                                    setParticipants(newParticipants);
                                  }}
                                  placeholder="Enter email"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormLabel>Person with Disability</FormLabel>
                                <Switch
                                  checked={participant.isPwd}
                                  onCheckedChange={(checked) => {
                                    const newParticipants = [...participants];
                                    newParticipants[index].isPwd = checked;
                                    setParticipants(newParticipants);
                                  }}
                                />
                              </div>
                            </FormItem>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedActivity?.type === "Infrastructure" && (
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

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dprApproved"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">DPR Approved</FormLabel>
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
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Approved Design Followed</FormLabel>
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
                            <Textarea {...field} placeholder="Enter design change details if any" />
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
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                            <Textarea {...field} placeholder="Describe the work done" />
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
                            <Textarea {...field} placeholder="Describe the benefits of this infrastructure" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                  onChange={async (e) => {
                                    try {
                                      const files = Array.from(e.target.files || []);
                                      const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/pre-construction");
                                      onChange(uploadedFiles);
                                    } catch (error) {
                                      toast.error("Failed to upload pre-construction photos");
                                      console.error(error);
                                    }
                                  }}
                                />
                                {value && value.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {value.map((file) => (
                                      <div key={file.publicId} className="text-sm text-muted-foreground">
                                        {file.originalName}
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
                                  onChange={async (e) => {
                                    try {
                                      const files = Array.from(e.target.files || []);
                                      const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/during-construction");
                                      onChange(uploadedFiles);
                                    } catch (error) {
                                      toast.error("Failed to upload during-construction photos");
                                      console.error(error);
                                    }
                                  }}
                                />
                                {value && value.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {value.map((file) => (
                                      <div key={file.publicId} className="text-sm text-muted-foreground">
                                        {file.originalName}
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
                                  onChange={async (e) => {
                                    try {
                                      const files = Array.from(e.target.files || []);
                                      const uploadedFiles = await handleFileUpload(files, "reports/infrastructure/post-construction");
                                      onChange(uploadedFiles);
                                    } catch (error) {
                                      toast.error("Failed to upload post-construction photos");
                                      console.error(error);
                                    }
                                  }}
                                />
                                {value && value.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {value.map((file) => (
                                      <div key={file.publicId} className="text-sm text-muted-foreground">
                                        {file.originalName}
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

              {selectedActivity?.type === "Household" && (
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

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Social Group</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select social group" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                                <SelectItem value="OBC">OBC</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maleMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Male Members</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="femaleMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Female Members</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalMembers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Members</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </div>

                    {/* Updated Benefits Section */}
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
                            <FormItem>
                              <FormLabel>Benefit Name</FormLabel>
                              <FormControl>
                                <Input
                                  value={benefit.name}
                                  onChange={(e) => {
                                    const newBenefits = [...benefits];
                                    newBenefits[index].name = e.target.value;
                                    setBenefits(newBenefits);
                                  }}
                                  placeholder="e.g., Nutritional Kit, Cash Support"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>Unit Type</FormLabel>
                              <FormControl>
                                <Input
                                  value={benefit.unitType}
                                  onChange={(e) => {
                                    const newBenefits = [...benefits];
                                    newBenefits[index].unitType = e.target.value;
                                    setBenefits(newBenefits);
                                  }}
                                  placeholder="e.g., kg, liters, INR"
                                />
                              </FormControl>
                            </FormItem>

                            <FormItem>
                              <FormLabel>⁠Reported number</FormLabel>
                              <FormControl>
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
                              </FormControl>
                              <FormMessage />
                            </FormItem>

                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                className="cursor-pointer text-white"
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
                  {mode === 'edit' ? 'Update' : 'Submit'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
