"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavPermission, SidebarItem } from "./navigation-config"

interface SidebarRendererProps {
  items: SidebarItem[]
  pathname: string
 can: (resource: string, action: NavPermission["action"]) => boolean
  isLoading: boolean
  organization?: any
  subscription?: any
  subscriptionPlan?: any
  subscriptionLoading: boolean
  user?: any
}

export default function SidebarRenderer({
  items,
  pathname,
  can,
  isLoading,
  organization,
  subscription,
  subscriptionPlan,
  subscriptionLoading,
  user,
}: SidebarRendererProps) {
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [openParents, setOpenParents] = useState<string[]>([])

  const organizationName = user?.organizationName || "Organization"
  const userImageSrc = user?.role === "ngo_admin" ? user?.image : null
  const avatarSrc = userImageSrc || organizationLogo || ""

  useEffect(() => {
    if (organization?.logo) setOrganizationLogo(organization.logo)
  }, [organization])

  useEffect(() => {
    const parentsWithChildren = items.filter((i) => i.children).map((i) => i.href)
    setOpenParents(parentsWithChildren)
  }, [items])

  const toggleParent = (href: string) => {
    setOpenParents((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const orgInitials = organizationName
    .split(" ")
    .map((word: string) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // ✅ Permission-based filtering
 function filterVisibleItems(items: SidebarItem[]): SidebarItem[] {
  return items
    .map((item) => {
      // ✅ Skip permission for these features
      const bypassPermission =
        item.title === "Asset Management" ||
        item.title === "Youth Bank"

      const hasPermission = bypassPermission
        ? true
        : item.requiredPermission
        ? can(item.requiredPermission.resource, item.requiredPermission.action)
        : true

    

      // ✅ Children handling
      let visibleChildren: SidebarItem[] = []

      if (item.children) {
        if (hasPermission) {
          visibleChildren = item.children
        } else {
          visibleChildren = filterVisibleItems(item.children)
        }
      }

      // ✅ Keep if allowed
      if (hasPermission || visibleChildren.length > 0) {
        return { ...item, children: visibleChildren }
      }

      return null
    })
    .filter(Boolean) as SidebarItem[]
}

  const visibleItems = !isLoading ? filterVisibleItems(items) : []

  const daysRemaining =
    subscription?.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null

  return (
    <Sidebar className="bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/50">
            <AvatarImage src={avatarSrc} alt={organizationName} />
            <AvatarFallback className="bg-primary text-white">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold w-28 text-gray-900">
              {organizationName}
            </span>
            <span className="text-xs text-gray-500 truncate w-40">{user?.email}</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Menu */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu className={isLoading ? "hidden " : "mt-2 overflow-x-hidden"}>
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const isOpen = openParents.includes(item.href)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  onClick={() => {
                    if (item.children && item.children.length > 0) {
                      toggleParent(item.href)
                    }
                  }}
                  className="group hover:bg-primary/10 rounded-md px-3 py-2 transition-colors duration-150"
                >
                  {item.children && item.children.length > 0 ? (
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <item.icon
                          className={`h-5 w-5 ${
                            isActive
                              ? "text-primary"
                              : "text-gray-500 group-hover:text-primary"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isActive ? "text-primary" : "text-gray-700"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {isOpen ? "−" : "+"}
                      </span>
                    </div>
                  ) : (
                    <Link href={item.href} className="flex items-center gap-2 w-full">
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive
                            ? "text-primary"
                            : "text-gray-500 group-hover:text-primary"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isActive ? "text-primary" : "text-gray-700"
                        }`}
                      >
                        {item.title}
                      </span>
                    </Link>
                  )}
                </SidebarMenuButton>

                {/* Children */}
                {item.children && isOpen && (
                  <SidebarMenu className="ml-6 mt-1">
                    {item.children.map((child) => (
                      <SidebarMenuItem key={child.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === child.href}
                          className="group hover:bg-primary/10 rounded-md px-3 py-2 transition-colors duration-150"
                        >
                          <Link href={child.href} className="flex items-center gap-2">
                            <child.icon
                              className={`h-4 w-4 ${
                                pathname === child.href
                                  ? "text-primary"
                                  : "text-gray-400 group-hover:text-primary"
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                pathname === child.href
                                  ? "text-primary"
                                  : "text-gray-600"
                              }`}
                            >
                              {child.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs">
        {subscriptionLoading ? (
          <span className="text-gray-400 italic">Loading subscription…</span>
        ) : subscriptionPlan ? (
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {subscriptionPlan.name}
            </span>
            <span className="text-gray-600">
              {daysRemaining !== null
                ? `${daysRemaining} days remaining`
                : `${subscriptionPlan.durationInDays} days`}
            </span>
          </div>
        ) : (
          <span className="text-gray-500 italic">No active subscription</span>
        )}
      </div>

      <SidebarRail className="bg-gray-50" />
    </Sidebar>
  )
}
