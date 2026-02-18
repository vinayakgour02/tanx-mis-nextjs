"use client"

import { useState } from "react"
import {
  Eye,
  MapPin,
  Calendar,
  Users,
  Target,
  FileText,
  Download,
  ExternalLink,
  Building,
  DollarSign,
  IndianRupee,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type ViewReportDialogProps = {
  reportId: string
}

const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) { // 1 Crore
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) { // 1 Lakh
    return `₹${(amount / 100000).toFixed(2)} L`
  } else {
    return `₹${amount.toLocaleString('en-IN')}`
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-800 border-green-200"
    case "APPROVED":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getFileIcon = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "pdf":
      return "📄"
    case "doc":
    case "docx":
      return "📝"
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "🖼️"
    default:
      return "📎"
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>

      {/* Cards skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ViewReportDialog({ reportId }: ViewReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const queryClient = useQueryClient()


  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch report details")
      }
      return response.json()
    },
    enabled: open, // Only fetch when dialog is open
  })



  console.log(report)

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reports/${id}/approve`, {
        method: "PUT",
      })
      if (!response.ok) throw new Error("Failed to approve report")
    },
    onSuccess: () => {
      toast.success("Report approved successfully")
      queryClient.invalidateQueries({ queryKey: ["report", reportId] } as any);
    },
  })

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const response = await fetch(`/api/reports/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      })
      if (!response.ok) throw new Error("Failed to reject report")
    },
    onSuccess: () => {
      toast.success("Report rejected successfully")
      queryClient.invalidateQueries({ queryKey: ["report", reportId] } as any);
      setRejectModalOpen(false)
      setRejectComment("")
    },
  })

  const approveReport = (id: string) => {
    approveMutation.mutate(id)
  }
  const submitRejection = (id: string) => {
    if (!rejectComment.trim()) {
      toast.error("Please provide a rejection comment")
      return
    }
    rejectMutation.mutate({ id, comment: rejectComment })
  }


  const openInMaps = (coordinates: string) => {
    const [lat, lng] = coordinates.split(",")
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
  }

  const totalLeverage = report
    ? (Number(report.leverageGovt) || 0) + (Number(report.leverageCsr) || 0) + (Number(report.leverageCommunity) || 0)
    : 0

  // Determine the effective activity/report type
  const effectiveType = report?.activity?.type || report?.type || "OTHER"

  // Helpers to parse infrastructure photo fields which are stored as JSON strings
  const parsePhotos = (photosField?: string) => {
    if (!photosField) return [] as Array<{ url: string; publicId?: string; originalName?: string }>
    try {
      const parsed = JSON.parse(photosField)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-blue-50">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load report details"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : report ? (
            <div className="space-y-6">
              {/* Status and Key Info Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div>
                  <h3 className="font-semibold text-lg">{report.activity?.name}</h3>
                  <p className="text-sm text-muted-foreground">{report.project?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {effectiveType && <Badge variant="outline">{effectiveType}</Badge>}
                  <Badge className={getStatusColor(report.status)}>{String(report.status).replace("_", " ")}</Badge>
                </div>
              </div>

              {/* --- Approve / Reject Buttons --- */}
              <div className="flex justify-end gap-3 mt-2">
                {/* Approve button */}
                {report.status !== "APPROVED" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => approveReport(report.id)}
                  >
                    Approve Report
                  </Button>
                )}

                {/* Reject button */}
                {report.status !== "REJECTED" && (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Reject Report
                  </Button>
                )}
              </div>


              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Units Reported</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">{report.unitReported}</span>
                      <span className="text-sm text-muted-foreground ml-1">{report.activity?.unitOfMeasure}</span>
                    </div>
                  </CardContent>
                </Card>

                {report.numberOfPeople != null && (
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">People Reached</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">{report.numberOfPeople}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {totalLeverage > 0 && (
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Total Leverage</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold">₹{totalLeverage.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="h-4 w-4" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Project</span>
                      <p className="text-sm font-medium">{report.project?.name || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Intervention</span>
                      <p className="text-sm font-medium">{report.activity?.Intervention?.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Sub-intervention</span>
                      <p className="text-sm font-medium">{report.activity?.subInterventionRel?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reporting Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Reporting Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">Date</span>
                      <p className="text-sm font-semibold">{format(new Date(report.reportingDate), "PPP")}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">Month</span>
                      <p className="text-sm font-semibold">{report.reportingMonth}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">Quarter</span>
                      <p className="text-sm font-semibold">{report.reportingQuarter}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-center">
                      <span className="text-sm font-medium text-muted-foreground">Year</span>
                      <p className="text-sm font-semibold">{report.reportingYear}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    Location Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Intervention Area</span>
                      <p className="text-sm font-medium">
                        {report.interventionArea?.villageName?.name || 'N/A'}, {report.interventionArea?.blockName?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.interventionArea?.district?.name || 'N/A'}, {report.interventionArea?.state?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Specific Location</span>
                      <p className="text-sm font-medium">{report.landscape}</p>
                    </div>
                  </div>

                  {report.gpsCoordinates && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">GPS Coordinates</span>
                        <p className="text-sm font-mono">{report.gpsCoordinates}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInMaps(report.gpsCoordinates)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Maps
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conditional: Training Details */}
              {report.trainingReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      Training Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Start Date</span>
                        <p className="text-sm font-medium">{format(new Date(report.trainingReport.dateFrom), "PPP")}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">End Date</span>
                        <p className="text-sm font-medium">{format(new Date(report.trainingReport.dateTo), "PPP")}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Participants</span>
                        <p className="text-sm font-medium">{report.trainingReport.participants?.length || 0}</p>
                      </div>
                    </div>

                    {report.trainingReport.participants?.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Participants Details</div>
                          <Badge variant="secondary" className="text-xs">
                            {report.trainingReport.participants.length} Participant{report.trainingReport.participants.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {report.trainingReport.participants.map((participant: any, index: number) => (
                            <Card key={participant.id} className="border-l-4 border-l-blue-400">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <h4 className="font-semibold text-sm">
                                      {participant.name || 'Participant ' + (index + 1)}
                                    </h4>
                                    {participant.isPwd && (
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        PWD
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {participant.gender || 'Not specified'}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personal Info</span>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-muted-foreground">Age:</span>
                                        <span className="ml-1 font-medium">{participant.age || '-'} years</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Social Group:</span>
                                        <span className="ml-1 font-medium">{participant.socialGroup || '-'}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Education:</span>
                                        <span className="ml-1 font-medium">{participant.education || '-'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Professional</span>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-muted-foreground">Organization:</span>
                                        <div className="font-medium break-words">{participant.organization || '-'}</div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Designation:</span>
                                        <div className="font-medium break-words">{participant.designation || '-'}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Info</span>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-muted-foreground">Mobile:</span>
                                        <div className="font-medium font-mono text-sm">
                                          {participant.mobile ? (
                                            <a
                                              href={`tel:${participant.mobile}`}
                                              className="text-blue-600 hover:underline"
                                            >
                                              {participant.mobile}
                                            </a>
                                          ) : '-'}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <div className="font-medium text-sm break-all">
                                          {participant.email ? (
                                            <a
                                              href={`mailto:${participant.email}`}
                                              className="text-blue-600 hover:underline"
                                            >
                                              {participant.email}
                                            </a>
                                          ) : '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1 md:col-span-3 lg:col-span-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Additional</span>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Person with Disability:</span>
                                        <Badge
                                          variant={participant.isPwd ? "default" : "outline"}
                                          className={`text-xs ${participant.isPwd
                                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                                            : 'bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                          {participant.isPwd ? 'Yes' : 'No'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Participants Summary */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 mb-2">Participants Summary</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-blue-700">Total:</span>
                              <span className="ml-1 font-semibold">{report.trainingReport.participants.length}</span>
                            </div>
                            <div>
                              <span className="text-blue-700">Male:</span>
                              <span className="ml-1 font-semibold">
                                {report.trainingReport.participants.filter((p: any) => p.gender === 'Male').length}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Female:</span>
                              <span className="ml-1 font-semibold">
                                {report.trainingReport.participants.filter((p: any) => p.gender === 'Female').length}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">PWD:</span>
                              <span className="ml-1 font-semibold">
                                {report.trainingReport.participants.filter((p: any) => p.isPwd).length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No participants recorded for this training</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Conditional: Infrastructure Details */}
              {report.infrastructureReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-4 w-4" />
                      Infrastructure Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Name</span>
                        <p className="text-sm font-medium">{report.infrastructureReport.infrastructureName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Category</span>
                        <p className="text-sm font-medium">{report.infrastructureReport.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Work Type</span>
                        <p className="text-sm font-medium">{report.infrastructureReport.workType}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">DPR Approved</span>
                        <p className="text-sm font-medium">{report.infrastructureReport.dprApproved ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Approved Design Followed</span>
                        <p className="text-sm font-medium">{report.infrastructureReport.approvedDesignFollowed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Sanction Budget</span>
                        <p className="text-sm font-medium">{formatIndianCurrency(Number(report.infrastructureReport.sanctionBudget) || 0)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Expenses Incurred</span>
                        <p className="text-sm font-medium">{formatIndianCurrency(Number(report.infrastructureReport.expensesIncurred) || 0)}</p>
                      </div>
                    </div>

                    {report.infrastructureReport.designChangeDetails && (
                      <div>
                        <span className="text-sm text-muted-foreground">Design Change Details</span>
                        <p className="text-sm font-medium whitespace-pre-wrap">{report.infrastructureReport.designChangeDetails}</p>
                      </div>
                    )}

                    {report.infrastructureReport.workDescription && (
                      <div>
                        <span className="text-sm text-muted-foreground">Work Description</span>
                        <p className="text-sm font-medium whitespace-pre-wrap">{report.infrastructureReport.workDescription}</p>
                      </div>
                    )}

                    {report.infrastructureReport.benefits && (
                      <div>
                        <span className="text-sm text-muted-foreground">Benefits</span>
                        <p className="text-sm font-medium whitespace-pre-wrap">{report.infrastructureReport.benefits}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: "preConstructionPhotos", label: "Pre-Construction" },
                        { key: "duringConstructionPhotos", label: "During Construction" },
                        { key: "postConstructionPhotos", label: "Post-Construction" },
                      ].map(({ key, label }) => {
                        const items = parsePhotos((report.infrastructureReport as any)[key])
                        return (
                          <div key={key}>
                            <div className="text-sm font-medium mb-2">{label}</div>
                            {items.length > 0 ? (
                              <div className="space-y-2">
                                {items.map((file: any, idx: number) => (
                                  <div key={`${file.publicId || idx}`} className="flex items-center justify-between p-2 border rounded">
                                    <div className="truncate text-sm">{file.originalName || file.publicId || "Photo"}</div>
                                    <Button variant="ghost" size="sm" asChild>
                                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                        <Download className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No files</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Infrastructure ID</span>
                      <p className="text-sm font-medium">{report.infrastructureReport.infrastructureUniqueId}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conditional: Household Details */}
              {report.householdReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      Household Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Beneficiary</span>
                        <p className="text-sm font-medium">{report.householdReport.beneficiaryName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Gender</span>
                        <p className="text-sm font-medium">{report.householdReport.gender}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Age</span>
                        <p className="text-sm font-medium">{report.householdReport.age}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Social Group</span>
                        <p className="text-sm font-medium">{report.householdReport.socialGroup}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Male Members</span>
                        <p className="text-sm font-medium">{report.householdReport.maleMembers}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Female Members</span>
                        <p className="text-sm font-medium">{report.householdReport.femaleMembers}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Total Members</span>
                        <p className="text-sm font-medium">{report.householdReport.totalMembers}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Unique ID</span>
                      <p className="text-sm font-medium">{report.householdReport.uniqueId}</p>
                    </div>

                    {report.householdReport.benefits?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Benefits Provided</div>
                        <div className="space-y-2">
                          {report.householdReport.benefits.map((b: any) => (
                            <div key={b.id} className="p-3 border rounded-md bg-white flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{b.benefitType?.name}</div>
                                <div className="text-xs text-muted-foreground">Unit: {b.benefitType?.unitType}</div>
                              </div>
                              <div className="text-sm font-semibold">{b.reportedNumber}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {report.attachments && report.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Attachments ({report.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.attachments.map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getFileIcon(attachment.originalName)}</span>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[200px]">{attachment.originalName}</p>
                              <Badge variant="outline" className="text-xs">
                                {attachment.description || attachment.type || "Attachment"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              downloadFile(attachment.url, attachment.originalName)
                            }
                          >

                              <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Created by {report.creator.firstName} {report.creator.lastName}
                      </span>
                    </div>
                    <span>{format(new Date(report.createdAt), "PPP")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-2">
            Please provide a reason for rejecting this report.
          </p>

          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="w-full border rounded-lg p-3 text-sm"
            placeholder="Enter rejection reason..."
          />

          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => submitRejection(report.id)}
            >
              Submit Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}


const downloadFile = async (url: string, filename: string) => {
  try {
    const res = await fetch(url)
    const blob = await res.blob()

    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename // 👈 preserves extension
    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    toast.error("Failed to download file")
  }
}
