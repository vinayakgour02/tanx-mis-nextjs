"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  Activity,
  TrendingUp,
  Loader2,
  Filter,
  Circle,
  CircleAlert,
  CircleCheck,
  X,
  Menu,
  BarChart3,
  ChevronLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// import { ProgressBarChart } from "@/components/ProgressVsPlanChart"

interface Donor {
  id: string
  name: string
}

interface Program {
  id: string
  name: string
}

interface Objective {
  id: string
  description: string
}

interface PlanProgressItem {
  id: string
  subInterventionName: string
  activityName: string
  projectName: string
  lifeOfProjectTarget: number
  annualTarget: number
  ytdPlan: number
  ytdProgress: number
  ragRating: string
  program: Program | null
  objective: Objective | null
  donors: Donor[]
  unitOfMeasure: string
}

interface FilterOptions {
  interventionAreaId: string | null
  projectId: string | null
  donorId: string | null
  programId: string | null
  objectiveId: string | null
  ragRating: string | null
}

interface ProjectOption {
  id: string
  name: string
}

interface DonorOption {
  id: string
  name: string
}

interface ProgramOption {
  id: string
  name: string
}

interface ObjectiveOption {
  id: string
  description: string
}

interface InterventionAreaOption {
  id: string
  projectId: string
  serialNumber: number
  state: {
    name: string
  } | null
  district: {
    name: string
  } | null
  blockName: {
    name: string
  } | null
  gramPanchayat: {
    name: string
  } | null
  villageName: {
    name: string
  } | null
}

export default function PlanVsProgressPage() {
  const { data: session } = useSession()

  const [data, setData] = useState<PlanProgressItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    interventionAreaId: null,
    projectId: null,
    donorId: null,
    programId: null,
    objectiveId: null,
    ragRating: null,
  })

  // Options for filters
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [donors, setDonors] = useState<DonorOption[]>([])
  const [programs, setPrograms] = useState<ProgramOption[]>([])
  const [objectives, setObjectives] = useState<ObjectiveOption[]>([])
  const [interventionAreas, setInterventionAreas] = useState<InterventionAreaOption[]>([])

  // Filtered options based on selections
  const [filteredProjects, setFilteredProjects] = useState<ProjectOption[]>([])
  const [filteredDonors, setFilteredDonors] = useState<DonorOption[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramOption[]>([])
  const [filteredObjectives, setFilteredObjectives] = useState<ObjectiveOption[]>([])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true) // For collapsible filters

  useEffect(() => {
    if (session?.user) {
      fetchPlanProgressData()
      fetchFilterOptions()
    }
  }, [session])

  const fetchPlanProgressData = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const queryParams = new URLSearchParams()
      if (filters.interventionAreaId) queryParams.append("interventionAreaId", filters.interventionAreaId)
      if (filters.projectId) queryParams.append("projectId", filters.projectId)
      if (filters.donorId) queryParams.append("donorId", filters.donorId)
      if (filters.programId) queryParams.append("programId", filters.programId)
      if (filters.objectiveId) queryParams.append("objectiveId", filters.objectiveId)
      if (filters.ragRating) queryParams.append("ragRating", filters.ragRating)

      const response = await fetch(`/api/org-dashboard/plan-progress?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch plan vs progress data")
      }

      const result = await response.json()
      setData(result)
    } catch (error: any) {
      setError(error.message)
      toast.error("Failed to fetch plan vs progress data")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch("/api/projects")
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
        setFilteredProjects(projectsData)
      }

      // Fetch donors
      const donorsRes = await fetch("/api/donors")
      if (donorsRes.ok) {
        const donorsData = await donorsRes.json()
        setDonors(donorsData)
        setFilteredDonors(donorsData)
      }

      // Fetch programs
      const programsRes = await fetch("/api/programs")
      if (programsRes.ok) {
        const programsData = await programsRes.json()
        setPrograms(programsData)
        setFilteredPrograms(programsData)
      }

      // Fetch objectives
      const objectivesRes = await fetch("/api/objectives")
      if (objectivesRes.ok) {
        const objectivesData = await objectivesRes.json()
        setObjectives(objectivesData)
        setFilteredObjectives(objectivesData)
      }

      // Fetch intervention areas
      try {
        const interventionAreasRes = await fetch(`/api/intervention-areas/master-intervention`)
        if (interventionAreasRes.ok) {
          const interventionAreasData = await interventionAreasRes.json()
          setInterventionAreas(interventionAreasData.map((area: any) => ({
            id: area.id,
            projectId: area.projectId,
            serialNumber: area.serialNumber,
            state: area.state ? { name: area.state.name } : null,
            district: area.district ? { name: area.district.name } : null,
            blockName: area.blockName ? { name: area.blockName.name } : null,
            gramPanchayat: area.gramPanchayat ? { name: area.gramPanchayat.name } : null,
            villageName: area.villageName ? { name: area.villageName.name } : null
          })))
        }
      } catch (error) {
        console.error('Failed to fetch intervention areas:', error)
      }
    } catch (error) {
      console.error("Failed to fetch filter options:", error)
    }
  }

  // Fetch filtered options when selections change
  const fetchFilteredOptions = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.projectId) queryParams.append("projectId", filters.projectId)
      if (filters.programId) queryParams.append("programId", filters.programId)

      // Fetch projects, donors, and programs from the main filter endpoint
      const response = await fetch(`/api/org-dashboard/plan-progress/filters?${queryParams.toString()}`)
      if (response.ok) {
        const result = await response.json()

        // Update filtered options
        if (result.projects) setFilteredProjects(result.projects)
        if (result.donors) setFilteredDonors(result.donors)
        if (result.programs) setFilteredPrograms(result.programs)
      }

      // Fetch objectives based on program and project selection
      if (filters.programId) {
        let objectivesResponse;
        if (filters.projectId) {
          // Fetch objectives for specific project under program
          const objectiveParams = new URLSearchParams({
            programId: filters.programId,
            projectId: filters.projectId
          });
          objectivesResponse = await fetch(`/api/org-dashboard/plan-progress/filters/objectives-by-project-program?${objectiveParams.toString()}`);
        } else {
          // Fetch objectives for all projects under program
          const objectiveParams = new URLSearchParams({
            programId: filters.programId
          });
          objectivesResponse = await fetch(`/api/org-dashboard/plan-progress/filters/objectives-by-program?${objectiveParams.toString()}`);
        }

        if (objectivesResponse?.ok) {
          const objectives = await objectivesResponse.json();
          setFilteredObjectives(objectives);
        }
      } else {
        // Reset objectives if no program is selected
        setFilteredObjectives([]);
      }
    } catch (error) {
      console.error("Failed to fetch filtered options:", error)
    }
  }

  const calculateProgressPercentage = (progress: number, target: number) => {
    if (target === 0) return 0
    return Math.min((progress / target) * 100, 100)
  }

  const getAreaDisplayName = (area: InterventionAreaOption) => {
    const parts = [
      area.state?.name,
      area.district?.name,
      area.blockName?.name,
      area.gramPanchayat?.name,
      area.villageName?.name
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' > ') : `Area ${area.serialNumber}`;
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string | null) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
      }

      // Enforce hierarchical filtering: program first, then project, then objective
      if (key === "programId") {
        // When program changes, reset project and objective
        newFilters.projectId = null;
        newFilters.objectiveId = null;
      } else if (key === "projectId") {
        // When project changes, reset objective
        newFilters.objectiveId = null;
      }

      return newFilters
    })
  }

  const clearFilters = () => {
    setFilters({
      interventionAreaId: null,
      projectId: null,
      donorId: null,
      programId: null,
      objectiveId: null,
      ragRating: null,
    })
  }

  const filteredData = useMemo(() => {
    return data // Filtering is now done on the server side
  }, [data])

  // Apply filters when they change
  useEffect(() => {
    if (session?.user) {
      fetchPlanProgressData()
      fetchFilteredOptions()
    }
  }, [filters, session])

  // Initialize filtered options
  useEffect(() => {
    setFilteredProjects(projects)
    setFilteredDonors(donors)
    setFilteredPrograms(programs)
    setFilteredObjectives(objectives)
  }, [projects, donors, programs, objectives])

  // Handle window resize for responsive filter toggle
  useEffect(() => {
    const handleResize = () => {
      // On large screens, show filters by default but respect user's toggle preference
      if (window.innerWidth >= 1024) {
        // Don't automatically change state, but ensure it's visible by default
      } else {
        // On mobile, keep current state
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading plan vs progress data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading data</div>
            <button
              onClick={fetchPlanProgressData}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
          (sidebarOpen && showFilters) ? "translate-x-0" : "-translate-x-full",
          showFilters ? "lg:static lg:inset-0 lg:translate-x-0" : "lg:hidden"
        )}
      >
        <div className="flex flex-col h-full bg-gray-50">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <div className="space-y-6">
              {/* Toggle Filters Button (Mobile) */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full justify-between bg-white hover:bg-gray-50 border-gray-300 font-medium"
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                  <ChevronLeft className={cn("h-4 w-4 transition-transform", showFilters ? "rotate-90" : "-rotate-90")} />
                </Button>
              </div>

              {/* Fixed the condition to properly show/hide filters */}
              <div className={showFilters ? "block" : "hidden"}>
                {/* Project & Program Filters - Enforce hierarchy */}
                <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Project & Program
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Program *</label>
                      <Select
                        value={filters.programId || undefined}
                        onValueChange={(value) => handleFilterChange("programId", value)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Select Program First" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null as any}>Clear Program</SelectItem>
                          {filteredPrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id} className="max-w-xs truncate">
                              <div className="max-w-xs truncate">{program.name}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Project</label>
                      <Select
                        value={filters.projectId || undefined}
                        onValueChange={(value) => handleFilterChange("projectId", value)}
                        disabled={!filters.programId} // Only enable when program is selected
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder={filters.programId ? "All Projects" : "Select Program First"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null as any}>All Projects</SelectItem>
                          {filteredProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id} className="max-w-xs truncate">
                              <div className="max-w-xs truncate">{project.name}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Donor</label>
                      <Select
                        value={filters.donorId || undefined}
                        onValueChange={(value) => handleFilterChange("donorId", value)}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="All Donors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null as any}>All Donors</SelectItem>
                          {filteredDonors.map((donor) => (
                            <SelectItem key={donor.id} value={donor.id} className="max-w-xs truncate">
                              <div className="max-w-xs truncate">{donor.name}</div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Objective Filters - Only show if program is selected */}
                {filters.programId && (
                  <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Activity className="h-4 w-4 text-green-500" />
                      Objective
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Objective</label>
                        <Select
                          value={filters.objectiveId || undefined}
                          onValueChange={(value) => handleFilterChange("objectiveId", value)}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="All Objectives" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null as any}>All Objectives</SelectItem>
                            {filteredObjectives.map((objective) => (
                              <SelectItem key={objective.id} value={objective.id} className="max-w-xs truncate">
                                <div className="max-w-xs truncate">{objective.description}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="my-2" />

                {/* RAG Status Filter - Moved to last position */}
                <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Target className="h-4 w-4 text-red-500" />
                    RAG Status
                  </h3>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Filter by Status</label>
                    <Select
                      value={filters.ragRating || undefined}
                      onValueChange={(value) => handleFilterChange("ragRating", value)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null as any}>All Status</SelectItem>
                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                            Green (75-100%)
                          </div>
                        </SelectItem>
                        <SelectItem value="amber">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            Amber (25-75%)
                          </div>
                        </SelectItem>
                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                            Red (0-25%)
                          </div>
                        </SelectItem>
                        <SelectItem value="gray">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 fill-gray-500 text-gray-500" />
                            No Target/Progress
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
               
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t bg-gray-100">
            <Button variant="outline" onClick={clearFilters} className="w-full bg-white hover:bg-gray-50 border-gray-300 text-red-500 hover:text-red-600">
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("flex-1 flex flex-col overflow-hidden", showFilters ? "lg:ml-0" : "lg:ml-0")}>
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Plan vs Progress</h1>
                <p className="text-gray-500 text-sm">Track your activities progress against life of project targets</p>
              </div>
            </div>

            {/* Toggle Filters Button (Desktop) */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 bg-white hover:bg-gray-50 border-gray-300 font-medium"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Activities</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{filteredData.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Activities with targets</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg. Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredData.length > 0
                      ? `${Math.round(
                        filteredData.reduce(
                          (sum, item) => sum + calculateProgressPercentage(item.ytdProgress, item.lifeOfProjectTarget),
                          0,
                        ) / filteredData.length,
                      )}%`
                      : "0%"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Across all activities</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">On Track</CardTitle>
                  <CircleCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredData.filter((item) => item.ragRating === "green").length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Green rated activities</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Needs Attention</CardTitle>
                  <CircleAlert className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {filteredData.filter((item) => item.ragRating === "red").length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Red rated activities</p>
                </CardContent>
              </Card>
            </div>

            {/* Activities Progress Table */}
            <Card className="border-0 shadow-none p-0 h-full flex flex-col">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
                  Activities Progress
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Overview of activities against project targets
                </p>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-full rounded-xl border border-gray-300 flex flex-col overflow-hidden shadow-sm">
                  <div className="overflow-y-auto flex-1">
                    <Table className="border-collapse w-full">
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="bg-orange-500 text-white">
                          <TableHead className="py-3 px-4 font-semibold text-white border border-gray-300 rounded-tl-xl">
                            Sub-Intervention
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white border border-gray-300">
                            Activity Name
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-center border border-gray-300 ">
                            Unit
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300">
                            LOP
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300">
                            Annual Target
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300">
                            YTD Plan
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-right border border-gray-300">
                            YTD Progress
                          </TableHead>
                          <TableHead className="py-3 px-4 font-semibold text-white text-center border border-gray-300 rounded-tr-xl">
                            RAG Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center text-gray-500 py-8 border border-gray-300"
                            >
                              No activities found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredData.map((item, i) => {
                            // rag dot color
                            let ragColor = "bg-gray-400";
                            if (item.ragRating === "green") ragColor = "bg-green-500";
                            if (item.ragRating === "amber") ragColor = "bg-yellow-500";
                            if (item.ragRating === "red") ragColor = "bg-red-500";

                            return (
                              <TableRow
                                key={item.id}
                                className={`border border-gray-300 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-orange-50"
                                  } hover:bg-orange-100`}
                              >
                                <TableCell
                                  className={`py-3 px-4 font-medium text-gray-800 border border-gray-300 ${i === filteredData.length - 1 ? "rounded-bl-xl" : ""
                                    }`}
                                >
                                  {item.subInterventionName}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-gray-800 border border-gray-300">
                                  {item.activityName}
                                </TableCell>
                                <TableCell
                                  className={`py-3 px-4 text-center text-gray-700 border border-gray-300 ${i === filteredData.length - 1 ? "rounded-br-xl" : ""
                                    }`}
                                >
                                  {item.unitOfMeasure}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right border border-gray-300">
                                  {item.lifeOfProjectTarget.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right border border-gray-300">
                                  {item.annualTarget.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right border border-gray-300">
                                  {item.ytdPlan.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right border border-gray-300">
                                  {item.ytdProgress.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-3 px-4 text-center border border-gray-300">
                                  <span
                                    className={`inline-block w-3 h-3 rounded-full ${ragColor}`}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {/* <ProgressBarChart data={filteredData} /> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}