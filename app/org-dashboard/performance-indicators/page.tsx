"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Target,
  Loader2,
  Filter,
  Circle,
  CircleAlert,
  CircleCheck,
  X,
  Menu,
  BarChart3,
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

interface PerformanceIndicator {
  id: string
  name: string
  type: string
  baselineValue: number
  target: number
  achieved: number
  ragRating: string
  level: string
  project: string | null
  program: string | null
  objective: string | null
}

interface FilterOptions {
  indicatorType: string | null
}

export default function PerformanceIndicatorsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<PerformanceIndicator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    indicatorType: null,
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchPerformanceIndicators()
    }
  }, [session, filters])

  const fetchPerformanceIndicators = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const queryParams = new URLSearchParams()
      if (filters.indicatorType) queryParams.append("indicatorType", filters.indicatorType)

      const response = await fetch(`/api/org-dashboard/performance-indicators?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch performance indicators data")
      }

      const result = await response.json()
      setData(result)
    } catch (error: any) {
      setError(error.message)
      toast.error("Failed to fetch performance indicators data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      indicatorType: null,
    })
  }

  const calculateProgressPercentage = (achieved: number, target: number) => {
    if (target === 0) return 0
    return Math.min((achieved / target) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading performance indicators...</p>
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
              onClick={fetchPerformanceIndicators}
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
          "fixed inset-y-0 left-0 z-50 w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Indicator Type Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Indicator Type</label>
                <Select
                  value={filters.indicatorType || undefined}
                  onValueChange={(value) => handleFilterChange("indicatorType", value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="OUTPUT">Output</SelectItem>
                    <SelectItem value="OUTCOME">Outcome</SelectItem>
                    <SelectItem value="IMPACT">Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* RAG Status Filter */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">RAG Status</label>
                <Select
                  onValueChange={(value) => {
                    // We'll filter the data client-side for RAG status
                    // This is just for UI purposes
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
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

          {/* Sidebar Footer */}
          <div className="p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Indicators</h1>
                <p className="text-gray-500 text-sm">Track your organization's performance indicators and achievements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Indicators</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Performance indicators</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">On Track</CardTitle>
                  <CircleCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.filter((item) => item.ragRating === "green").length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Green rated indicators</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Needs Attention</CardTitle>
                  <CircleAlert className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.filter((item) => item.ragRating === "amber").length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Amber rated indicators</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
                  <CircleAlert className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.filter((item) => item.ragRating === "red").length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Red rated indicators</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Indicators Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Indicators
                  <Badge variant="secondary" className="ml-auto">
                    {data.length} indicators
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No indicators found</h3>
                    <p className="text-gray-500 mb-4">No performance indicators match your current filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
  <TableHeader>
    <TableRow className="bg-orange-500">
      <TableHead className="font-semibold text-white border border-gray-300">
        Indicator Name
      </TableHead>
      <TableHead className="font-semibold text-white border border-gray-300">
        Type
      </TableHead>
      <TableHead className="text-right font-semibold text-white border border-gray-300">
        Baseline
      </TableHead>
      <TableHead className="text-right font-semibold text-white border border-gray-300">
        Target
      </TableHead>
      <TableHead className="text-right font-semibold text-white border border-gray-300">
        Achieved
      </TableHead>
      <TableHead className="text-right font-semibold text-white border border-gray-300">
        Progress
      </TableHead>
      <TableHead className="text-center font-semibold text-white border border-gray-300">
        Status
      </TableHead>
    </TableRow>
  </TableHeader>

  <TableBody>
    {data.map((item, index) => {
      const progressPercentage = calculateProgressPercentage(item.achieved, item.target)

      return (
        <TableRow
          key={item.id}
          className={cn(
            "transition-colors",
            index % 2 === 0 ? "bg-white" : "bg-orange-50"
          )}
        >
          <TableCell className="font-medium text-gray-900 border border-gray-300">
            {item.name}
          </TableCell>
          <TableCell className="border border-gray-300">
            <Badge variant="outline">{item.type}</Badge>
          </TableCell>
          <TableCell className="text-right border border-gray-300">
            {item.baselineValue}
          </TableCell>
          <TableCell className="text-right border border-gray-300">
            {item.target}
          </TableCell>
          <TableCell className="text-right border border-gray-300">
            {item.achieved}
          </TableCell>
          <TableCell className="text-right border border-gray-300">
            <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
          </TableCell>
          <TableCell className="text-center border border-gray-300">
            {item.ragRating === "green" && (
              <Circle className="h-4 w-4 fill-green-500 text-green-500 mx-auto" />
            )}
            {item.ragRating === "amber" && (
              <Circle className="h-4 w-4 fill-yellow-500 text-yellow-500 mx-auto" />
            )}
            {item.ragRating === "red" && (
              <Circle className="h-4 w-4 fill-red-500 text-red-500 mx-auto" />
            )}
            {item.ragRating === "gray" && (
              <Circle className="h-4 w-4 fill-gray-500 text-gray-500 mx-auto" />
            )}
          </TableCell>
        </TableRow>
      )
    })}
  </TableBody>
</Table>

                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}