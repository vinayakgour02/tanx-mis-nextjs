"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Building,
  MapPin,
  Award,
  BarChart3,
  IndianRupee,
  UserCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface Project {

  id: string
  name: string
  code?: string | null
  description?: string
  status?: "DRAFT" | "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED"
  startDate?: string
  endDate?: string
  totalBudget?: number
  currency?: string
  theme?: string
  directBeneficiaries?: number
  indirectBeneficiaries?: number
  goal?: string
  program?: {
    id: string
    name: string
    description?: string
    startDate?: string
    endDate?: string
    status?: string
    priority?: string
    sector?: string
    theme?: string
  }
  objectives?: Array<{
    id: string
    level?: string
    description?: string
    orderIndex?: number
  }>
  indicators?: Array<{
    id: string
    name: string
    type?: string
    level?: string
    definition?: string
    dataSource?: string
    frequency?: string
    unitOfMeasure?: string
    baselineValue?: string
  }>
  funding?: Array<{
    id: string
    amount: string
    currency: string
    year: number
    donor?: {
      name: string
      type?: string
      code?: string
    }
  }>
  team?: Array<{
    id: string
    projectId: string
    userId: string
    role: string
    createdAt: string
    updatedAt: string
    user?: {
      id: string
      email: string
      firstName: string
      lastName: string
      avatar?: string
      title?: string
      department?: string
    }
  }>
}

export default function ProjectViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      console.log(data)
      setProject(data)
    } catch (error) {
      toast.error("Failed to load project details")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: Project["status"]) => {
    const colors = {
      DRAFT: "bg-slate-500 hover:bg-slate-600",
      PLANNED: "bg-blue-500 hover:bg-blue-600",
      ACTIVE: "bg-green-500 hover:bg-green-600",
      ON_HOLD: "bg-yellow-500 hover:bg-yellow-600",
      COMPLETED: "bg-purple-500 hover:bg-purple-600",
      CANCELLED: "bg-red-500 hover:bg-red-600",
    }
    return colors[status as keyof typeof colors] || "bg-slate-500 hover:bg-slate-600"
  }

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "🟢"
      case "COMPLETED":
        return "✅"
      case "ON_HOLD":
        return "⏸️"
      case "CANCELLED":
        return "❌"
      case "PLANNED":
        return "📋"
      default:
        return "📝"
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Not set"
      }
      return format(date, "MMM d, yyyy")
    } catch (error) {
      return "Not set"
    }
  }

  const calculateProgress = () => {
    if (!project?.startDate || !project?.endDate) return 0

    const start = new Date(project.startDate)
    const end = new Date(project.endDate)
    const now = new Date()

    if (now < start) return 0
    if (now > end) return 100

    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()

    return Math.round((elapsed / total) * 100)
  }

  const getTotalFunding = () => {
    if (!project?.funding) return 0
    return project.funding.reduce((total, fund) => total + Number(fund.amount), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <Card className="text-center p-12">
          <div className="space-y-4">
            <div className="text-6xl">🔍</div>
            <h2 className="text-2xl font-bold">Project not found</h2>
            <p className="text-muted-foreground">The project you're looking for doesn't exist or has been removed.</p>
            <Button variant="outline" onClick={() => router.push("/org-dashboard/projects")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const progress = calculateProgress()
  const totalFunding = getTotalFunding()

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.push("/org-dashboard/projects")} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <Button
          onClick={() => router.push(`/org-dashboard/projects/${project.id}`)}
          className="self-start sm:self-auto"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Project Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getStatusIcon(project.status)}</div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getStatusColor(project.status)} text-white border-0`}>
                      {project.status
                        ? project.status.charAt(0) + project.status.slice(1).toLowerCase().replace("_", " ")
                        : "Not Set"}
                    </Badge>
                    {project.code && (
                      <Badge variant="outline" className="font-mono">
                        {project.code}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {project.description && (
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl">{project.description}</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:text-right">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-green-600">
                  {project.totalBudget && project.currency
                    ? formatCurrency(project.totalBudget, project.currency)
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beneficiaries</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(project.directBeneficiaries || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Timeline</p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{formatDate(project.startDate || "")}</p>
                  <p className="text-sm font-medium">{formatDate(project.endDate || "")}</p>
                </div>
                {project.startDate && project.endDate && (
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Funding</p>
                <p className="text-lg font-bold">
                  {totalFunding > 0 && project.currency ? formatCurrency(totalFunding, project.currency) : "Not set"}
                </p>
                <p className="text-xs text-muted-foreground">{project.funding?.length || 0} donor(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Direct Impact</p>
                <p className="text-lg font-bold">{(project.directBeneficiaries || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">beneficiaries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Indirect Impact</p>
                <p className="text-lg font-bold">{(project.indirectBeneficiaries || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">beneficiaries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Project Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {project.goal || "No goal specified for this project."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Objectives */}
          {project.objectives && project.objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Objectives ({project.objectives.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.objectives.map((objective, index) => (
                    <div key={objective.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {objective.level || "General"}
                          </Badge>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{objective.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicators */}
          {project.indicators && project.indicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Key Indicators ({project.indicators.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {project.indicators.map((indicator) => (
                    <div key={indicator.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                          {indicator.type || "Indicator"}
                        </Badge>
                        <Badge variant="outline">{indicator.level || "General"}</Badge>
                      </div>
                      <h4 className="font-semibold text-lg mb-3">{indicator.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground font-medium">Definition</p>
                          <p className="mt-1">{indicator.definition || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Data Source</p>
                          <p className="mt-1">{indicator.dataSource || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Frequency</p>
                          <p className="mt-1">{indicator.frequency || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Unit of Measure</p>
                          <p className="mt-1">{indicator.unitOfMeasure || "Not specified"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-muted-foreground font-medium">Baseline Value</p>
                          <p className="mt-1 font-semibold text-blue-600">{indicator.baselineValue || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-500" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Theme</p>
                <p className="font-medium">{project.theme || "Not specified"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Project Code</p>
                <p className="font-mono font-medium">{project.code || "Not assigned"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Program Information */}
          {project.program && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-500" />
                  Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Program Name</p>
                  <p className="font-semibold">{project.program.name}</p>
                </div>
                {project.program.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{project.program.description}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sector</p>
                    <p className="font-medium">{project.program.sector || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium">{project.program.priority || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funding Details */}
          {project.funding && project.funding.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-green-500" />
                  Funding Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.funding.map((fund) => (
                    <div key={fund.id} className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{fund.donor?.name || "Unknown Donor"}</p>
                          {fund.donor?.type && <p className="text-sm text-muted-foreground">{fund.donor.type}</p>}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {fund.year}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(Number(fund.amount), fund.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members */}
          {project.team && project.team.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-500" />
                  Team Members ({project.team.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                      {member.user?.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={`${member.user.firstName} ${member.user.lastName}`}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                          <UserCircle2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Unknown User'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {member.role.replace('_', ' ')}
                          </Badge>
                          {member.user?.title && (
                            <span className="text-sm text-muted-foreground">{member.user.title}</span>
                          )}
                        </div>
                        {member.user?.department && (
                          <p className="text-sm text-muted-foreground mt-1">{member.user.department}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
