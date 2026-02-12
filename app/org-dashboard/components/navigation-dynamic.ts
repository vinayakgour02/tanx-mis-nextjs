// navigation-dynamic.ts
import { UsersRound, Package } from "lucide-react";
import type { SidebarItem } from "./navigation-config";

export async function getDynamicSidebarItems(
  orgId: string
): Promise<SidebarItem[]> {
  if (!orgId) return [];

  try {
    const res = await fetch(`/api/org/hasAccesstoPeopleBank/${orgId}`);
    if (!res.ok) return [];

    const org = await res.json();
    const items: SidebarItem[] = [];

    // ✅ Youth Bank
    if (org?.hasAccesstoPeopleBank) {
      items.push({
        title: "Youth Bank",
        href: "/org-dashboard/youth-bank",
        icon: UsersRound,
        requiredPermission: { resource: "reports", action: "read" },
      });
    }

    // ✅ Asset Management
    if (org?.hasAccessToAssetManagement) {
      items.push({
        title: "Asset Management",
        href: "/org-dashboard/assets",
        icon: Package,
        requiredPermission: { resource: "assets", action: "read" },
      });
    }

    return items;
  } catch (err) {
    console.error("Error fetching org access:", err);
    return [];
  }
}
