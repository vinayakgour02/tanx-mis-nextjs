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


  getDynamicSidebarItems(user.organizationId).then((dynamicItems) => {

    setItems((prev) => {

      const updated = [...prev]

      dynamicItems.forEach((dynamicItem) => {
        const exists = updated.some(
          (item) => item.title === dynamicItem.title
        )


        if (!exists) {
          updated.push(dynamicItem)
        }
      })


      return updated
    })
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
