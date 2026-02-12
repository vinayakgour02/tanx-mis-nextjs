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

interface Project {
  id: string
  name: string
}

interface IndicatorData {
  id: string
  name: string
  type: string
  target: number
  achieved: number
  ragRating: string
  level: string
}

export default function ProjectMonitoringPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [session])

  const fetchProjects = async () => {
    try {
      setIsProjectsLoading(true)
      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data)
    } catch (error: any) {
      setError(error.message)
      toast.error("Failed to fetch projects")
    } finally {
      setIsProjectsLoading(false)
    }
  }

  const fetchIndicators = async (projectId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/project-monitoring?projectId=${projectId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch indicators")
      }

      const data = await response.json()
      console.log("indicators", data)
      setIndicators(data)
    } catch (error: any) {
      setError(error.message)
      toast.error("Failed to fetch indicators")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    fetchIndicators(projectId)
  }

  const calculateProgressPercentage = (achieved: number, target: number) => {
    if (target === 0) return 0
    return Math.min((achieved / target) * 100, 100)
  }

  const renderDivergingBar = (achieved: number, target: number) => {
    const percentage = calculateProgressPercentage(achieved, target)
    const barWidth = Math.min(100, percentage)

    return (
      <div className="w-full flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${barWidth}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500 min-w-[40px] text-right">
          {Math.round(percentage)}%
        </span>
      </div>
    )
  }

  if (isProjectsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
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
              onClick={() => {
                if (selectedProject) {
                  fetchIndicators(selectedProject)
                } else {
                  fetchProjects()
                }
              }}
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Monitoring</h1>
            <p className="text-gray-500 text-sm">Monitor indicator targets and progress</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Select Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full md:w-1/2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Project
                </label>
                <Select
                  value={selectedProject || undefined}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Indicators Table */}
          {selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Project Indicators
                  <Badge variant="secondary" className="ml-auto">
                    {indicators.length} indicators
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading indicators...</p>
                    </div>
                  </div>
                ) : indicators.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No indicators found</h3>
                    <p className="text-gray-500">This project doesn't have any indicators yet.</p>
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
                          <TableHead className="text-center font-semibold text-white border border-gray-300">
                            Status
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
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {indicators.map((indicator, index) => {
                          const progressPercentage = calculateProgressPercentage(indicator.achieved, indicator.target)

                          return (
                            <TableRow
                              key={indicator.id}
                              className={index % 2 === 0 ? "bg-white" : "bg-orange-50"}
                            >
                              <TableCell className="font-medium text-gray-900 border border-gray-300">
                                {indicator.name}
                              </TableCell>
                              <TableCell className="border border-gray-300">
                                <Badge variant="outline">{indicator.type}</Badge>
                              </TableCell>
                              <TableCell className="text-center border border-gray-300">
                                {indicator.ragRating === "green" && (
                                  <Circle className="h-4 w-4 fill-green-500 text-green-500 mx-auto" />
                                )}
                                {indicator.ragRating === "amber" && (
                                  <Circle className="h-4 w-4 fill-yellow-500 text-yellow-500 mx-auto" />
                                )}
                                {indicator.ragRating === "red" && (
                                  <Circle className="h-4 w-4 fill-red-500 text-red-500 mx-auto" />
                                )}
                                {indicator.ragRating === "gray" && (
                                  <Circle className="h-4 w-4 fill-gray-500 text-gray-500 mx-auto" />
                                )}
                              </TableCell>
                              <TableCell className="text-right border border-gray-300">
                                {indicator.target.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right border border-gray-300">
                                {indicator.achieved.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right border border-gray-300">
                                {renderDivergingBar(indicator.achieved, indicator.target)}
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
          )}
        </div>
      </div>
    </div>
  )
}