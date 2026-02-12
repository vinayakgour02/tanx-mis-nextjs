"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { staticSidebarItems, SidebarItem } from "./navigation-config"
import { usePermissions } from "@/hooks/use-permissions"
import { useOrganizationSubscription } from "@/hooks/useSubscriptionPlan"
import SidebarRenderer from "./SidebarRenderer"
import { getDynamicSidebarItems } from "./navigation-dynamic"

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { can, isLoading } = usePermissions()
  const [items, setItems] = useState<SidebarItem[]>(staticSidebarItems)

  const user = session?.user as any

  useEffect(() => {
    if (!user?.organizationId) return

    // 🔹 Fetch dynamic items (like Youth Bank)
    getDynamicSidebarItems(user.organizationId).then((dynamicItems) => {
      if (dynamicItems.length > 0) {
        setItems((prev) => {
          const updated = [...prev]
          // ✅ Add Youth Bank as a separate, top-level sidebar item
          const alreadyExists = updated.some(
            (item) => item.title === "Youth Bank"
          )
          if (!alreadyExists) {
            updated.push(...dynamicItems)
          }
          return updated
        })
      }
    })
  }, [user?.organizationId])

  const {
    organization,
    subscription,
    subscriptionPlan,
    loading: subscriptionLoading,
  } = useOrganizationSubscription()


  return (
    <SidebarRenderer
      items={items}
      can={can}
      isLoading={isLoading}
      pathname={pathname}
      organization={organization}
      subscription={subscription}
      subscriptionPlan={subscriptionPlan}
      subscriptionLoading={subscriptionLoading}
      user={user}
    />
  )
}
