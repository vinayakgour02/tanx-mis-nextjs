"use client"

import ProgramPerformancePage from "@/components/analytics/program-performance"
import ProgramThemePerformancePage from "@/components/analytics/program-theme-performance"
import ProjectPerformancePage from "@/components/analytics/project-performance"

export default function ModernAnalyticsDashboard() {
  return (
    <div className="min-h-[70vh]">
      <div className="text-left mb-6 px-8">
          <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor and analyze project, program, and thematic ` performance metrics at a glance.
          </p>
        </div>
      <div className="text-center px-6 flex flex-col gap-y-4">
       
       <ProjectPerformancePage/>
       <ProgramPerformancePage/>
       <ProgramThemePerformancePage/>
      </div>
    </div>
  )
}
