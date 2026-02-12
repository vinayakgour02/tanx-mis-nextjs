import {
  LayoutDashboard,
  FileText,
  Settings,
  Target,
  Briefcase,
  Calendar,
  BarChart,
  Building2,
  Flag,
  Waypoints,
  UsersRound,
  LocationEdit,
  Clipboard,
  CircleDollarSignIcon,
  TrendingUp,
  CreditCard,
} from "lucide-react"

export type NavPermission = {
  resource: string
  action: "read" | "create" | "update" | "delete" | "write" | "admin"
}

export type SidebarItem = {
  title: string
  href: string
  icon: any
  requiredPermission?: NavPermission
  children?: SidebarItem[]
}

/**
 * ✅ STATIC sidebar items (no API calls here)
 */
export const staticSidebarItems: SidebarItem[] = [
  {
    title: "Organization",
    href: "/org-dashboard",
    icon: LayoutDashboard,
    requiredPermission: { resource: "organization", action: "read" },
    children: [
      {
        title: "Organization Profile",
        href: "/org-dashboard/profile",
        icon: Building2,
        requiredPermission: { resource: "organizations", action: "read" },
      },
      {
        title: "Objectives",
        href: "/org-dashboard/objectives",
        icon: Flag,
        requiredPermission: { resource: "objectives", action: "read" },
      },
      {
        title: "Indicators",
        href: "/org-dashboard/indicators",
        icon: Waypoints,
        requiredPermission: { resource: "indicators", action: "read" },
      },
      {
        title: "Donors",
        href: "/org-dashboard/donors",
        icon: CircleDollarSignIcon,
        requiredPermission: { resource: "donor", action: "read" },
      },
      {
        title: "Team",
        href: "/org-dashboard/team",
        icon: UsersRound,
        requiredPermission: { resource: "team", action: "read" },
      },
      {
        title: "Intervention Coverage",
        href: "/org-dashboard/intervention-coverage",
        icon: LocationEdit,
        requiredPermission: { resource: "intervention-areas", action: "read" },
      },
    ],
  },
  {
    title: "Programs",
    href: "/org-dashboard/programs",
    icon: Target,
    requiredPermission: { resource: "programs", action: "read" },
    children: [
      {
        title: "Program Profile",
        href: "/org-dashboard/programs",
        icon: Target,
        requiredPermission: { resource: "programs", action: "read" },
      },
      {
        title: "Program Objectives",
        href: "/org-dashboard/programs/objective",
        icon: Flag,
        requiredPermission: { resource: "objectives", action: "read" },
      },
      {
        title: "Program Indicators",
        href: "/org-dashboard/programs/indicator",
        icon: Waypoints,
        requiredPermission: { resource: "indicators", action: "read" },
      },
      {
        title: "Program Activities",
        href: "/org-dashboard/programs/activity",
        icon: Calendar,
        requiredPermission: { resource: "activities", action: "read" },
      },
    ],
  },
  {
    title: "Projects",
    href: "/org-dashboard/projects",
    icon: Briefcase,
    requiredPermission: { resource: "projects", action: "read" },
    children: [
      {
        title: "Project Profile",
        href: "/org-dashboard/projects",
        icon: Briefcase,
        requiredPermission: { resource: "projects", action: "read" },
      },
      {
        title: "Project Activities",
        href: "/org-dashboard/activities",
        icon: Calendar,
        requiredPermission: { resource: "activities", action: "read" },
      },
      {
        title: "Plans",
        href: "/org-dashboard/plans",
        icon: Clipboard,
        requiredPermission: { resource: "plans", action: "read" },
      },
    ],
  },
  {
    title: "Reports",
    href: "/org-dashboard/reports",
    icon: FileText,
    requiredPermission: { resource: "reports", action: "read" },
  },
  {
    title: "Analytics",
    href: "/org-dashboard/analytics",
    icon: BarChart,
    requiredPermission: { resource: "analytics", action: "read" },
  },
  {
    title: "Dashboard",
    href: "/org-dashboard/dashboard",
    icon: Briefcase,
    requiredPermission: { resource: "dashboard", action: "read" },
    children: [
      {
        title: "Coverage & Reach",
        href: "/org-dashboard/dashboard/coverage-and-reach",
        icon: Calendar,
        requiredPermission: { resource: "activities", action: "read" },
      },
      {
        title: "Plan vs Progress",
        href: "/org-dashboard/planvsprogress",
        icon: TrendingUp,
        requiredPermission: { resource: "activities", action: "read" },
      },
      {
        title: "Performance Indicators",
        href: "/org-dashboard/performance-indicators",
        icon: Target,
        requiredPermission: { resource: "indicators", action: "read" },
      },
      {
        title: "Project Monitoring",
        href: "/org-dashboard/project-monitoring",
        icon: Target,
        requiredPermission: { resource: "indicators", action: "read" },
      },
    ],
  },
  {
    title: "Settings",
    href: "/org-dashboard/settings",
    icon: Settings,
    requiredPermission: { resource: "settings", action: "read" },
  },
  {
    title: "Subscriptions",
    href: "/org-dashboard/subscription",
    icon: CreditCard,
    requiredPermission: { resource: "subscriptions", action: "read" },
  },
]
