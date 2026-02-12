import { useMemo } from "react";
import { useSession } from "next-auth/react";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "write"
  | "admin";

export type NavPermission = {
  resource: string;
  action: PermissionAction;
};

export function usePermissions() {
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role as string | undefined;
  const permissions = ((session?.user as any)?.permissions || []) as NavPermission[];

  const isLoading = status === "loading";
  const isOrgAdmin = role === "ngo_admin";

  // ✅ Build a lookup index for fast permission checks
  const permissionIndex = useMemo(() => {
    const index = new Map<string, Set<PermissionAction>>();

    for (const { resource, action } of permissions) {
      if (!index.has(resource)) index.set(resource, new Set());
      index.get(resource)!.add(action);
    }


    return index;
  }, [permissions, role]);

  // ✅ Permission check logic
 function hasPermission(resource: string, action: PermissionAction): boolean {
  if (isOrgAdmin) return true;

  const actions = permissionIndex.get(resource);
  if (!actions) return false;

  // ✅ Direct match
  if (actions.has(action)) return true;

  // ✅ write implies create/update/delete/read/admin
  if (actions.has("write")) return true;

  // ✅ admin implies all actions
  if (actions.has("admin")) return true;

  return false;
}


  // ✅ Return unified API
  return {
    isLoading,
    isOrgAdmin,
    permissions,
    can: hasPermission,
    hasPermission,
    canRead: (r: string) => hasPermission(r, "read"),
    canCreate: (r: string) => hasPermission(r, "create"),
    canUpdate: (r: string) => hasPermission(r, "update"),
    canDelete: (r: string) => hasPermission(r, "delete"),
    canAdmin: (r: string) => hasPermission(r, "admin"),
  };
}
