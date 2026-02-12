"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import Image from "next/image"
import {
  ArrowRight,
  Search,
  Users,
  Target,
  FolderTree,
  Layers,
  Building2,
  DollarSign,
  BarChart3,
  Settings,
  CheckCircle,
  ClipboardList,
  PlusCircle,
  Calendar,
  FileText,
  MapPin,
  Waypoints,
  AlertCircle,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import documentationData from "@/data/documentation-content.json"

// Type definitions
interface ImageData {
  src: string
  title: string
  description: string
  alt: string
}

interface Feature {
  name: string
  description: string
  icon: string
  details: string[]
}

interface FeatureModule {
  title: string
  description: string
  icon: string
  color: string
  href: string
  features: Feature[]
}

interface NavigationItem {
  title: string
  href: string
  icon: string
}

interface CommonTask {
  task: string
  steps: string[]
  icon: string
}

interface ModuleFlow {
  title: string
  steps: string[]
}

export default function Documentation() {
  const [isDark, setIsDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  // Handle keyboard events for image dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedImage) {
        setSelectedImage(null)
      }
    }
    if (selectedImage) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [selectedImage])

  const toggleTheme = () => setIsDark(!isDark)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  // Helper function to find matching image based on text content
  const findMatchingImage = (text: string, moduleHref: string): ImageData | undefined => {
    const images = (documentationData.moduleImages as Record<string, ImageData[]>)[moduleHref] || []
    const textLower = text.toLowerCase()

    return images.find((img) => {
      const titleLower = img.title.toLowerCase()
      const srcLower = img.src.toLowerCase()

      // Direct matches for common actions
      if (textLower.includes("new project") && srcLower.includes("new_project")) return true
      if (textLower.includes("create program") && srcLower.includes("create_new_program")) return true
      if (textLower.includes("create plan") && srcLower.includes("create_new_plan")) return true
      if (textLower.includes("new indicator") && srcLower.includes("creating_new_indicator")) return true
      if (textLower.includes("create objective") && srcLower.includes("creating_objective")) return true
      if (textLower.includes("new activity") && srcLower.includes("creating_new_activity")) return true
      if (textLower.includes("add member") && srcLower.includes("dashboard")) return true
      if (textLower.includes("add intervention") && srcLower.includes("add_new_intervention")) return true
      if (textLower.includes("create report") && srcLower.includes("add_report")) return true

      // View/list matches
      if (textLower.includes("open programs") && srcLower.includes("view_all_programs")) return true
      if (textLower.includes("open projects") && srcLower.includes("view_and_search_projects")) return true
      if (textLower.includes("open indicators") && srcLower.includes("viewing_all_indicators")) return true
      if (textLower.includes("open objectives") && srcLower.includes("viewing_all_objectives")) return true
      if (textLower.includes("open activities") && srcLower.includes("viewing_activity")) return true
      if (textLower.includes("open plans") && srcLower.includes("view_all_plans")) return true
      if (textLower.includes("open intervention areas") && srcLower.includes("view_all_intervention")) return true
      if (textLower.includes("open reports") && srcLower.includes("view_all_reports")) return true

      // Basic details and forms
      if (
        textLower.includes("basic details") &&
        (srcLower.includes("basic_detail") || srcLower.includes("new_project_basic"))
      )
        return true
      if (textLower.includes("fill basic details") && srcLower.includes("new_project_basic")) return true
      if (textLower.includes("organization profile") && srcLower.includes("organzation_detail")) return true

      // Status and actions
      if (textLower.includes("status") && srcLower.includes("toggle_project_status")) return true
      if (textLower.includes("edit") && srcLower.includes("edit_view_delete")) return true

      return false
    })
  }

  // Enhanced text renderer with clickable parts
  const renderClickableText = (text: string, moduleHref: string) => {
    const matchingImage = findMatchingImage(text, moduleHref)
    if (!matchingImage) {
      return <span className="text-gray-700 dark:text-gray-300">{text}</span>
    }

    return (
      <span
        className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 font-medium"
        onClick={() => setSelectedImage(matchingImage)}
      >
        {text}
        <span className="text-xs opacity-70">📷</span>
      </span>
    )
  }

  // Icon mapping for string to component conversion
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Building2,
    Layers,
    FolderTree,
    Waypoints,
    Target,
    Calendar,
    ClipboardList,
    Users,
    MapPin,
    FileText,
    BarChart3,
    Settings,
    PlusCircle,
    DollarSign,
    CheckCircle,
    AlertCircle,
  }

  // Convert JSON data to include actual icon components with error handling
  const featureModules = ((documentationData?.featureModules as FeatureModule[]) || []).map((mod) => ({
    ...mod,
    icon: iconMap[mod.icon] || Building2,
    features: (mod.features || []).map((f) => ({
      ...f,
      icon: iconMap[f.icon] || Building2,
    })),
  }))

  // Use imported module flows from JSON data
  const moduleFlows = (documentationData?.moduleFlows as Record<string, ModuleFlow[]>) || {}

  // Convert imported navigation items to include actual icon components
  const navigationItems = ((documentationData?.navigationItems as NavigationItem[]) || []).map((item) => ({
    ...item,
    icon: iconMap[item.icon] || FileText,
  }))

  // Convert imported common tasks to include actual icon components
  const commonTasks = ((documentationData?.commonTasks as CommonTask[]) || []).map((task) => ({
    ...task,
    icon: iconMap[task.icon] || CheckCircle,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950 transition-all duration-500">
      {/* Refined Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Header isDark={isDark} toggleTheme={toggleTheme} />

      {/* Refined Floating Sidebar */}
      <div
        className={`fixed top-24 left-6 z-50 transition-all duration-500 ease-out ${sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 lg:translate-x-0 lg:opacity-100"}`}
      >
        <div className="backdrop-blur-2xl bg-white/80 dark:bg-gray-900/80 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl shadow-black/10 dark:shadow-black/30 max-w-xs h-[calc(100vh-8rem)] overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Navigation</h3>
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {navigationItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm rounded-2xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-medium">{item.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button for Mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-28 left-6 z-40 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:scale-105"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 relative lg:ml-96">
        {/* Refined Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
          <div className="container px-6 relative z-10 py-16">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <div className="inline-block animate-fade-in">
                <span className="px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-xl shadow-lg">
                  📖 Guidelines
                </span>
              </div>
              <h1 className="text-xl md:text-3xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent leading-tight">
                This section will guide you about the different features of SIA MIS software.
              </h1>
              <p className="max-w-4xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Complete M&E system with 13 core modules
              </p>

            </div>
          </div>
        </section>

        {/* Refined Contents */}
        <section className="relative py-16 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="container px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Contents</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[
                  { title: "System Overview", href: "#overview" },
                  { title: "Feature Modules", href: "#modules" },
                  { title: "Common Tasks", href: "#tasks" },
                  { title: "Roles & Permissions", href: "#roles" },
                  { title: "Support", href: "#support" },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="group p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* System Overview Section */}
        <section id="overview" className="relative py-20">
          <div className="container px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-6 mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">System Overview</h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400">
                  Comprehensive monitoring and evaluation platform built for modern organizations.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-1 mb-16">
              

                {/* Core Features Overview */}
                <div className="backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Core Capabilities</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Multi-level Hierarchies</strong> - Programs → Projects → Objectives</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Permission-based Access</strong> - Role-driven UI and functionality</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Real-time Updates</strong> - Live status changes and notifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Data Visualization</strong> - Charts, trends, and analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Multi-currency Support</strong> - Global organization compatibility</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300"><strong>Document Management</strong> - File uploads and attachments</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Modules Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                  { name: 'Dashboard Overview', icon: LayoutDashboard, desc: 'Statistics, charts, activity feeds', color: 'from-blue-500 to-blue-600' },
                  { name: 'Organization Profile', icon: Building2, desc: '12 required + 30+ optional fields', color: 'from-slate-500 to-slate-600' },
                  { name: 'Programs Management', icon: Target, desc: 'High-level coordination', color: 'from-green-500 to-green-600' },
                  { name: 'Projects Management', icon: FolderTree, desc: '6 status types, full lifecycle', color: 'from-blue-500 to-blue-600' },
                  { name: 'Indicators', icon: Waypoints, desc: 'KPI library and metrics', color: 'from-amber-500 to-amber-600' },
                  { name: 'Objectives Framework', icon: Target, desc: '4-level hierarchy system', color: 'from-purple-500 to-purple-600' },
                  { name: 'Activities', icon: Calendar, desc: 'Task scheduling & tracking', color: 'from-orange-500 to-orange-600' },
                  { name: 'Plans', icon: ClipboardList, desc: 'Strategic planning docs', color: 'from-cyan-500 to-cyan-600' },
                  { name: 'Team Management', icon: Users, desc: '3 role types, permissions', color: 'from-indigo-500 to-indigo-600' },
                  { name: 'Intervention Areas', icon: MapPin, desc: 'Geographic mapping', color: 'from-rose-500 to-rose-600' },
                  { name: 'Reports', icon: FileText, desc: 'Multi-format reporting', color: 'from-teal-500 to-teal-600' },
                  { name: 'Analytics', icon: BarChart3, desc: 'Data visualization', color: 'from-fuchsia-500 to-fuchsia-600' },
                  { name: 'Settings', icon: Settings, desc: 'Administrative config', color: 'from-gray-500 to-gray-600' },
                ].map((module, idx) => {
                  const IconComponent = module.icon;
                  return (
                    <div key={idx} className="group rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-1">
                      <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{module.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{module.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Feature Modules */}
        <section id="modules" className="relative py-20">
          <div className="container px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-6 mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">Feature Modules</h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400">
                  Capabilities available in your organization dashboard.
                </p>
              </div>

              <div className="space-y-12">
                {featureModules.map((mod, idx) => {
                  const sectionId = mod.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                  const IconComponent = mod.icon

                  return (
                    <div
                      key={idx}
                      id={sectionId}
                      className="group backdrop-blur-2xl bg-white/70 dark:bg-gray-900/70 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2"
                    >
                      <div className="flex items-start justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-16 h-16 bg-gradient-to-br ${mod.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                          >
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{mod.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">{mod.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-8 md:grid-cols-2">
                        {mod.features.map((f, fidx) => {
                          const FeatureIcon = f.icon
                          return (
                            <div
                              key={fidx}
                              className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                            >
                              <div className="flex items-center gap-3 mb-4">
                                <FeatureIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{f.name}</h4>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{f.description}</p>
                              <ul className="space-y-2">
                                {f.details.map((d, didx) => (
                                  <li key={didx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>

                      {/* Enhanced How-to flows */}
                      {moduleFlows[mod.href]?.length ? (
                        <div className="mt-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-xl p-6">
                          <h4 className="font-bold text-xl mb-6 text-gray-900 dark:text-white">How to</h4>
                          <div className="grid gap-6 md:grid-cols-2">
                            {moduleFlows[mod.href].map((flow, fIdx) => (
                              <div
                                key={fIdx}
                                className="rounded-2xl border border-white/50 dark:border-gray-700/30 bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl p-6"
                              >
                                <h5 className="font-semibold mb-4 text-gray-900 dark:text-white">{flow.title}</h5>
                                <ol className="space-y-3">
                                  {flow.steps.map((s, si) => (
                                    <li key={si} className="flex gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-semibold">
                                        {si + 1}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {renderClickableText(s, mod.href)}
                                      </span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Common Tasks */}
        <section id="tasks" className="relative py-20 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="container px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold mb-12 text-gray-900 dark:text-white">Common Tasks</h2>
              <div className="space-y-8">
                {commonTasks.map((t, i) => {
                  const TaskIcon = t.icon
                  return (
                    <div
                      key={i}
                      className="group rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <TaskIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t.task}</h3>
                      </div>
                      <ol className="space-y-3">
                        {t.steps.map((s, si) => (
                          <li key={si} className="flex gap-4">
                            <span className="flex-shrink-0 w-7 h-7 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full flex items-center justify-center text-sm font-bold">
                              {si + 1}
                            </span>
                            <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Roles & Permissions */}
        <section id="roles" className="relative py-20">
          <div className="container px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold mb-12 text-gray-900 dark:text-white">Roles & Permissions</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {documentationData.rolesAndPermissions.map((r, ri) => (
                  <div
                    key={ri}
                    className="group rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold mb-6 ${r.color}`}>
                      {r.role}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{r.description}</p>
                    <ul className="space-y-3">
                      {r.permissions.map((p, pi) => (
                        <li key={pi} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Support CTA */}
        <section
          id="support"
          className="relative py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
        >
          <div className="container px-6">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Need Help?</h2>
              <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Can't find what you're looking for? Visit our support page to get help.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 px-10 py-6 text-lg rounded-2xl font-semibold"
                  asChild
                >
                  <Link href="/documentation/support">
                    Contact Support
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Enhanced Apple-style Image Dialog */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in-0 duration-500"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-7xl max-h-[95vh] w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedImage.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedImage.description}</p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-3 rounded-2xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Enhanced Image Container */}
            <div className="relative overflow-auto max-h-[calc(95vh-12rem)]">
              <div className="flex items-center justify-center min-h-[500px] p-8">
                <Image
                  src={selectedImage.src || "/placeholder.svg"}
                  alt={selectedImage.alt}
                  width={1400}
                  height={900}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400">Click outside or press ESC to close</p>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
